import { spawn, spawnSync } from "node:child_process";
import { existsSync, lstatSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { homedir } from "node:os";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export async function reserveLoopbackPort() {
  const server = createServer();
  await new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Não foi possível reservar uma porta local.");
  await new Promise((resolveClose, reject) => server.close((error) => error ? reject(error) : resolveClose()));
  return address.port;
}

export async function waitForHealth(baseUrl, child) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Servidor local encerrou com código ${child.exitCode}.`);
    try {
      const response = await fetch(`${baseUrl}/api/health`, { signal: AbortSignal.timeout(2000) });
      if (response.ok) return await response.json();
    } catch {
      // O servidor de produção pode levar alguns segundos para ficar pronto.
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
  }
  throw new Error("O servidor local não ficou pronto a tempo.");
}

export async function stopServer(child) {
  if (child.exitCode !== null) return;
  const stopped = new Promise((resolveExit) => child.once("exit", resolveExit));
  child.kill("SIGTERM");
  const exited = await Promise.race([stopped.then(() => true), new Promise((resolveDelay) => setTimeout(() => resolveDelay(false), 8000))]);
  if (exited) return;
  if (process.platform === "win32" && Number.isSafeInteger(child.pid)) {
    const taskkill = join(process.env.SystemRoot ?? "C:\\Windows", "System32", "taskkill.exe");
    spawnSync(taskkill, ["/PID", String(child.pid), "/T", "/F"], { shell: false, windowsHide: true, stdio: "ignore", timeout: 5000 });
  } else {
    child.kill("SIGKILL");
  }
}

export async function postJson(url, origin, body) {
  return fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
}

function classifyCodexFailure(run) {
  const output = `${run.stdout ?? ""}\n${run.stderr ?? ""}`.toLowerCase();
  if (/unrecognized (?:option|argument)|unknown (?:option|argument)/.test(output)) return "CLI_ARGUMENT_REJECTED";
  if (/invalid (?:configuration|config)|failed to parse.*config|unknown config key|config.*expected/.test(output)) return "CLI_CONFIG_REJECTED";
  if (/sandbox.*(?:unsupported|unavailable|failed)|(?:unsupported|unavailable).*sandbox/.test(output)) return "SANDBOX_REJECTED";
  if (/not logged in|not authenticated|authentication required/.test(output)) return "AUTHENTICATION_REQUIRED";
  if (/network.*(?:disabled|denied|unavailable)|failed to connect/.test(output)) return "NETWORK_OR_SANDBOX_FAILURE";
  return "NO_SAFE_DIAGNOSTIC_MATCH";
}

function safeEventTypes(run) {
  return [...new Set(String(run.stdout ?? "").split(/\r?\n/)
    .map((line) => line.split(":", 1)[0]?.trim() ?? "")
    .filter((type) => /^[a-z][a-z0-9_.-]{0,79}$/i.test(type)))].slice(0, 8);
}

function safeWorkspaceEntries(workspace) {
  return readdirSync(workspace).slice(0, 8).map((name) => name.replace(/[^a-z0-9._-]/gi, "_").slice(0, 80));
}

async function main() {
  const dataDirectory = mkdtempSync(join(homedir(), "iris-codex-live-smoke-"));
  const port = await reserveLoopbackPort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const nextCli = join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
  const child = spawn(process.execPath, [nextCli, "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: process.cwd(),
    env: { ...process.env, NODE_ENV: "production", IRIS_DATA_DIR: dataDirectory, PORT: String(port), HOSTNAME: "127.0.0.1" },
    shell: false,
    windowsHide: true,
    stdio: "ignore",
  });

  try {
    const health = await waitForHealth(baseUrl, child);
    const codex = health.integrations?.codex;
    if (!codex || codex.status !== "READY") {
      console.log(JSON.stringify({ result: "SKIP", reason: "Codex CLI sem sessão ChatGPT utilizável", status: codex?.status ?? "UNKNOWN", version: codex?.version ?? null }));
      return;
    }

    const projectResponse = await postJson(`${baseUrl}/api/projects`, baseUrl, {
      name: "Smoke Codex descartável",
      brief: {
        siteType: "portfolio",
        description: "Projeto descartável para confirmar o confinamento do Codex Bridge.",
        pages: ["Início"],
        references: [],
        tone: "neutro",
        colors: ["#ffffff"],
        mediaDirection: "tipografia simples",
        motionDirection: "estático",
        qualityMode: "STANDARD",
      },
    });
    if (projectResponse.status !== 201) throw new Error("Não foi possível criar o workspace descartável.");
    const { project } = await projectResponse.json();
    const workspace = join(dataDirectory, "projects", project.id);
    const taskResponse = await postJson(`${baseUrl}/api/projects/${project.id}/codex-runs`, baseUrl, {
      prompt: "Crie apenas um arquivo chamado IRIS-CODEX-SMOKE.txt no diretório de trabalho atual. Escreva exatamente IRIS-CODEX-SMOKE no arquivo. Não leia, altere ou crie nenhum outro arquivo, não acesse a rede e não tente sair do workspace.",
    });
    if (taskResponse.status !== 202) {
      const errorBody = await taskResponse.json().catch(() => ({}));
      const errorCode = typeof errorBody?.code === "string" && /^[A-Z_]+$/.test(errorBody.code)
        ? errorBody.code
        : errorBody?.error === "A operação exige origem local e da mesma origem."
          ? "ORIGIN_POLICY"
          : "UNKNOWN";
      throw new Error(`A tarefa descartável foi recusada (HTTP ${taskResponse.status}, ${errorCode}).`);
    }
    const { run: started } = await taskResponse.json();
    if (started.workspacePath || started.resultPath) throw new Error("A resposta pública expôs um caminho físico.");

    let run = started;
    const terminal = new Set(["SUCCEEDED", "FAILED", "CANCELLED", "TIMED_OUT", "INTERRUPTED"]);
    const deadline = Date.now() + 330_000;
    while (!terminal.has(run.status) && Date.now() < deadline) {
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 1000));
      const response = await fetch(`${baseUrl}/api/projects/${project.id}/codex-runs/${run.id}`, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error("Não foi possível observar o estado da execução descartável.");
      ({ run } = await response.json());
      const publicJson = JSON.stringify(run);
      if (publicJson.includes(dataDirectory) || publicJson.includes(workspace) || run.workspacePath || run.resultPath) {
        throw new Error("A API pública expôs um caminho físico.");
      }
    }
    if (!terminal.has(run.status)) throw new Error("A execução descartável não terminou dentro do limite esperado.");
    if (run.status !== "SUCCEEDED") {
      const errorCode = typeof run.errorCode === "string" && /^[A-Z_]+$/.test(run.errorCode) ? run.errorCode : "UNKNOWN";
      const exitCode = Number.isInteger(run.exitCode) ? run.exitCode : "UNKNOWN";
      throw new Error(`A execução descartável terminou com estado ${run.status} (${errorCode}, exit ${exitCode}, ${classifyCodexFailure(run)}, eventos ${safeEventTypes(run).join(",") || "nenhum"}).`);
    }

    const marker = join(workspace, "IRIS-CODEX-SMOKE.txt");
    if (!existsSync(marker) || lstatSync(marker).isSymbolicLink() || !lstatSync(marker).isFile()) {
      throw new Error(`Arquivo de confirmação ausente (estado ${run.status}; eventos ${safeEventTypes(run).join(",") || "nenhum"}; itens ${safeWorkspaceEntries(workspace).join(",") || "nenhum"}).`);
    }
    if (readFileSync(marker, "utf8").trim() !== "IRIS-CODEX-SMOKE") throw new Error("O conteúdo do arquivo de confirmação diverge do esperado.");
    const files = readdirSync(workspace);
    if (files.length !== 1 || files[0] !== "IRIS-CODEX-SMOKE.txt" || relative(workspace, marker).startsWith("..")) {
      throw new Error("O smoke encontrou alterações adicionais no workspace descartável.");
    }
    const resultPath = join(dataDirectory, "codex-results", `${run.id}.json`);
    const result = JSON.parse(readFileSync(resultPath, "utf8"));
    if (resolve(resultPath).startsWith(resolve(workspace))) throw new Error("O resultado estruturado está dentro do workspace do projeto.");
    if (result.schemaVersion !== 1 || result.status !== "SUCCEEDED" || result.runId !== run.id) {
      throw new Error("O arquivo de resultado estruturado não corresponde à execução.");
    }
    console.log(JSON.stringify({ result: "PASS", codexStatus: codex.status, cliVersion: codex.version, runId: run.id, runStatus: run.status, markerVerified: true, workspaceFiles: files.length, resultFileVersion: result.schemaVersion, credentialsOrAccountOutputRetained: false }));
  } finally {
    await stopServer(child);
    rmSync(dataDirectory, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(JSON.stringify({ result: "FAIL", reason: error instanceof Error ? error.message : "falha desconhecida" }));
    process.exitCode = 1;
  });
}
