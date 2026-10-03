import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";

async function reserveLoopbackPort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Não foi possível reservar uma porta local.");
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return address.port;
}

const testPort = await reserveLoopbackPort();
const dataDirectory = mkdtempSync(join(tmpdir(), "iris-studio-e2e-"));
const playwrightCli = join(process.cwd(), "node_modules", "playwright", "cli.js");
const playwrightEnvironment = { ...process.env, IRIS_DATA_DIR: dataDirectory, IRIS_TEST_PORT: String(testPort) };
delete playwrightEnvironment.NO_COLOR;
const child = spawn(process.execPath, [playwrightCli, "test", ...process.argv.slice(2)], {
  cwd: process.cwd(),
  env: playwrightEnvironment,
  stdio: "inherit",
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => child.kill(signal));
}

let exitCode;
try {
  exitCode = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });
} finally {
  rmSync(dataDirectory, { recursive: true, force: true, maxRetries: 10, retryDelay: 250 });
}

process.exitCode = exitCode;
