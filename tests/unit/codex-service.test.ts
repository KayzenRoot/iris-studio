import { existsSync, mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { afterEach, describe, expect, it, vi } from "vitest";

import { openIrisStore } from "../../src/server/db/store";
import { CodexExecutionService, CodexServiceError } from "../../src/server/codex/service";
import type { CodexExecutionResult, CodexProbeResult, CodexRunHandle } from "../../src/server/codex/adapter";

const roots: string[] = [];
const stores: ReturnType<typeof openIrisStore>[] = [];

function setup() {
  const root = mkdtempSync(join(tmpdir(), "iris-codex-service-"));
  roots.push(root);
  const dataDirectory = join(root, "data");
  const projectsDirectory = join(dataDirectory, "projects");
  const store = openIrisStore({
    databasePath: join(dataDirectory, "iris-studio.sqlite"),
    projectsDirectory,
    repositoryRoot: process.cwd(),
  });
  stores.push(store);
  const project = store.createProject({
    name: "Codex bridge test",
    brief: {
      siteType: "portfolio",
      description: "Projeto descartável para testar o Codex Bridge local.",
      pages: ["Início"],
      references: [],
      tone: "claro",
      colors: ["#ffffff"],
      mediaDirection: "tipografia",
      motionDirection: "estático",
      qualityMode: "STANDARD",
    },
  });
  return { root, dataDirectory, projectsDirectory, store, project };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => { resolve = complete; });
  return { promise, resolve };
}

function result(status: CodexExecutionResult["status"] = "SUCCEEDED"): CodexExecutionResult {
  return { status, exitCode: status === "SUCCEEDED" ? 0 : 1, signal: null, stdout: "turn.completed\n", stderr: "", elapsedMs: 12 };
}

