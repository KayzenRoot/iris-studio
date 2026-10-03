import { spawn as nodeSpawn, spawnSync as nodeSpawnSync, type ChildProcess } from "node:child_process";
import { accessSync, constants, lstatSync, realpathSync, statSync } from "node:fs";
import { delimiter, isAbsolute, join, resolve } from "node:path";

export type CodexHealthStatus = "READY" | "UNAUTHENTICATED" | "UNAVAILABLE" | "MISCONFIGURED";
export type CodexRunStatus = "SUCCEEDED" | "FAILED" | "CANCELLED" | "TIMED_OUT";

export interface CodexProbeResult {
  status: CodexHealthStatus;
  version?: string;
  detail: string;
}

export interface CodexExecutionResult {
  status: CodexRunStatus;
  exitCode: number | null;
  signal: string | null;
  stdout: string;
  stderr: string;
  elapsedMs: number;
}

export interface CodexOutputLine {
  stream: "stdout" | "stderr";
  text: string;
}

export interface CodexRunHandle {
  completed: Promise<CodexExecutionResult>;
  cancel(): Promise<void>;
}

type SpawnProcess = typeof nodeSpawn;
type SpawnSyncProcess = typeof nodeSpawnSync;

interface AdapterOptions {
  platform?: NodeJS.Platform;
  findExecutable?: () => string | null;
  spawnProcess?: SpawnProcess;
  spawnSyncProcess?: SpawnSyncProcess;
  killProcess?: typeof process.kill;
  timeoutMs?: number;
  killGraceMs?: number;
  maxLogBytes?: number;
}

interface ActiveChildCleanup {
  child: ChildProcess;
  platform: NodeJS.Platform;
  killProcess: typeof process.kill;
  spawnSyncProcess: SpawnSyncProcess;
}

const SECRET_PATTERNS = [
  /\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi,
  /\b(?:sk-[A-Za-z0-9_-]{16,}|sk-proj-[A-Za-z0-9_-]{16,})\b/g,
  /\b(?:ghp|gho|ghu|ghs|github_pat)_[A-Za-z0-9_]{16,}\b/gi,
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g,
  /\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|client[_-]?secret)\s*[:=]\s*[^\s,;]+/gi,
];

const SAFE_ENVIRONMENT_KEYS = [
  "PATH", "PATHEXT", "SystemRoot", "WINDIR", "USERPROFILE", "HOMEDRIVE", "HOMEPATH",
  "LOCALAPPDATA", "APPDATA", "TEMP", "TMP", "HOME", "XDG_CONFIG_HOME", "CODEX_HOME",
  "LANG", "LC_ALL", "TERM", "NO_COLOR",
];

const activeChildProcesses = new Set<ActiveChildCleanup>();

process.once("exit", () => {
  for (const active of activeChildProcesses) {
    const pid = active.child.pid;
    if (!Number.isSafeInteger(pid) || !pid || pid <= 1 || pid === process.pid) continue;
    if (active.platform !== "win32") {
      try { active.killProcess(-pid, "SIGKILL"); } catch { /* best-effort exit cleanup */ }
    } else {
      const systemRoot = process.env.SystemRoot ?? process.env.WINDIR ?? "C:\\Windows";
      try {
        active.spawnSyncProcess(join(systemRoot, "System32", "taskkill.exe"), ["/PID", String(pid), "/T", "/F"], {
          shell: false, windowsHide: true, stdio: "ignore", timeout: 5000,
        });
      } catch { /* process exit cannot await an asynchronous cleanup */ }
    }
  }
});

export function redactCodexText(value: string) {
  return SECRET_PATTERNS.reduce((text, pattern) => text.replace(pattern, "[REDACTED]"), value);
}

function nativeCodexFromPath(platform: NodeJS.Platform, environment: NodeJS.ProcessEnv = process.env) {
  const pathValue = environment.PATH ?? "";
  const names = platform === "win32" ? ["codex.exe"] : ["codex"];
  for (const folder of pathValue.split(delimiter).filter(Boolean)) {
    for (const name of names) {
      const candidate = join(folder, name);
      try {
        const metadata = lstatSync(candidate);
        if (metadata.isSymbolicLink() || !metadata.isFile()) continue;
        accessSync(candidate, platform === "win32" ? constants.F_OK : constants.X_OK);
        const canonical = realpathSync.native(candidate);
        if (!isAbsolute(canonical)) continue;
        if (platform === "win32" && !canonical.toLowerCase().endsWith(".exe")) continue;
        if (statSync(canonical).isFile()) return canonical;
      } catch {
        // Missing and non-executable PATH entries are normal for an optional local dependency.
      }
    }
  }
  return null;
}

