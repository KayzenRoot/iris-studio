import { mkdirSync, lstatSync, realpathSync, writeFileSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";

import type { CodexExecutionResult, CodexOutputLine, CodexProbeResult, CodexRunHandle } from "./adapter";
import { redactCodexText } from "./adapter";
import { type CodexRunRecord, type CodexRunStatus, type CodexRunUpdate, type IrisStore } from "../db/store";
import { assertOutsideSourceRepository, assertWorkspaceTreeSafe, isPathInside, resolveProjectWorkspacePath, samePath } from "../workspaces/paths";

export interface CodexAdapterPort {
  probe(): Promise<CodexProbeResult>;
  start(input: { workspace: string; prompt: string; onOutput: (line: CodexOutputLine) => void }): CodexRunHandle;
}

export class CodexServiceError extends Error {
  constructor(message: string, readonly statusCode: number, readonly code: string) {
    super(message);
    this.name = "CodexServiceError";
  }
}

interface ActiveRun {
  projectId: string;
  runId: string;
  prompt: string;
  handle: CodexRunHandle;
  stdout: string;
  stderr: string;
  completion: Promise<void>;
}

interface ServiceOptions {
  store: IrisStore;
  projectsDirectory: string;
  repositoryRoot: string;
  dataDirectory: string;
  adapter: CodexAdapterPort;
}

const MAX_PROMPT_BYTES = 8 * 1024;
const MAX_LOG_BYTES = 32 * 1024;
const RUN_RESULT_SCHEMA_VERSION = 1;

function appendBounded(current: string, addition: string) {
  const safe = redactCodexText(addition);
  const available = MAX_LOG_BYTES - Buffer.byteLength(current);
  if (available <= 0) return current;
  const bytes = Buffer.from(safe, "utf8");
  return bytes.byteLength <= available ? current + safe : current + bytes.subarray(0, available).toString("utf8");
}

function redactLocalPaths(text: string, paths: string[]) {
  let safe = redactCodexText(text);
  for (const path of paths.filter(Boolean).sort((left, right) => right.length - left.length)) {
    const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    safe = safe.replace(new RegExp(escaped, process.platform === "win32" ? "gi" : "g"), "[LOCAL_PATH]");
  }
  return safe;
}

function retryClass(status: CodexRunStatus) {
  if (status === "SUCCEEDED") return "NONE" as const;
  if (status === "CANCELLED" || status === "TIMED_OUT") return "USER_ACTION" as const;
  return "MANUAL_REVIEW" as const;
}

function publicRun(record: CodexRunRecord) {
  return {
    id: record.id,
    generationRunId: record.generationRunId,
    schemaVersion: record.schemaVersion,
    status: record.status,
    cliVersion: record.cliVersion,
    exitCode: record.exitCode,
    retryClass: record.retryClass,
    errorCode: record.errorCode,
    stdout: record.stdoutLog,
    stderr: record.stderrLog,
    result: record.resultJson ? JSON.parse(record.resultJson) as unknown : null,
    createdAt: record.createdAt,
    startedAt: record.startedAt,
    finishedAt: record.finishedAt,
    updatedAt: record.updatedAt,
  };
}

export class CodexExecutionService {
  private readonly store: IrisStore;
  private readonly projectsDirectory: string;
  private readonly repositoryRoot: string;
  private readonly dataDirectory: string;
  private readonly adapter: CodexAdapterPort;
  private active: ActiveRun | null = null;

  constructor(options: ServiceOptions) {
    this.store = options.store;
    this.projectsDirectory = resolve(options.projectsDirectory);
    this.repositoryRoot = resolve(options.repositoryRoot);
    this.dataDirectory = resolve(options.dataDirectory);
    this.adapter = options.adapter;
    if (![this.projectsDirectory, this.repositoryRoot, this.dataDirectory].every(isAbsolute)) {
      throw new Error("Diretórios Codex devem ser absolutos.");
    }
  }

  async start(projectId: string, prompt: string) {
    if (typeof prompt !== "string" || !prompt.trim() || Buffer.byteLength(prompt, "utf8") > MAX_PROMPT_BYTES) {
      throw new CodexServiceError("A tarefa deve conter entre 1 e 8 KiB de texto.", 400, "INVALID_PROMPT");
    }
    if (this.active) throw new CodexServiceError("Já existe uma execução Codex ativa.", 409, "JOB_ALREADY_ACTIVE");
    const project = this.store.getProject(projectId);
    if (!project) throw new CodexServiceError("Projeto não encontrado.", 404, "PROJECT_NOT_FOUND");

    const workspace = this.validateProjectWorkspace(project.id, project.workspacePath);
    const probe = await this.adapter.probe();
    if (probe.status !== "READY") {
      throw new CodexServiceError("Codex CLI não está pronto com uma sessão ChatGPT local.", 409, "CODEX_NOT_READY");
    }
    if (this.active) throw new CodexServiceError("Já existe uma execução Codex ativa.", 409, "JOB_ALREADY_ACTIVE");

    // Recheck the directory tree after the async health probe and immediately before persisting/spawning.
    this.validateProjectWorkspace(project.id, project.workspacePath);
    const record = this.store.createCodexRun({
      projectId,
      workspacePath: workspace,
      cliVersion: probe.version ?? "desconhecida",
    });
    let active: ActiveRun | null = null;
    try {
      // Revalidate directly at the process boundary in case the filesystem changed
      // while the run record was being persisted.
      this.validateProjectWorkspace(project.id, project.workspacePath);
      const handle = this.adapter.start({
        workspace,
        prompt,
        onOutput: (line) => this.captureOutput(active, line),
      });
      active = { projectId, runId: record.id, prompt, handle, stdout: "", stderr: "", completion: Promise.resolve() };
      this.active = active;
      active.completion = handle.completed.then(
        (result) => this.completeRun(active!, result),
        () => this.completeRun(active!, {
          status: "FAILED", exitCode: null, signal: null, stdout: "", stderr: "", elapsedMs: 0,
        }),
      ).finally(() => {
        if (this.active === active) this.active = null;
      });
      return publicRun(record);
    } catch {
      const failedAt = new Date().toISOString();
      this.store.updateCodexRun(record.id, {
        status: "FAILED",
        errorCode: "PROCESS_START_FAILED",
        retryClass: "MANUAL_REVIEW",
        resultJson: JSON.stringify({ schemaVersion: RUN_RESULT_SCHEMA_VERSION, status: "FAILED", errorCode: "PROCESS_START_FAILED" }),
        finishedAt: failedAt,
      });
      throw new CodexServiceError("Não foi possível iniciar o Codex CLI no workspace do projeto.", 500, "PROCESS_START_FAILED");
    }
  }

  list(projectId: string) {
    if (!this.store.getProject(projectId)) throw new CodexServiceError("Projeto não encontrado.", 404, "PROJECT_NOT_FOUND");
    return this.store.listCodexRuns(projectId).map(publicRun);
  }

  get(projectId: string, runId: string) {
    const record = this.store.getCodexRun(projectId, runId);
    if (!record) throw new CodexServiceError("Execução Codex não encontrada.", 404, "RUN_NOT_FOUND");
    return publicRun(record);
  }

  async cancel(projectId: string, runId: string) {
    const record = this.store.getCodexRun(projectId, runId);
    if (!record) throw new CodexServiceError("Execução Codex não encontrada.", 404, "RUN_NOT_FOUND");
    if (record.status !== "RUNNING" && record.status !== "CANCELLING") return publicRun(record);
    const active = this.active;
    if (!active || active.runId !== runId || active.projectId !== projectId) {
      throw new CodexServiceError("A execução ativa não pode ser controlada neste processo.", 409, "RUN_NOT_ACTIVE");
    }
    this.store.updateCodexRun(runId, { status: "CANCELLING" });
    await active.handle.cancel();
    await active.completion;
    return this.get(projectId, runId);
  }

  private validateProjectWorkspace(projectId: string, persistedPath: string) {
    let expected: string;
    let stage = "IDENTITY";
    try {
      stage = "DERIVE";
      expected = resolveProjectWorkspacePath(this.projectsDirectory, projectId);
      stage = "PERSISTED_PATH";
      if (!samePath(persistedPath, expected)) throw new Error("Workspace persistido não corresponde ao UUID do projeto.");
      if (!isAbsolute(persistedPath)) throw new Error("Workspace persistido não é absoluto.");
      stage = "REPOSITORY_BOUNDARY";
      assertOutsideSourceRepository(persistedPath, this.repositoryRoot);
      stage = "PROJECT_TREE";
      assertWorkspaceTreeSafe(expected, this.repositoryRoot);
      stage = "CANONICAL_WORKSPACE";
      const canonicalExpected = realpathSync.native(expected);
      const canonicalProjects = realpathSync.native(this.projectsDirectory);
      if (!samePath(canonicalExpected, expected) || !isPathInside(canonicalProjects, canonicalExpected) || samePath(canonicalExpected, canonicalProjects)) {
        throw new Error("Workspace não canônico ou fora da raiz de projetos.");
      }
      stage = "PROJECTS_ROOT";
      if (lstatSync(this.projectsDirectory).isSymbolicLink() || !samePath(canonicalProjects, this.projectsDirectory)) {
        throw new Error("A raiz de projetos não pode ser symlink ou junction.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      const safeWorkspaceCodes = new Set([
        "WORKSPACE_NONCANONICAL",
        "WORKSPACE_IN_REPOSITORY",
        "WORKSPACE_ENTRY_ESCAPE",
        "WORKSPACE_LINK",
      ]);
      const suffix = safeWorkspaceCodes.has(message) ? message : stage;
      throw new CodexServiceError("Workspace do projeto inválido ou inseguro; a execução foi bloqueada.", 400, `UNSAFE_WORKSPACE_${suffix}`);
    }
    return expected;
  }

  private captureOutput(active: ActiveRun | null, line: CodexOutputLine) {
    if (!active) return;
    const safeText = this.sanitizeOutput(line.text, active.prompt);
    if (line.stream === "stdout") active.stdout = appendBounded(active.stdout, safeText);
    else active.stderr = appendBounded(active.stderr, safeText);
    this.store.updateCodexRun(active.runId, {
      stdoutLog: active.stdout,
      stderrLog: active.stderr,
    });
  }

  private async completeRun(active: ActiveRun, result: CodexExecutionResult) {
    const existing = this.store.getCodexRun(active.projectId, active.runId);
    if (!existing || existing.finishedAt) return;
    let status = result.status;
    let errorCode = status === "FAILED" ? "PROCESS_EXIT_NONZERO" : status === "TIMED_OUT" ? "TIMEOUT" : null;
    const finishedAt = new Date().toISOString();
    const resultDocument = {
      schemaVersion: RUN_RESULT_SCHEMA_VERSION,
      runId: active.runId,
      generationRunId: existing.generationRunId,
      status,
      exitCode: result.exitCode,
      signal: result.signal,
      elapsedMs: Math.max(0, Math.trunc(result.elapsedMs)),
      retryClass: retryClass(status),
      errorCode,
      completedAt: finishedAt,
    };
    let resultPath: string | null;
    try {
      const resultDirectory = join(this.dataDirectory, "codex-results");
      try {
        if (lstatSync(resultDirectory).isSymbolicLink()) throw new Error("Diretório de resultados vinculado não permitido.");
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
      mkdirSync(resultDirectory, { recursive: true, mode: 0o700 });
      const canonicalData = realpathSync.native(this.dataDirectory);
      const canonicalResultDirectory = realpathSync.native(resultDirectory);
      if (lstatSync(resultDirectory).isSymbolicLink() || !isPathInside(canonicalData, canonicalResultDirectory) || isPathInside(this.repositoryRoot, canonicalResultDirectory)) {
        throw new Error("Diretório de resultados inválido.");
      }
      resultPath = join(canonicalResultDirectory, `${active.runId}.json`);
      if (isPathInside(this.repositoryRoot, resultPath) || isPathInside(resolve(existing.workspacePath), resultPath)) {
        throw new Error("Resultado fora da área permitida.");
      }
      writeFileSync(resultPath, JSON.stringify(resultDocument, null, 2), { encoding: "utf8", flag: "wx", mode: 0o600 });
    } catch {
      status = "FAILED";
      errorCode = "RESULT_PERSIST_FAILED";
      resultPath = null;
      resultDocument.status = status;
      resultDocument.errorCode = errorCode;
      resultDocument.retryClass = "MANUAL_REVIEW";
    }
    const update: CodexRunUpdate = {
      status,
      exitCode: result.exitCode,
      retryClass: retryClass(status),
      errorCode,
      stdoutLog: active.stdout || appendBounded("", this.sanitizeOutput(result.stdout, active.prompt)),
      stderrLog: active.stderr || appendBounded("", this.sanitizeOutput(result.stderr, active.prompt)),
      resultJson: JSON.stringify(resultDocument),
      resultPath,
      finishedAt,
    };
    this.store.updateCodexRun(active.runId, update);
  }

  private sanitizeOutput(value: string, prompt: string) {
    let safe = redactLocalPaths(value, [this.projectsDirectory, this.dataDirectory, this.repositoryRoot]);
    for (const candidate of new Set([prompt, prompt.trim()].filter(Boolean))) safe = safe.split(candidate).join("[PROMPT]");
    return safe;
  }
}