afterEach(() => {
  for (const store of stores.splice(0)) store.close();
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("bounded Codex execution service", () => {
  it("starts one bounded job in the persisted project workspace and writes a versioned result outside it", async () => {
    const { dataDirectory, projectsDirectory, store, project } = setup();
    const completed = deferred<CodexExecutionResult>();
    const handle: CodexRunHandle = { completed: completed.promise, cancel: vi.fn(async () => {}) };
    const adapter = {
      probe: vi.fn(async (): Promise<CodexProbeResult> => ({ status: "READY", version: "0.159.0", detail: "ready" })),
      start: vi.fn((input: { workspace: string; prompt: string; onOutput: (line: { stream: "stdout" | "stderr"; text: string }) => void }) => {
        if (!input.workspace || !input.prompt || typeof input.onOutput !== "function") throw new Error("Entrada incompleta.");
        return handle;
      }),
    };
    const service = new CodexExecutionService({
      store,
      projectsDirectory: process.platform === "win32" ? projectsDirectory.toLowerCase() : projectsDirectory,
      repositoryRoot: process.cwd(),
      dataDirectory,
      adapter,
    });
    const prompt = "Crie um arquivo marker.txt com o texto IRIS-SAFE-SMOKE.";
    const run = await service.start(project.id, prompt);
    expect(run.status).toBe("RUNNING");
    const startInput = adapter.start.mock.calls[0]?.[0];
    expect(startInput?.prompt).toBe(prompt);
    expect(startInput?.workspace.toLowerCase()).toBe(project.workspacePath.toLowerCase());
    expect(store.listCodexRuns(project.id)).toHaveLength(1);
    expect(run).not.toHaveProperty("workspacePath");
    expect(run).not.toHaveProperty("resultPath");

    completed.resolve(result());
    await vi.waitFor(() => expect(store.getCodexRun(project.id, run.id)?.status).toBe("SUCCEEDED"));
    const finished = store.getCodexRun(project.id, run.id)!;
    expect(finished.resultPath).toContain(join(dataDirectory, "codex-results"));
    expect(finished.resultPath).not.toContain(project.workspacePath);
    expect(existsSync(finished.resultPath!)).toBe(true);
    expect(JSON.parse(finished.resultJson!)).toMatchObject({ schemaVersion: 1, status: "SUCCEEDED", exitCode: 0 });
    expect(finished.resultJson).not.toContain(prompt);
    expect(run.id).toMatch(/^[\da-f-]{36}$/i);
    store.close();
  });

  it("redacts an echoed task prompt before storing process output", async () => {
    const { dataDirectory, projectsDirectory, store, project } = setup();
    let emitOutput: ((line: { stream: "stdout" | "stderr"; text: string }) => void) | undefined;
    const completed = deferred<CodexExecutionResult>();
    const adapter = {
      probe: vi.fn(async (): Promise<CodexProbeResult> => ({ status: "READY", version: "0.159.0", detail: "ready" })),
      start: vi.fn((input: { onOutput: (line: { stream: "stdout" | "stderr"; text: string }) => void }): CodexRunHandle => {
        emitOutput = input.onOutput;
        return { completed: completed.promise, cancel: vi.fn(async () => {}) };
      }),
    };
    const service = new CodexExecutionService({ store, projectsDirectory, repositoryRoot: process.cwd(), dataDirectory, adapter });
    const prompt = "Use this private project brief only to create one local marker file.";
    const run = await service.start(project.id, prompt);
    emitOutput?.({ stream: "stdout", text: `echo: ${prompt}\n` });
    expect(store.getCodexRun(project.id, run.id)?.stdoutLog).toContain("[PROMPT]");
    expect(store.getCodexRun(project.id, run.id)?.stdoutLog).not.toContain(prompt);
    completed.resolve(result());
    await vi.waitFor(() => expect(store.getCodexRun(project.id, run.id)?.status).toBe("SUCCEEDED"));
  });

  it("rejects oversized prompts, non-ChatGPT auth, and a second concurrent job", async () => {
    const { dataDirectory, projectsDirectory, store, project } = setup();
    const completed = deferred<CodexExecutionResult>();
    const adapter = {
      probe: vi.fn(async (): Promise<CodexProbeResult> => ({ status: "READY", version: "0.159.0", detail: "ready" })),
      start: vi.fn((): CodexRunHandle => ({ completed: completed.promise, cancel: vi.fn(async () => {}) })),
    };
    const service = new CodexExecutionService({ store, projectsDirectory, repositoryRoot: process.cwd(), dataDirectory, adapter });

    await expect(service.start(project.id, "x".repeat(8193))).rejects.toBeInstanceOf(CodexServiceError);
    expect(adapter.start).not.toHaveBeenCalled();
    await service.start(project.id, "Tarefa curta em workspace isolado.");
    await expect(service.start(project.id, "Outra tarefa curta em workspace isolado.")).rejects.toMatchObject({ statusCode: 409 });
    expect(adapter.start).toHaveBeenCalledTimes(1);
    store.close();

    const authSetup = setup();
    const unauthenticated = new CodexExecutionService({
      store: authSetup.store,
      projectsDirectory: authSetup.projectsDirectory,
      repositoryRoot: process.cwd(),
      dataDirectory: authSetup.dataDirectory,
      adapter: { ...adapter, probe: vi.fn(async (): Promise<CodexProbeResult> => ({ status: "UNAUTHENTICATED", detail: "login needed" })) },
    });
    await expect(unauthenticated.start(authSetup.project.id, "Tarefa local válida.")).rejects.toMatchObject({ statusCode: 409 });
    expect(authSetup.store.listCodexRuns(authSetup.project.id)).toHaveLength(0);
    authSetup.store.close();
  });

  it("revalidates the workspace tree before starting a process and cancels a running job", async () => {
    const { dataDirectory, projectsDirectory, store, project } = setup();
    mkdirSync(join(project.workspacePath, "nested"));
    const outside = join(dataDirectory, "outside");
    mkdirSync(outside);
    const linkedPath = join(project.workspacePath, "nested", "linked");
    try {
      const { symlinkSync } = await import("node:fs");
      symlinkSync(outside, linkedPath, process.platform === "win32" ? "junction" : "dir");
    } catch {
      // The separate unit path test covers platforms that do not permit test symlinks.
      rmSync(linkedPath, { recursive: true, force: true });
    }
    const adapter = {
      probe: vi.fn(async (): Promise<CodexProbeResult> => ({ status: "READY", version: "0.159.0", detail: "ready" })),
      start: vi.fn((): CodexRunHandle => ({ completed: Promise.resolve(result("CANCELLED")), cancel: vi.fn(async () => {}) })),
    };
    const service = new CodexExecutionService({ store, projectsDirectory, repositoryRoot: process.cwd(), dataDirectory, adapter });
    if (existsSync(linkedPath)) {
      await expect(service.start(project.id, "Tarefa curta e segura.")).rejects.toBeInstanceOf(CodexServiceError);
      expect(adapter.start).not.toHaveBeenCalled();
    }
    store.close();

    const cancelSetup = setup();
    const completed = deferred<CodexExecutionResult>();
    const handle: CodexRunHandle = { completed: completed.promise, cancel: vi.fn(async () => completed.resolve(result("CANCELLED"))) };
    const cancelService = new CodexExecutionService({
      store: cancelSetup.store,
      projectsDirectory: cancelSetup.projectsDirectory,
      repositoryRoot: process.cwd(),
      dataDirectory: cancelSetup.dataDirectory,
      adapter: {
        probe: async () => ({ status: "READY", version: "0.159.0", detail: "ready" }),
        start: () => handle,
      },
    });
    const run = await cancelService.start(cancelSetup.project.id, "Tarefa que será cancelada.");
    await cancelService.cancel(cancelSetup.project.id, run.id);
    expect(handle.cancel).toHaveBeenCalledOnce();
    expect(cancelSetup.store.getCodexRun(cancelSetup.project.id, run.id)?.status).toBe("CANCELLED");
    cancelSetup.store.close();
  });

  it("rejects a persisted path that no longer matches the project's UUID workspace", async () => {
    const { dataDirectory, projectsDirectory, store, project } = setup();
    const database = new Database(join(dataDirectory, "iris-studio.sqlite"));
    const wrongPath = join(dataDirectory, "outside-workspace");
    mkdirSync(wrongPath);
    database.prepare("UPDATE projects SET workspace_path = ? WHERE id = ?").run(wrongPath, project.id);
    database.close();
    const adapter = {
      probe: vi.fn(async (): Promise<CodexProbeResult> => ({ status: "READY", version: "0.159.0", detail: "ready" })),
      start: vi.fn(),
    };
    const service = new CodexExecutionService({ store, projectsDirectory, repositoryRoot: process.cwd(), dataDirectory, adapter });

    await expect(service.start(project.id, "Tarefa local válida e limitada.")).rejects.toMatchObject({ code: "UNSAFE_WORKSPACE_PERSISTED_PATH" });
    expect(adapter.start).not.toHaveBeenCalled();
  });

  it("marks persisted running jobs interrupted after reopening the store without resuming them", () => {
    const { dataDirectory, projectsDirectory, store, project } = setup();
    const run = store.createCodexRun({ projectId: project.id, workspacePath: project.workspacePath, cliVersion: "0.159.0" });
    store.close();
    const reopened = openIrisStore({
      databasePath: join(dataDirectory, "iris-studio.sqlite"),
      projectsDirectory,
      repositoryRoot: process.cwd(),
    });
    stores.push(reopened);
    expect(reopened.getCodexRun(project.id, run.id)).toMatchObject({ status: "INTERRUPTED", errorCode: "PROCESS_RESTARTED", retryClass: "MANUAL_REVIEW" });
    const database = new Database(join(dataDirectory, "iris-studio.sqlite"));
    try {
      expect(database.prepare("SELECT status FROM generation_runs WHERE id = ?").get(run.generationRunId)).toEqual({ status: "FAILED" });
      expect(database.prepare("SELECT status FROM jobs WHERE generation_run_id = ?").get(run.generationRunId)).toEqual({ status: "FAILED" });
    } finally {
      database.close();
    }
  });
});
