import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { postJson, reserveLoopbackPort, stopServer, waitForHealth } from "./run-codex-smoke.mjs";

function safeCode(value) {
  return typeof value === "string" && /^[A-Z0-9_]{2,64}$/.test(value) ? value : "UNKNOWN";
}

async function main() {
  const dataDirectory = mkdtempSync(join(homedir(), "iris-art-director-live-"));
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
      name: "Smoke Art Director descartável",
      brief: {
        siteType: "institutional",
        description: "Projeto descartável para validar uma direção visual local, estruturada e restrita a 2D.",
        goal: "Explicar o método de trabalho e receber uma solicitação de conversa.",
        audience: "Pessoas avaliando um serviço profissional e seu processo de trabalho.",
        pages: ["Início"],
        requiredSections: [{ page: "Início", sections: ["Como funciona"] }],
        references: [],
        tone: "claro, rigoroso e acolhedor",
        colors: ["#22352d", "#f2efe8", "#b87457"],
        mediaDirection: "Fotografia documental apenas quando acrescentar evidência concreta.",
        mediaPreference: "2D_ONLY",
        motionDirection: "Movimento reduzido e sempre ligado à orientação de leitura.",
        qualityMode: "STANDARD",
      },
    });
    if (projectResponse.status !== 201) throw new Error(`Criação descartável recusada (HTTP ${projectResponse.status}).`);
    const { project } = await projectResponse.json();
    const workspace = join(dataDirectory, "projects", project.id);
    const startResponse = await postJson(`${baseUrl}/api/projects/${project.id}/art-direction/revisions`, baseUrl, {});
    if (startResponse.status !== 202) {
      const body = await startResponse.json().catch(() => ({}));
      throw new Error(`M03 não iniciou (HTTP ${startResponse.status}, ${safeCode(body?.code)}).`);
    }
    let { revision } = await startResponse.json();
    console.log(JSON.stringify({ stage: "GERANDO", promptVersion: revision.promptVersion, schemaVersion: revision.schemaVersion }));

    // M02 bounds each bridge run at five minutes; M03 permits one diagnostic retry.
    const deadline = Date.now() + 660_000;
    let lastAttempt = revision.attemptsUsed;
    while (revision.status === "GENERATING" && Date.now() < deadline) {
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 1000));
      const response = await postJson(
        `${baseUrl}/api/projects/${project.id}/art-direction/revisions/${revision.id}/advance`,
        baseUrl,
        {},
      );
      if (!response.ok) throw new Error(`M03 não atualizou a revisão (HTTP ${response.status}).`);
      ({ revision } = await response.json());
      if (revision.attemptsUsed !== lastAttempt) {
        lastAttempt = revision.attemptsUsed;
        console.log(JSON.stringify({ stage: "RETRY_DIAGNOSTICO", attemptsUsed: lastAttempt }));
      }
    }
    if (revision.status !== "DRAFT" || !revision.output || !revision.canonicalSnapshot) {
      throw new Error(`M03 terminou em ${revision.status} (${safeCode(revision.errorCode)}).`);
    }

    const output = revision.output;
    const requestedPages = ["Início"];
    if (output.visualDNA.promptVersion !== revision.promptVersion
      || output.siteBlueprint.promptVersion !== revision.promptVersion
      || output.siteBlueprint.pages.map((page) => page.name).join("\u0000") !== requestedPages.join("\u0000")
      || output.visualDNA.antiGenericConstraints.length !== 8
      || output.siteBlueprint.pages.some((page) => page.sections.length === 0)) {
      throw new Error("O resultado aprovado pelo validador diverge das invariantes do smoke.");
    }
    if (output.siteBlueprint.pages.flatMap((page) => page.sections)
      .some((section) => section.media.strategy === "REALTIME_3D")) {
      throw new Error("A preferência 2D_ONLY foi violada pelo resultado validado.");
    }

    const approvalResponse = await postJson(
      `${baseUrl}/api/projects/${project.id}/art-direction/revisions/${revision.id}/approve`,
      baseUrl,
      { confirmImmutableApproval: true },
    );
    if (!approvalResponse.ok) throw new Error(`A aprovação explícita não foi persistida (HTTP ${approvalResponse.status}).`);
    const { approval } = await approvalResponse.json();
    const reopenedResponse = await fetch(`${baseUrl}/api/projects/${project.id}/art-direction/revisions`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!reopenedResponse.ok) throw new Error("A aprovação não pôde ser reaberta pela API local.");
    const reopened = await reopenedResponse.json();
    if (approval.canonicalSnapshot !== revision.canonicalSnapshot
      || reopened.approval?.canonicalSnapshot !== revision.canonicalSnapshot
      || reopened.revisions.find((item) => item.id === revision.id)?.status !== "APPROVED") {
      throw new Error("O snapshot aprovado mudou durante a reabertura.");
    }
    if (readdirSync(workspace).length !== 0) throw new Error("Arquivos temporários M03 permaneceram no workspace descartável.");

    console.log(JSON.stringify({
      result: "PASS",
      bridge: "Codex CLI local autenticado pelo M02",
      promptVersion: revision.promptVersion,
      schemaVersion: revision.schemaVersion,
      qualityMode: revision.qualityMode,
      pageCount: output.siteBlueprint.pages.length,
      antiGenericConstraintCount: output.visualDNA.antiGenericConstraints.length,
      mediaStrategies: [...new Set(output.siteBlueprint.pages.flatMap((page) => page.sections.map((section) => section.media.strategy)))]
        .sort((left, right) => left.localeCompare(right, "en")),
      approvedSnapshotSha256: createHash("sha256").update(revision.canonicalSnapshot).digest("hex"),
      approvalReopenedUnchanged: true,
      temporaryWorkspaceFiles: 0,
      credentialsOrAccountOutputRetained: false,
      finalMediaOrWebsiteCodeGenerated: false,
    }));
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
