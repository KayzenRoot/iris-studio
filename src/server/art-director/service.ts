import {
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  openSync,
  readFileSync,
  realpathSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { z } from "zod";

import type { CodexExecutionService } from "../codex/service";
import {
  type ArtDirectionApprovalRecord,
  type ArtDirectionRevisionRecord,
  type IrisStore,
  type ProjectBrief,
} from "../db/store";
import {
  assertOutsideSourceRepository,
  assertWorkspaceTreeSafe,
  isPathInside,
  resolveProjectWorkspacePath,
  samePath,
} from "../workspaces/paths";
import { ART_DIRECTOR_PROMPT_PACK_V1, buildCodexTaskPrompt } from "./prompt";
import { canonicalJson, parseCanonicalArtDirection, validateArtDirectionOutput } from "./quality";
import {
  ART_DIRECTOR_PROMPT_VERSION,
  ART_DIRECTION_SCHEMA_VERSION,
  artDirectionOutputSchema,
  type ArtDirectionOutput,
} from "./schemas";

const MAX_BRIEF_FILE_BYTES = 32 * 1024;
const MAX_CONTRACT_FILE_BYTES = 64 * 1024;
const MAX_OUTPUT_FILE_BYTES = 256 * 1024;
const TEMP_FILE_PREFIX = "iris-art-director-";

type BridgeRun = ReturnType<CodexExecutionService["get"]>;
type BridgeStart = Awaited<ReturnType<CodexExecutionService["start"]>>;
type CodexBridgePort = Pick<CodexExecutionService, "start" | "get">;

export class ArtDirectorServiceError extends Error {
  constructor(message: string, readonly statusCode: number, readonly code: string) {
    super(message);
    this.name = "ArtDirectorServiceError";
  }
}

interface ServiceOptions {
  store: IrisStore;
  codex: CodexBridgePort;
  projectsDirectory: string;
  repositoryRoot: string;
}

export interface PublicArtDirectionRevision {
  id: string;
  projectId: string;
  revision: number;
  parentRevisionId: string | null;
  status: ArtDirectionRevisionRecord["status"];
  promptVersion: string;
  schemaVersion: 1;
  qualityMode: ProjectBrief["qualityMode"];
  attemptsUsed: 1 | 2;
  output: ArtDirectionOutput | null;
  canonicalSnapshot: string | null;
  errorCode: string | null;
  createdAt: string;
  updatedAt: string;
  finishedAt: string | null;
  approvedAt: string | null;
}

export interface PublicArtDirectionApproval {
  id: string;
  projectId: string;
  revisionId: string;
  revision: number;
  canonicalSnapshot: string;
  approvedAt: string;
}

function safeErrorCode(value: unknown) {
  if (!value || typeof value !== "object" || !("code" in value) || typeof value.code !== "string") return "CODEX_START_FAILED";
  return /^[A-Z0-9_]{2,64}$/.test(value.code) ? value.code : "CODEX_START_FAILED";
}

function briefDocument(brief: ProjectBrief, revisionRequest: string | null) {
  return canonicalJson({ brief, revisionRequest });
}

function toPublicApproval(record: ArtDirectionApprovalRecord): PublicArtDirectionApproval {
  return {
    id: record.id,
    projectId: record.projectId,
    revisionId: record.revisionId,
    revision: record.revision,
    canonicalSnapshot: record.snapshotJson,
    approvedAt: record.approvedAt,
  };
}

export class ArtDirectorService {
  private readonly store: IrisStore;
  private readonly codex: CodexBridgePort;
  private readonly projectsDirectory: string;
  private readonly repositoryRoot: string;
  private readonly synchronizing = new Set<string>();

  constructor(options: ServiceOptions) {
    this.store = options.store;
    this.codex = options.codex;
    this.projectsDirectory = resolve(options.projectsDirectory);
    this.repositoryRoot = resolve(options.repositoryRoot);
    if (![this.projectsDirectory, this.repositoryRoot].every(isAbsolute)) {
      throw new Error("Os diretórios da direção de arte devem ser absolutos.");
    }
  }

  list(projectId: string) {
    const project = this.requireProject(projectId);
    const revisions = this.store.listArtDirectionRevisions(projectId)
      .map((record) => this.toPublicRevision(record, project.brief));
    const approval = this.store.getArtDirectionApproval(projectId);
    return { revisions, approval: approval ? toPublicApproval(approval) : null };
  }

  get(projectId: string, revisionId: string) {
    const project = this.requireProject(projectId);
    const revision = this.store.getArtDirectionRevision(projectId, revisionId);
    if (!revision) throw new ArtDirectorServiceError("Revisão de direção de arte não encontrada.", 404, "REVISION_NOT_FOUND");
    return this.toPublicRevision(revision, project.brief);
  }

  async generate(projectId: string, input: { parentRevisionId?: string; revisionRequest?: string } = {}) {
    const project = this.requireProject(projectId);
    const parentId = input.parentRevisionId ?? null;
    let revisionRequest: string | null = null;
    if (parentId) {
      const parent = this.store.getArtDirectionRevision(projectId, parentId);
      if (!parent) throw new ArtDirectorServiceError("Revisão de origem não encontrada neste projeto.", 404, "PARENT_REVISION_NOT_FOUND");
      if (parent.status === "GENERATING") {
        throw new ArtDirectorServiceError("A revisão em andamento deve terminar antes de uma nova revisão.", 409, "PARENT_REVISION_ACTIVE");
      }
      if (typeof input.revisionRequest !== "string" || input.revisionRequest.trim().length < 10 || input.revisionRequest.trim().length > 1200) {
        throw new ArtDirectorServiceError("Descreva a revisão com 10 a 1.200 caracteres.", 400, "INVALID_REVISION_REQUEST");
      }
      revisionRequest = input.revisionRequest.trim();
    } else if (input.revisionRequest !== undefined) {
      throw new ArtDirectorServiceError("Um pedido de revisão precisa apontar para uma revisão de origem.", 400, "REVISION_PARENT_REQUIRED");
    }

    if (this.store.listArtDirectionRevisions(projectId).some((revision) => revision.status === "GENERATING")) {
      throw new ArtDirectorServiceError("Finalize ou atualize a direção de arte em andamento antes de iniciar outra.", 409, "ART_DIRECTION_ALREADY_ACTIVE");
    }

    const revision = this.store.createArtDirectionRevision({
      projectId,
      parentRevisionId: parentId,
      promptVersion: ART_DIRECTOR_PROMPT_VERSION,
      schemaVersion: ART_DIRECTION_SCHEMA_VERSION,
      qualityMode: project.brief.qualityMode,
    });
    try {
      this.prepareInitialFiles(revision, project.brief, revisionRequest);
      await this.startBridgeAttempt(revision, project.brief);
    } catch (error) {
      this.finishFailed(revision, safeErrorCode(error));
      if (error instanceof ArtDirectorServiceError) throw error;
      throw new ArtDirectorServiceError(
        "Não foi possível iniciar a direção de arte pelo Codex Bridge local.",
        409,
        safeErrorCode(error),
      );
    }
    return this.get(projectId, revision.id);
  }

  async advance(projectId: string, revisionId: string) {
    const project = this.requireProject(projectId);
    const revision = this.store.getArtDirectionRevision(projectId, revisionId);
    if (!revision) throw new ArtDirectorServiceError("Revisão de direção de arte não encontrada.", 404, "REVISION_NOT_FOUND");
    if (revision.status !== "GENERATING") return this.toPublicRevision(revision, project.brief);
    if (this.synchronizing.has(revision.id)) return this.toPublicRevision(revision, project.brief);
    this.synchronizing.add(revision.id);
    try {
      return await this.advanceGeneration(revision, project.brief);
    } finally {
      this.synchronizing.delete(revision.id);
    }
  }

  approve(projectId: string, revisionId: string, explicitConfirmation: boolean) {
    if (explicitConfirmation !== true) {
      throw new ArtDirectorServiceError("Confirme explicitamente que esta revisão deve ficar imutável.", 400, "APPROVAL_CONFIRMATION_REQUIRED");
    }
    const project = this.requireProject(projectId);
    const revision = this.store.getArtDirectionRevision(projectId, revisionId);
    if (!revision) throw new ArtDirectorServiceError("Revisão de direção de arte não encontrada.", 404, "REVISION_NOT_FOUND");
    if (revision.status !== "DRAFT" || !revision.snapshotJson) {
      throw new ArtDirectorServiceError("Somente uma revisão DRAFT validada pode ser aprovada.", 409, "REVISION_NOT_APPROVABLE");
    }
    const verified = parseCanonicalArtDirection(revision.snapshotJson, project.brief);
    if (!verified.valid || verified.canonicalJson !== revision.snapshotJson) {
      throw new ArtDirectorServiceError("A revisão não passou pela validação canônica de aprovação.", 409, "REVISION_VALIDATION_FAILED");
    }
    try {
      return toPublicApproval(this.store.approveArtDirectionRevision(projectId, revisionId));
    } catch {
      throw new ArtDirectorServiceError("A revisão mudou ou já foi aprovada; atualize a página antes de continuar.", 409, "REVISION_STATE_CHANGED");
    }
  }

  private async advanceGeneration(revision: ArtDirectionRevisionRecord, brief: ProjectBrief) {
    if (!revision.codexRunId) {
      this.finishFailed(revision, "BRIDGE_RUN_REFERENCE_MISSING");
      return this.toPublicRevision(this.requireRevision(revision.projectId, revision.id), brief);
    }

    let run: BridgeRun;
    try {
      run = this.codex.get(revision.projectId, revision.codexRunId);
    } catch {
      this.finishFailed(revision, "BRIDGE_RUN_UNAVAILABLE");
      return this.toPublicRevision(this.requireRevision(revision.projectId, revision.id), brief);
    }
    if (run.status === "RUNNING" || run.status === "CANCELLING") {
      return this.toPublicRevision(revision, brief);
    }
    if (run.status !== "SUCCEEDED") {
      this.finishFailed(revision, "CODEX_" + run.status);
      return this.toPublicRevision(this.requireRevision(revision.projectId, revision.id), brief);
    }

    let raw: unknown;
    try {
      raw = JSON.parse(this.readOutputFile(revision, revision.outputFileName));
    } catch (error) {
      if (error instanceof InvalidArtDirectionOutputError) {
        return this.handleInvalidOutput(revision, brief, error.diagnostics);
      }
      if (error instanceof SyntaxError) {
        return this.handleInvalidOutput(revision, brief, ["outputFile: o conteúdo não contém JSON válido."]);
      }
      this.finishFailed(revision, error instanceof ArtDirectorServiceError ? error.code : "UNSAFE_ART_DIRECTION_OUTPUT");
      return this.toPublicRevision(this.requireRevision(revision.projectId, revision.id), brief);
    }

    const validation = validateArtDirectionOutput(raw, brief);
    if (!validation.valid) return this.handleInvalidOutput(revision, brief, validation.diagnostics);

    const snapshot = canonicalJson(validation.data);
    const cleanupSucceeded = this.cleanupTemporaryFiles(revision);
    if (!cleanupSucceeded) {
      this.finishFailed(revision, "TEMP_FILE_CLEANUP_FAILED", false);
      return this.toPublicRevision(this.requireRevision(revision.projectId, revision.id), brief);
    }
    const updated = this.store.updateArtDirectionRevision(revision.id, {
      status: "DRAFT",
      snapshotJson: snapshot,
      errorCode: null,
      briefFileName: null,
      contractFileName: null,
      outputFileName: null,
      finishedAt: new Date().toISOString(),
    });
    if (!updated) throw new ArtDirectorServiceError("A revisão não pôde ser finalizada.", 500, "REVISION_PERSIST_FAILED");
    return this.toPublicRevision(updated, brief);
  }

  private async handleInvalidOutput(revision: ArtDirectionRevisionRecord, brief: ProjectBrief, diagnostics: string[]) {
    const currentOutput = revision.outputFileName;
    if (currentOutput) this.removeOwnedFile(revision, currentOutput);
    if (revision.attemptsUsed === 1) {
      const nextOutputFileName = this.fileName(revision.id, "attempt-2");
      try {
        this.assertTemporaryInputFiles(revision);
        const updated = this.store.updateArtDirectionRevision(revision.id, {
          attemptsUsed: 2,
          outputFileName: nextOutputFileName,
          errorCode: null,
        });
        if (!updated) throw new Error("revision update failed");
        await this.startBridgeAttempt(updated, brief, diagnostics);
        const withRun = this.requireRevision(updated.projectId, updated.id);
        return this.toPublicRevision(withRun, brief);
      } catch (error) {
        const latest = this.requireRevision(revision.projectId, revision.id);
        this.finishFailed(latest, safeErrorCode(error));
        return this.toPublicRevision(this.requireRevision(revision.projectId, revision.id), brief);
      }
    }
    this.finishFailed(revision, "INVALID_OUTPUT_AFTER_DIAGNOSTIC_RETRY");
    return this.toPublicRevision(this.requireRevision(revision.projectId, revision.id), brief);
  }

  private async startBridgeAttempt(
    revision: ArtDirectionRevisionRecord,
    brief: ProjectBrief,
    diagnostics?: string[],
  ): Promise<BridgeStart> {
    this.validateWorkspace(revision.projectId);
    this.assertTemporaryInputFiles(revision);
    if (!revision.outputFileName) {
      throw new ArtDirectorServiceError("Arquivo de saída da revisão não está definido.", 500, "OUTPUT_FILE_NOT_DEFINED");
    }
    const prompt = buildCodexTaskPrompt({
      briefFileName: revision.briefFileName!,
      contractFileName: revision.contractFileName!,
      outputFileName: revision.outputFileName,
      diagnostics,
    });
    const run = await this.codex.start(revision.projectId, prompt);
    const updated = this.store.updateArtDirectionRevision(revision.id, { codexRunId: run.id });
    if (!updated) throw new ArtDirectorServiceError("A referência do processo Codex não pôde ser salva.", 500, "BRIDGE_RUN_PERSIST_FAILED");
    return run;
  }

  private prepareInitialFiles(revision: ArtDirectionRevisionRecord, brief: ProjectBrief, revisionRequest: string | null) {
    const workspace = this.validateWorkspace(revision.projectId);
    const briefText = briefDocument(brief, revisionRequest);
    const contractText = JSON.stringify({
      promptVersion: ART_DIRECTOR_PROMPT_VERSION,
      editorContract: ART_DIRECTOR_PROMPT_PACK_V1,
      outputSchema: z.toJSONSchema(artDirectionOutputSchema),
    }, null, 2);
    if (Buffer.byteLength(briefText) > MAX_BRIEF_FILE_BYTES) {
      throw new ArtDirectorServiceError("O briefing excede o limite seguro para a direção de arte.", 413, "BRIEF_TOO_LARGE");
    }
    if (Buffer.byteLength(contractText) > MAX_CONTRACT_FILE_BYTES) {
      throw new ArtDirectorServiceError("O contrato de saída excede o limite interno.", 500, "CONTRACT_TOO_LARGE");
    }
    this.writeExclusive(this.artifactPath(workspace, revision, revision.briefFileName), briefText, MAX_BRIEF_FILE_BYTES);
    try {
      this.writeExclusive(this.artifactPath(workspace, revision, revision.contractFileName), contractText, MAX_CONTRACT_FILE_BYTES);
    } catch (error) {
      this.removeOwnedFile(revision, revision.briefFileName!);
      throw error;
    }
  }

  private writeExclusive(path: string, contents: string, maxBytes: number) {
    if (Buffer.byteLength(contents) > maxBytes) {
      throw new ArtDirectorServiceError("Um arquivo temporário da direção de arte excedeu o limite.", 413, "TEMP_INPUT_TOO_LARGE");
    }
    let descriptor: number | undefined;
    try {
      descriptor = openSync(path, "wx", 0o600);
      writeFileSync(descriptor, contents, { encoding: "utf8" });
    } catch {
      throw new ArtDirectorServiceError("Não foi possível criar os arquivos temporários no workspace do projeto.", 500, "TEMP_INPUT_CREATE_FAILED");
    } finally {
      if (descriptor !== undefined) closeSync(descriptor);
    }
  }

  private readOutputFile(revision: ArtDirectionRevisionRecord, fileName: string | null) {
    if (!fileName) throw new ArtDirectorServiceError("O arquivo de saída não está definido.", 409, "OUTPUT_FILE_MISSING");
    const path = this.artifactPath(this.validateWorkspace(revision.projectId), revision, fileName);
    let metadata;
    try {
      metadata = lstatSync(path);
    } catch {
      throw new InvalidArtDirectionOutputError(["outputFile: o arquivo JSON indicado não foi criado."]);
    }
    if (!metadata.isFile() || metadata.isSymbolicLink()) {
      throw new ArtDirectorServiceError("O resultado não é um arquivo regular e confinado.", 409, "UNSAFE_ART_DIRECTION_OUTPUT");
    }
    if (metadata.size > MAX_OUTPUT_FILE_BYTES) {
      throw new InvalidArtDirectionOutputError(["outputFile: o arquivo excede o limite de tamanho permitido."]);
    }
    const canonicalPath = realpathSync.native(path);
    if (!samePath(canonicalPath, path) || !isPathInside(this.validateWorkspace(revision.projectId), canonicalPath)) {
      throw new ArtDirectorServiceError("O resultado escapou do workspace canônico.", 409, "UNSAFE_ART_DIRECTION_OUTPUT");
    }
    const noFollow = typeof constants.O_NOFOLLOW === "number" ? constants.O_NOFOLLOW : 0;
    let descriptor: number | undefined;
    try {
      descriptor = openSync(path, constants.O_RDONLY | noFollow);
      const openedFile = fstatSync(descriptor);
      if (!openedFile.isFile() || openedFile.size > MAX_OUTPUT_FILE_BYTES) {
        throw new InvalidArtDirectionOutputError(["outputFile: o arquivo não é regular ou excede o limite."]);
      }
      if (!samePath(realpathSync.native(path), path)) {
        throw new ArtDirectorServiceError("O resultado mudou de caminho durante a leitura.", 409, "UNSAFE_ART_DIRECTION_OUTPUT");
      }
      return readFileSync(descriptor, { encoding: "utf8" });
    } catch (error) {
      if (error instanceof InvalidArtDirectionOutputError || error instanceof ArtDirectorServiceError) throw error;
      throw new InvalidArtDirectionOutputError(["outputFile: não foi possível ler JSON válido do workspace."]);
    } finally {
      if (descriptor !== undefined) closeSync(descriptor);
    }
  }

  private cleanupTemporaryFiles(revision: ArtDirectionRevisionRecord) {
    const names = [
      revision.briefFileName,
      revision.contractFileName,
      this.fileName(revision.id, "attempt-1"),
      this.fileName(revision.id, "attempt-2"),
    ].filter((name): name is string => name !== null);
    try {
      const workspace = this.workspaceForCleanup(revision.projectId);
      for (const name of new Set(names)) this.removeOwnedFile(revision, name, workspace);
      return true;
    } catch {
      return false;
    }
  }

  private removeOwnedFile(revision: ArtDirectionRevisionRecord, fileName: string, workspace?: string) {
    const resolvedWorkspace = workspace ?? this.workspaceForCleanup(revision.projectId);
    const path = this.artifactPath(resolvedWorkspace, revision, fileName);
    try {
      const metadata = lstatSync(path);
      if (metadata.isDirectory()) throw new Error("Temporary artifact unexpectedly became a directory.");
      // Unlink removes this exact directory entry and never follows a symlink target.
      unlinkSync(path);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }

  private artifactPath(workspace: string, revision: ArtDirectionRevisionRecord, fileName: string | null) {
    const allowed = new Set([
      this.fileName(revision.id, "brief"),
      this.fileName(revision.id, "contract"),
      this.fileName(revision.id, "attempt-1"),
      this.fileName(revision.id, "attempt-2"),
    ]);
    if (!fileName || !allowed.has(fileName)) {
      throw new ArtDirectorServiceError("O nome do arquivo temporário não pertence a esta revisão.", 409, "UNSAFE_ARTIFACT_NAME");
    }
    const path = resolve(workspace, fileName);
    if (dirname(path) !== resolve(workspace) || isPathInside(this.repositoryRoot, path)) {
      throw new ArtDirectorServiceError("O caminho temporário da revisão não está confinado.", 409, "UNSAFE_ARTIFACT_PATH");
    }
    return path;
  }

  private fileName(revisionId: string, suffix: "brief" | "contract" | "attempt-1" | "attempt-2") {
    return TEMP_FILE_PREFIX + revisionId + "-" + suffix + ".json";
  }

  private assertTemporaryInputFiles(revision: ArtDirectionRevisionRecord) {
    const workspace = this.validateWorkspace(revision.projectId);
    for (const fileName of [revision.briefFileName, revision.contractFileName]) {
      if (!fileName) throw new ArtDirectorServiceError("Arquivos temporários da revisão estão incompletos.", 409, "TEMP_INPUT_MISSING");
      let metadata;
      try {
        metadata = lstatSync(this.artifactPath(workspace, revision, fileName));
      } catch {
        throw new ArtDirectorServiceError("Arquivos temporários da revisão não estão disponíveis.", 409, "TEMP_INPUT_MISSING");
      }
      if (!metadata.isFile() || metadata.isSymbolicLink()) {
        throw new ArtDirectorServiceError("Arquivos temporários da revisão não são regulares.", 409, "UNSAFE_TEMP_INPUT");
      }
    }
  }

  private validateWorkspace(projectId: string) {
    const project = this.requireProject(projectId);
    try {
      const expected = resolveProjectWorkspacePath(this.projectsDirectory, projectId);
      if (!samePath(project.workspacePath, expected) || !isAbsolute(project.workspacePath)) throw new Error("workspace mismatch");
      assertOutsideSourceRepository(project.workspacePath, this.repositoryRoot);
      assertWorkspaceTreeSafe(expected, this.repositoryRoot);
      const realExpected = realpathSync.native(expected);
      const realProjects = realpathSync.native(this.projectsDirectory);
      if (!samePath(realExpected, expected) || !isPathInside(realProjects, realExpected) || samePath(realExpected, realProjects)) {
        throw new Error("workspace canonical mismatch");
      }
      if (lstatSync(this.projectsDirectory).isSymbolicLink() || !samePath(realProjects, this.projectsDirectory)) {
        throw new Error("projects root is linked");
      }
      return expected;
    } catch {
      throw new ArtDirectorServiceError("Workspace do projeto inválido ou inseguro; a direção de arte foi bloqueada.", 409, "UNSAFE_WORKSPACE");
    }
  }

  private workspaceForCleanup(projectId: string) {
    const project = this.requireProject(projectId);
    try {
      const expected = resolveProjectWorkspacePath(this.projectsDirectory, projectId);
      if (!samePath(project.workspacePath, expected) || !isAbsolute(project.workspacePath)) throw new Error("workspace mismatch");
      assertOutsideSourceRepository(project.workspacePath, this.repositoryRoot);
      const realExpected = realpathSync.native(expected);
      const realProjects = realpathSync.native(this.projectsDirectory);
      if (!samePath(realExpected, expected) || !isPathInside(realProjects, realExpected) || samePath(realExpected, realProjects)) {
        throw new Error("workspace canonical mismatch");
      }
      if (lstatSync(this.projectsDirectory).isSymbolicLink() || !samePath(realProjects, this.projectsDirectory)) {
        throw new Error("projects root is linked");
      }
      return expected;
    } catch {
      throw new ArtDirectorServiceError("Workspace do projeto inválido; a limpeza foi bloqueada.", 409, "UNSAFE_WORKSPACE");
    }
  }

  private finishFailed(revision: ArtDirectionRevisionRecord, code: string, cleanup = true) {
    const cleanupSucceeded = cleanup ? this.cleanupTemporaryFiles(revision) : false;
    const finalCode = cleanupSucceeded ? code : "TEMP_FILE_CLEANUP_PENDING";
    const updated = this.store.updateArtDirectionRevision(revision.id, {
      status: "FAILED",
      errorCode: finalCode,
      briefFileName: cleanupSucceeded ? null : revision.briefFileName,
      contractFileName: cleanupSucceeded ? null : revision.contractFileName,
      outputFileName: cleanupSucceeded ? null : revision.outputFileName,
      finishedAt: new Date().toISOString(),
    });
    if (!updated) throw new ArtDirectorServiceError("O estado da revisão não pôde ser finalizado.", 500, "REVISION_PERSIST_FAILED");
  }

  private toPublicRevision(record: ArtDirectionRevisionRecord, brief: ProjectBrief): PublicArtDirectionRevision {
    let output: PublicArtDirectionRevision["output"] = null;
    if (record.snapshotJson) {
      const verified = parseCanonicalArtDirection(record.snapshotJson, brief);
      if (!verified.valid || verified.canonicalJson !== record.snapshotJson) {
        throw new ArtDirectorServiceError("O snapshot da revisão não passou pela validação de leitura.", 409, "REVISION_SNAPSHOT_INVALID");
      }
      output = verified.data;
    }
    return {
      id: record.id,
      projectId: record.projectId,
      revision: record.revision,
      parentRevisionId: record.parentRevisionId,
      status: record.status,
      promptVersion: record.promptVersion,
      schemaVersion: record.schemaVersion,
      qualityMode: record.qualityMode,
      attemptsUsed: record.attemptsUsed,
      output,
      canonicalSnapshot: record.snapshotJson,
      errorCode: record.errorCode,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      finishedAt: record.finishedAt,
      approvedAt: record.approvedAt,
    };
  }

  private requireProject(projectId: string) {
    const project = this.store.getProject(projectId);
    if (!project) throw new ArtDirectorServiceError("Projeto não encontrado.", 404, "PROJECT_NOT_FOUND");
    return project;
  }

  private requireRevision(projectId: string, revisionId: string) {
    const revision = this.store.getArtDirectionRevision(projectId, revisionId);
    if (!revision) throw new ArtDirectorServiceError("Revisão de direção de arte não encontrada.", 404, "REVISION_NOT_FOUND");
    return revision;
  }
}

class InvalidArtDirectionOutputError extends Error {
  constructor(readonly diagnostics: string[]) {
    super("Art Director output failed schema validation.");
    this.name = "InvalidArtDirectionOutputError";
  }
}
