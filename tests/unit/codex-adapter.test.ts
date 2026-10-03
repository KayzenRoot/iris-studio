import { EventEmitter } from "node:events";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { join } from "node:path";
import { PassThrough } from "node:stream";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CodexAdapter, redactCodexText } from "../../src/server/codex/adapter";

function fakeProcess(pid: number) {
  const child = new EventEmitter() as EventEmitter & {
    pid: number;
    stdin: PassThrough;
    stdout: PassThrough;
    stderr: PassThrough;
    kill: ReturnType<typeof vi.fn>;
  };
  child.pid = pid;
  child.stdin = new PassThrough();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.kill = vi.fn(() => true);
  return child;
}

describe("Codex CLI adapter", () => {
  afterEach(() => vi.useRealTimers());

  it("shares one process-exit cleanup handler across repeated health probes", () => {
    const exitListeners = process.listenerCount("exit");
    for (let index = 0; index < 25; index += 1) new CodexAdapter({ platform: "win32", findExecutable: () => null });
    expect(process.listenerCount("exit")).toBe(exitListeners);
  });

  it("classifies ChatGPT login without returning or logging CLI output or secrets", async () => {
    const processes = [fakeProcess(501), fakeProcess(502)];
    const calls: Array<{ executable: string; args: string[]; options: Record<string, unknown> }> = [];
    const adapter = new CodexAdapter({
      platform: "linux",
      findExecutable: () => "/opt/codex/codex",
      spawnProcess: ((executable: string, args: string[], options: Record<string, unknown>) => {
        calls.push({ executable, args, options });
        const child = processes.shift()!;
        queueMicrotask(() => {
          child.stdout.end(executable.endsWith("codex") && args[0] === "login"
            ? "Logged in using ChatGPT: private@example.invalid sk-abcdefghijklmnopqrstuvwxyz123456"
            : "codex-cli 0.159.0");
          child.emit("close", 0, null);
        });
        return child;
      }) as never,
    });

    const status = await adapter.probe();
    expect(status).toMatchObject({ status: "READY", version: "0.159.0" });
    expect(JSON.stringify(status)).not.toMatch(/private@example|sk-[a-z0-9]+/i);
    expect(calls.map((call) => call.args)).toEqual([["--version"], ["login", "status"]]);
    expect(calls.every(({ options }) => options.shell === false)).toBe(true);
    expect(JSON.stringify(calls.map(({ options }) => options.env))).not.toMatch(/OPENAI_API_KEY|TOKEN/);
  });

  it("passes task text only through stdin and bounds redacted JSON event logs", async () => {
    const child = fakeProcess(503);
    const spawnProcess = vi.fn(() => child);
    const adapter = new CodexAdapter({
      platform: "linux",
      findExecutable: () => "/opt/codex/codex",
      spawnProcess: spawnProcess as never,
      timeoutMs: 1000,
      maxLogBytes: 90,
    });
    const prompt = "Inspect safely; do not execute this shell-looking text: ; touch ../escape";
    let stdin = "";
    child.stdin.on("data", (chunk) => { stdin += String(chunk); });
    const handle = adapter.start({ workspace: "/tmp/project-safe", prompt, onOutput: vi.fn() });
    const [, args, options] = spawnProcess.mock.calls[0] as unknown as [string, string[], Record<string, unknown>];
    child.stdout.write(`${JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: "ok sk-abcdefghijklmnopqrstuvwxyz123456" } })}\n`);
    child.stdout.end();
    child.stderr.end("safe diagnostic\n");
    child.emit("close", 0, null);

    const completed = await handle.completed;
    expect(args).toContain("--sandbox");
    expect(args).toContain("workspace-write");
    expect(args).toContain("--ephemeral");
    expect(args).toContain("--json");
    expect(args).toContain("--ignore-user-config");
    expect(args).toContain("--skip-git-repo-check");
    expect(args).not.toContain("--ask-for-approval");
    expect(args).not.toContain("--approve-for-me");
    expect(args).toContain("sandbox_workspace_write.writable_roots=[]");
    expect(args).toContain("sandbox_workspace_write.network_access=false");
    expect(args).toContain("-");
    expect(args).not.toContain(prompt);
    expect(options).toMatchObject({ cwd: resolve("/tmp/project-safe"), shell: false, detached: true });
    expect(stdin).toBe(prompt);
    expect(completed.stdout).not.toMatch(/sk-[a-z0-9]+/i);
    expect(Buffer.byteLength(completed.stdout)).toBeLessThanOrEqual(90);
    expect(completed.status).toBe("SUCCEEDED");
  });

  it("treats API-key-only or missing login as unauthenticated", async () => {
    const processes = [fakeProcess(504), fakeProcess(505)];
    const adapter = new CodexAdapter({
      platform: "linux",
      findExecutable: () => "/opt/codex/codex",
      spawnProcess: ((_: string, args: string[]) => {
        const child = processes.shift()!;
        queueMicrotask(() => {
          child.stdout.end(args[0] === "login" ? "Logged in using an API key" : "codex-cli 0.1.0");
          child.emit("close", 0, null);
        });
        return child;
      }) as never,
    });

    expect((await adapter.probe()).status).toBe("UNAUTHENTICATED");
  });

  it("selects only codex.exe from PATH and omits API keys and token variables from child env", async () => {
    const directory = mkdtempSync(join(tmpdir(), "iris-codex-path-"));
    const prior = { PATH: process.env.PATH, OPENAI_API_KEY: process.env.OPENAI_API_KEY, CODEX_API_KEY: process.env.CODEX_API_KEY, PRIVATE_TOKEN: process.env.PRIVATE_TOKEN };
    const child = fakeProcess(509);
    try {
      writeFileSync(join(directory, "codex.cmd"), "not executable by IRIS");
      writeFileSync(join(directory, "codex.exe"), "test executable placeholder");
      process.env.PATH = directory;
      process.env.OPENAI_API_KEY = "sk-never-forward-this-value";
      process.env.CODEX_API_KEY = "codex-private-value";
      process.env.PRIVATE_TOKEN = "private-token-value";
      const calls: Array<{ executable: string; args: string[]; options: Record<string, unknown> }> = [];
      const adapter = new CodexAdapter({
        platform: "win32",
        spawnProcess: ((executable: string, args: string[], options: Record<string, unknown>) => {
          calls.push({ executable, args, options });
          return child;
        }) as never,
      });
      const handle = adapter.start({ workspace: "C:\\Projects\\safe", prompt: "safe task", onOutput: vi.fn() });
      child.emit("close", 0, null);
      await handle.completed;
      expect(calls[0]?.executable).toBe(join(directory, "codex.exe"));
      expect(calls[0]?.args).toContain("workspace-write");
      expect(calls[0]?.args).toContain("windows.sandbox=unelevated");
      expect(calls[0]?.executable.toLowerCase()).not.toMatch(/\.cmd$/);
      expect(JSON.stringify(calls[0]?.options.env)).not.toMatch(/sk-never-forward|codex-private-value|private-token-value/);
    } finally {
      for (const [key, value] of Object.entries(prior)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("cancels by terminating the full POSIX process group and times out bounded jobs", async () => {
    vi.useFakeTimers();
    const child = fakeProcess(506);
    const killed: Array<[number, string]> = [];
    const adapter = new CodexAdapter({
      platform: "linux",
      findExecutable: () => "/opt/codex/codex",
      spawnProcess: (() => child) as never,
      killProcess: ((pid: number, signal: string) => { killed.push([pid, signal]); return true; }) as never,
      timeoutMs: 20,
      killGraceMs: 1,
    });
    const handle = adapter.start({ workspace: "/tmp/project-safe", prompt: "safe task", onOutput: vi.fn() });
    const cancellation = handle.cancel();
    child.emit("close", null, "SIGTERM");
    await vi.advanceTimersByTimeAsync(1);
    await cancellation;
    expect(killed).toEqual([[-506, "SIGTERM"], [-506, "SIGKILL"]]);
    expect(await handle.completed).toMatchObject({ status: "CANCELLED" });

    const timeoutChild = fakeProcess(507);
    const timeoutAdapter = new CodexAdapter({
      platform: "linux",
      findExecutable: () => "/opt/codex/codex",
      spawnProcess: (() => timeoutChild) as never,
      killProcess: (() => true) as never,
      timeoutMs: 20,
      killGraceMs: 1,
    });
    const timed = timeoutAdapter.start({ workspace: "/tmp/project-safe", prompt: "safe task", onOutput: vi.fn() });
    await vi.advanceTimersByTimeAsync(20);
    timeoutChild.emit("close", null, "SIGTERM");
    await vi.advanceTimersByTimeAsync(1);
    expect(await timed.completed).toMatchObject({ status: "TIMED_OUT" });
  });

  it("uses the Windows taskkill tree mode with an argument array", async () => {
    const child = fakeProcess(508);
    const spawnSyncProcess = vi.fn(() => ({ status: 0, signal: null, output: [], pid: 1, stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) }));
    const adapter = new CodexAdapter({
      platform: "win32",
      findExecutable: () => "C:\\Tools\\codex.exe",
      spawnProcess: (() => child) as never,
      spawnSyncProcess: spawnSyncProcess as never,
    });
    const handle = adapter.start({ workspace: "C:\\Projects\\safe", prompt: "safe work", onOutput: vi.fn() });
    await handle.cancel();
    child.emit("close", null, "SIGTERM");
    expect(spawnSyncProcess).toHaveBeenCalledWith(
      expect.stringMatching(/\\System32\\taskkill\.exe$/i),
      ["/PID", "508", "/T", "/F"],
      expect.objectContaining({ shell: false, timeout: 5000 }),
    );
    expect(child.kill).not.toHaveBeenCalled();
    expect(await handle.completed).toMatchObject({ status: "CANCELLED" });
  });

  it("redacts credential-shaped strings before they can reach logs", () => {
    expect(redactCodexText("Bearer eyJhbGciOiJIUzI1NiJ9.eyJhIjoxfQ.signature sk-abcdefghijklmnopqrstuvwxyz123456 ghp_abcdefghijklmnopqrstuvwxyz123456")).toBe("[REDACTED] [REDACTED] [REDACTED]");
  });
});