function childEnvironment(environment: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  const result = {} as NodeJS.ProcessEnv;
  for (const key of SAFE_ENVIRONMENT_KEYS) {
    const value = environment[key];
    if (value !== undefined) result[key] = value;
  }
  return result;
}

function boundedAppend(current: string, value: string, maxBytes: number) {
  const remaining = maxBytes - Buffer.byteLength(current);
  if (remaining <= 0) return current;
  const buffer = Buffer.from(value, "utf8");
  if (buffer.byteLength <= remaining) return current + value;
  return current + buffer.subarray(0, remaining).toString("utf8");
}

function codexEventSummary(line: string) {
  let event: unknown;
  try {
    event = JSON.parse(line);
  } catch {
    return "[evento JSON inválido ignorado]";
  }
  if (!event || typeof event !== "object" || Array.isArray(event)) return "[evento Codex ignorado]";
  const record = event as Record<string, unknown>;
  const type = typeof record.type === "string" ? record.type.slice(0, 80) : "event";
  const item = record.item && typeof record.item === "object" && !Array.isArray(record.item)
    ? record.item as Record<string, unknown>
    : undefined;
  const textValue = typeof item?.text === "string"
    ? item.text
    : typeof record.message === "string"
      ? record.message
      : undefined;
  const details = textValue ? `: ${textValue.slice(0, 4000)}` : "";
  return redactCodexText(`${type}${details}\n`);
}

function isMissingExecutable(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && (error as NodeJS.ErrnoException).code === "ENOENT");
}

function createLoginMarkerScanner() {
  const markers = ["not logged in", "not authenticated", "logged in", "authenticated", "chatgpt", "api key"];
  const positions = markers.map(() => 0);
  const prefixes = markers.map((marker) => {
    const values = Array.from({ length: marker.length }, () => 0);
    for (let index = 1, prefix = 0; index < marker.length; index += 1) {
      while (prefix > 0 && marker[index] !== marker[prefix]) prefix = values[prefix - 1]!;
      if (marker[index] === marker[prefix]) prefix += 1;
      values[index] = prefix;
    }
    return values;
  });
  const matches = new Set<string>();
  return {
    feed(chunk: Buffer | string) {
      const text = String(chunk).toLowerCase();
      for (const character of text) {
        markers.forEach((marker, index) => {
          let position = positions[index];
          while (position > 0 && marker[position] !== character) position = prefixes[index]![position - 1]!;
          if (marker[position] === character) position += 1;
          if (position === marker.length) {
            matches.add(marker);
            position = prefixes[index]![position - 1]!;
          }
          positions[index] = position;
        });
      }
    },
    has(marker: string) { return matches.has(marker); },
  };
}

export class CodexAdapter {
  private readonly platform: NodeJS.Platform;
  private readonly findExecutable: () => string | null;
  private readonly spawnProcess: SpawnProcess;
  private readonly spawnSyncProcess: SpawnSyncProcess;
  private readonly killProcess: typeof process.kill;
  private readonly timeoutMs: number;
  private readonly killGraceMs: number;
  private readonly maxLogBytes: number;
  constructor(options: AdapterOptions = {}) {
    this.platform = options.platform ?? process.platform;
    this.findExecutable = options.findExecutable ?? (() => nativeCodexFromPath(this.platform));
    this.spawnProcess = options.spawnProcess ?? nodeSpawn;
    this.spawnSyncProcess = options.spawnSyncProcess ?? nodeSpawnSync;
    this.killProcess = options.killProcess ?? process.kill;
    this.timeoutMs = options.timeoutMs ?? 5 * 60 * 1000;
    this.killGraceMs = options.killGraceMs ?? 1500;
    this.maxLogBytes = options.maxLogBytes ?? 32 * 1024;
  }

