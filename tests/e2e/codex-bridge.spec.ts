import { expect, test } from "@playwright/test";

test("exposes Codex authentication health and an empty project run history", async ({ request }) => {
  const healthResponse = await request.get("/api/health");
  expect(healthResponse.ok()).toBe(true);
  const health = await healthResponse.json();
  expect(["READY", "UNAUTHENTICATED", "UNAVAILABLE", "MISCONFIGURED"])
    .toContain(health.integrations.codex.status);

  const projectResponse = await request.post("/api/projects", {
    data: {
      name: "Bridge smoke",
      brief: {
        siteType: "portfolio",
        description: "Brief de teste isolado para o Codex Bridge.",
        pages: ["Início"],
        references: [],
        tone: "claro",
        colors: ["#ffffff"],
        mediaDirection: "tipografia",
        motionDirection: "estático",
        qualityMode: "STANDARD",
      },
    },
  });
  expect(projectResponse.status()).toBe(201);
  const { project } = await projectResponse.json();

  const runsResponse = await request.get(`/api/projects/${project.id}/codex-runs`);
  expect(runsResponse.status()).toBe(200);
  const runs = await runsResponse.json();
  expect(runs).toEqual({ runs: [] });
  expect(JSON.stringify(runs)).not.toMatch(/[A-Z]:\\Users\\|\/home\//i);

  const noOrigin = await request.post(`/api/projects/${project.id}/codex-runs`, { data: { prompt: "tarefa de teste" } });
  expect(noOrigin.status()).toBe(403);
});

test("mostra o painel Codex local e bloqueia campos de chave arbitrários", async ({ page, request }) => {
  const projectResponse = await request.post("/api/projects", {
    data: {
      name: "Painel Codex",
      brief: {
        siteType: "portfolio",
        description: "Projeto temporário para validar a interface Codex local.",
        pages: ["Início"],
        references: [],
        tone: "claro",
        colors: ["#ffffff"],
        mediaDirection: "tipografia",
        motionDirection: "estático",
        qualityMode: "STANDARD",
      },
    },
  });
  const { project } = await projectResponse.json();
  await page.goto(`/projects/${project.id}`);

  await expect(page.getByRole("heading", { name: "Codex Bridge" })).toBeVisible();
  await expect(page.getByLabel(/Tarefa para o Codex/)).toBeVisible();
  await expect(page.getByText("Nenhuma tarefa foi executada neste projeto.")).toBeVisible();
  const rejected = await page.evaluate(async (projectId) => {
    const response = await fetch(`/api/projects/${projectId}/codex-runs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: "tarefa de teste", apiKey: "sk-never-accept-this" }),
    });
    return { status: response.status, body: await response.text() };
  }, project.id);
  expect(rejected.status).toBe(400);
  expect(rejected.body).not.toContain("sk-never-accept-this");

  await page.screenshot({ path: ".engineering/evidence/IRIS-STUDIO-WO-0004-codex-bridge.png", fullPage: true });
});
