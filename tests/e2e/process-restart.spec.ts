import { spawn, type ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

async function reserveLoopbackPort() {
  const server = createServer();
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Não foi possível reservar uma porta local.");
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return address.port;
}

function startProductionServer(port: number, dataDirectory: string) {
  const nextCli = join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
  return spawn(process.execPath, [nextCli, "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: "production",
      IRIS_DATA_DIR: dataDirectory,
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
    },
    stdio: "ignore",
  });
}

async function waitForServer(child: ChildProcess, url: string) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Servidor de teste terminou com código ${child.exitCode}.`);
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The local server can take a few seconds to become ready.
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error("O servidor local de teste não ficou pronto a tempo.");
}

async function stopServer(child: ChildProcess) {
  if (child.exitCode !== null) return;
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("O servidor de teste não encerrou após SIGTERM."));
    }, 10_000);
    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
    child.kill("SIGTERM");
  });
}

test("projeto permanece disponível após reiniciar o processo local", async () => {
  test.setTimeout(180_000);
  const dataDirectory = mkdtempSync(join(tmpdir(), "iris-studio-process-restart-"));
  const port = await reserveLoopbackPort();
  const baseUrl = `http://127.0.0.1:${port}`;
  let child: ChildProcess | undefined;

  try {
    child = startProductionServer(port, dataDirectory);
    await waitForServer(child, `${baseUrl}/api/projects`);
    const createResponse = await fetch(`${baseUrl}/api/projects`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Reabertura Persistente",
        brief: {
          siteType: "institutional",
          description: "Briefing salvo antes da reinicialização do processo.",
          pages: ["Início", "Sobre"],
          references: [],
          tone: "claro e acolhedor",
          colors: ["#10231e"],
          mediaDirection: "fotografia natural",
          motionDirection: "transições discretas",
          qualityMode: "STANDARD",
        },
      }),
    });
    expect(createResponse.status).toBe(201);
    const { project } = await createResponse.json() as { project: { id: string } };

    await stopServer(child);
    child = undefined;
    child = startProductionServer(port, dataDirectory);
    await waitForServer(child, `${baseUrl}/api/projects`);

    const listResponse = await fetch(`${baseUrl}/api/projects`);
    const list = await listResponse.json() as { projects: Array<{ id: string; name: string }> };
    expect(listResponse.ok).toBe(true);
    expect(list.projects).toContainEqual(expect.objectContaining({ id: project.id, name: "Reabertura Persistente" }));

    const detailResponse = await fetch(`${baseUrl}/api/projects/${project.id}`);
    const detail = await detailResponse.json() as { project: { brief: { description: string } } };
    expect(detailResponse.ok).toBe(true);
    expect(detail.project.brief.description).toBe("Briefing salvo antes da reinicialização do processo.");
  } finally {
    if (child) await stopServer(child);
    rmSync(dataDirectory, { recursive: true, force: true });
  }
});