  async probe(): Promise<CodexProbeResult> {
    let executable: string | null;
    try {
      executable = this.findExecutable();
    } catch {
      return { status: "MISCONFIGURED", detail: "Não foi possível verificar o Codex CLI local." };
    }
    if (!executable) return { status: "UNAVAILABLE", detail: "Codex CLI nativo não encontrado no PATH." };

    try {
      const versionOutput = await this.runProbeCommand(executable, ["--version"]);
      const version = versionOutput.version;
      if (versionOutput.exitCode !== 0 || !version) {
        return { status: "MISCONFIGURED", detail: "Codex CLI encontrado, mas a versão não pôde ser confirmada." };
      }

      const loginOutput = await this.runProbeCommand(executable, ["login", "status"]);
      if (loginOutput.exitCode === 0 && loginOutput.markers.has("logged in") && loginOutput.markers.has("chatgpt") && !loginOutput.markers.has("not logged in")) {
        return { status: "READY", version, detail: "Codex CLI pronto com autenticação ChatGPT local." };
      }
      if (loginOutput.markers.has("not logged in") || loginOutput.markers.has("not authenticated") || loginOutput.markers.has("api key")) {
        return { status: "UNAUTHENTICATED", version, detail: "Faça login no Codex CLI com a conta ChatGPT local." };
      }
      return { status: "UNAUTHENTICATED", version, detail: "Codex CLI sem uma sessão ChatGPT utilizável." };
    } catch (error) {
      if (isMissingExecutable(error)) return { status: "UNAVAILABLE", detail: "Codex CLI nativo não encontrado no PATH." };
      return { status: "MISCONFIGURED", detail: "Não foi possível verificar a versão ou autenticação do Codex CLI." };
    }
  }

  start(input: { workspace: string; prompt: string; onOutput: (line: CodexOutputLine) => void }): CodexRunHandle {
    const executable = this.findExecutable();
    if (!executable) throw new Error("Codex CLI nativo não encontrado no PATH.");
    const workspace = resolve(input.workspace);
    const args = [
      "exec", "--json", "--ephemeral", "--sandbox", "workspace-write",
      "--color", "never", "--ignore-user-config",
      "-c", "sandbox_workspace_write.writable_roots=[]",
      "-c", "sandbox_workspace_write.exclude_slash_tmp=true",
      "-c", "sandbox_workspace_write.exclude_tmpdir_env_var=true",
      "-c", "sandbox_workspace_write.network_access=false",
      ...(this.platform === "win32" ? ["-c", "windows.sandbox=unelevated"] : []),
      "--skip-git-repo-check", "-C", workspace, "-",
    ];
    const startedAt = Date.now();
    const child = this.spawnProcess(executable, args, {
      cwd: workspace,
      env: childEnvironment(),
      shell: false,
      windowsHide: true,
      detached: this.platform !== "win32",
      stdio: ["pipe", "pipe", "pipe"],
    });
    const activeCleanup: ActiveChildCleanup = {
      child,
      platform: this.platform,
      killProcess: this.killProcess,
      spawnSyncProcess: this.spawnSyncProcess,
    };
    activeChildProcesses.add(activeCleanup);

    let stdout = "";
    let stderr = "";
    let stdoutPending = "";
    let stderrPending = "";
    let termination: "CANCELLED" | "TIMED_OUT" | null = null;
    let settled = false;
    let timeout: NodeJS.Timeout | undefined;
    let terminateRun: (reason: "CANCELLED" | "TIMED_OUT") => Promise<void> = async () => {};
    const emitLine = (stream: "stdout" | "stderr", rawLine: string) => {
      if (!rawLine) return;
      const safeText = stream === "stdout"
        ? codexEventSummary(rawLine)
        : `${redactCodexText(rawLine.slice(0, 4000))}\n`;
      if (stream === "stdout") stdout = boundedAppend(stdout, safeText, this.maxLogBytes);
      else stderr = boundedAppend(stderr, safeText, this.maxLogBytes);
      try { input.onOutput({ stream, text: safeText }); } catch { /* UI observers cannot break the child process. */ }
    };
    const consume = (stream: "stdout" | "stderr", chunk: Buffer | string) => {
      const text = stream === "stdout" ? stdoutPending : stderrPending;
      const combined = text + String(chunk);
      const lines = combined.split(/\r?\n/);
      const tail = lines.pop() ?? "";
      for (const line of lines) emitLine(stream, line.slice(0, 8192));
      const boundedTail = tail.slice(0, 8192);
      if (stream === "stdout") stdoutPending = boundedTail;
      else stderrPending = boundedTail;
    };

    const completed = new Promise<CodexExecutionResult>((resolveResult) => {
      const finish = (exitCode: number | null, signal: NodeJS.Signals | null) => {
        if (settled) return;
        settled = true;
        activeChildProcesses.delete(activeCleanup);
        if (timeout) clearTimeout(timeout);
        emitLine("stdout", stdoutPending);
        emitLine("stderr", stderrPending);
        stdoutPending = "";
        stderrPending = "";
        const status = termination ?? (exitCode === 0 ? "SUCCEEDED" : "FAILED");
        resolveResult({ status, exitCode, signal, stdout, stderr, elapsedMs: Date.now() - startedAt });
      };
      child.stdout?.on("data", (chunk: Buffer | string) => consume("stdout", chunk));
      child.stderr?.on("data", (chunk: Buffer | string) => consume("stderr", chunk));
      child.once("error", (error: NodeJS.ErrnoException) => finish(null, error.code === "ENOENT" ? null : "SIGTERM"));
      child.once("close", (code: number | null, signal: NodeJS.Signals | null) => finish(code, signal));
      timeout = setTimeout(() => { void terminateRun("TIMED_OUT"); }, this.timeoutMs);
      child.stdin?.end(input.prompt);

      terminateRun = async (reason: "CANCELLED" | "TIMED_OUT") => {
        if (settled) return;
        termination = reason;
        await this.terminateTree(child, this.platform);
      };
    });
    return {
      completed,
      cancel: async () => { await terminateRun("CANCELLED"); },
    };
  }

  private runProbeCommand(executable: string, args: string[]) {
    return new Promise<{ exitCode: number | null; version?: string; markers: ReturnType<typeof createLoginMarkerScanner> }>((resolveResult, reject) => {
      let child: ChildProcess;
      try {
        child = this.spawnProcess(executable, args, {
          env: childEnvironment(), shell: false, windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
        });
      } catch (error) {
        reject(error);
        return;
      }
      let settled = false;
      let versionBuffer = "";
      let version: string | undefined;
      const markers = createLoginMarkerScanner();
      const timer = setTimeout(() => {
        void this.terminateTree(child, this.platform).finally(() => finish(null, new Error("Codex health probe timed out.")));
      }, 5000);
      const collect = (chunk: Buffer | string) => {
        if (args[0] === "--version") {
          versionBuffer = boundedAppend(versionBuffer, String(chunk), 256);
          version = /\bcodex-cli\s+(v?\d+\.\d+\.\d+(?:[-+][\w.-]+)?)/i.exec(versionBuffer)?.[1]
            ?? /\b(v?\d+\.\d+\.\d+(?:[-+][\w.-]+)?)\b/.exec(versionBuffer)?.[1]
            ?? version;
        } else {
          markers.feed(chunk);
        }
      };
      const finish = (code: number | null, error?: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (error) reject(error);
        else resolveResult({ exitCode: code, version, markers });
      };
      child.stdout?.on("data", collect);
      child.stderr?.on("data", collect);
      child.once("error", (error: NodeJS.ErrnoException) => finish(null, error));
      child.once("close", (code) => finish(code));
    });
  }

  private async terminateTree(child: ChildProcess, platform: NodeJS.Platform) {
    const pid = child.pid;
    if (!Number.isSafeInteger(pid) || !pid || pid <= 1 || pid === process.pid) return;
    if (platform !== "win32") {
      try { this.killProcess(-pid, "SIGTERM"); } catch { try { child.kill("SIGTERM"); } catch { /* already exited */ } }
      await new Promise((resolveDelay) => setTimeout(resolveDelay, this.killGraceMs));
      try { this.killProcess(-pid, "SIGKILL"); } catch { /* process group already exited */ }
      return;
    }

    const systemRoot = process.env.SystemRoot ?? process.env.WINDIR ?? "C:\\Windows";
    const taskkill = join(systemRoot, "System32", "taskkill.exe");
    try {
      const outcome = this.spawnSyncProcess(taskkill, ["/PID", String(pid), "/T", "/F"], {
        shell: false, windowsHide: true, stdio: "ignore", timeout: 5000,
      });
      if (outcome.error || outcome.status !== 0) child.kill("SIGTERM");
    } catch {
      try { child.kill("SIGTERM"); } catch { /* best-effort fallback if taskkill is unavailable */ }
    }
  }
}
