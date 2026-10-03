import { expect, test } from "@playwright/test";

import { canonicalJson } from "../../src/server/art-director/quality";
import type { PublicArtDirectionApproval, PublicArtDirectionRevision } from "../../src/server/art-director/service";
import { artDirectorGoldenCases } from "../fixtures/art-director/golden-cases";
import { makeGoldenArtDirection } from "../fixtures/art-director/output";

test("revisa, aprova, reabre e revisa novamente uma direção sem mutar a aprovação", async ({ page, request }) => {
  const projectResponse = await request.post("/api/projects", {
    data: {
      name: "Atelier de trama",
      brief: artDirectorGoldenCases[1]!.brief,
    },
  });
  expect(projectResponse.status()).toBe(201);
  const { project } = await projectResponse.json() as {
    project: { id: string; brief: typeof artDirectorGoldenCases[number]["brief"] };
  };
  const brief = project.brief;
  let approval: PublicArtDirectionApproval | null = null;
  const revisions: PublicArtDirectionRevision[] = [];
  const pendingOutputs = new Map<string, ReturnType<typeof makeGoldenArtDirection>>();
  let nextRevision = 1;

  await page.route(`**/api/projects/${project.id}/art-direction/revisions**`, async (route) => {
    const url = new URL(route.request().url());
    const basePath = `/api/projects/${project.id}/art-direction/revisions`;
    const suffix = url.pathname.slice(basePath.length);
    if (route.request().method() === "GET") {
      await route.fulfill({ json: { revisions, approval } });
      return;
    }

    if (!suffix && route.request().method() === "POST") {
      const payload = route.request().postDataJSON() as { parentRevisionId?: string; revisionRequest?: string };
      const output = structuredClone(makeGoldenArtDirection(brief));
      if (nextRevision > 1) output.visualDNA.concept.title = "Cartografia por camadas";
      const revision: PublicArtDirectionRevision = {
        id: `00000000-0000-4000-8000-${String(nextRevision).padStart(12, "0")}`,
        projectId: project.id,
        revision: nextRevision++,
        parentRevisionId: payload.parentRevisionId ?? null,
        status: "GENERATING",
        promptVersion: "1.0.0",
        schemaVersion: 1,
        qualityMode: brief.qualityMode,
        attemptsUsed: 1,
        output: null,
        canonicalSnapshot: null,
        errorCode: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        finishedAt: null,
        approvedAt: null,
      };
      revisions.unshift(revision);
      pendingOutputs.set(revision.id, output);
      await route.fulfill({ status: 202, json: { revision } });
      return;
    }

    const revisionId = suffix.split("/")[1];
    const revision = revisions.find((candidate) => candidate.id === revisionId);
    if (!revision) {
      await route.fulfill({ status: 404, json: { error: "Revisão não encontrada." } });
      return;
    }
    if (suffix.endsWith("/advance") && route.request().method() === "POST") {
      const output = pendingOutputs.get(revision.id);
      if (!output) {
        await route.fulfill({ status: 409, json: { error: "Saída não disponível." } });
        return;
      }
      revision.status = "DRAFT";
      revision.output = output;
      revision.canonicalSnapshot = canonicalJson(output);
      revision.finishedAt = new Date().toISOString();
      revision.updatedAt = revision.finishedAt;
      pendingOutputs.delete(revision.id);
      await route.fulfill({ json: { revision } });
      return;
    }
    if (suffix.endsWith("/approve") && route.request().method() === "POST") {
      const body = route.request().postDataJSON() as { confirmImmutableApproval?: boolean };
      if (body.confirmImmutableApproval !== true || revision.status !== "DRAFT" || !revision.canonicalSnapshot) {
        await route.fulfill({ status: 400, json: { error: "Aprovação exige confirmação explícita." } });
        return;
      }
      revision.status = "APPROVED";
      revision.approvedAt = new Date().toISOString();
      revision.updatedAt = revision.approvedAt;
      approval = {
        id: "00000000-0000-4000-8000-000000000099",
        projectId: project.id,
        revisionId: revision.id,
        revision: revision.revision,
        canonicalSnapshot: revision.canonicalSnapshot,
        approvedAt: revision.approvedAt,
      };
      await route.fulfill({ json: { approval, revision } });
      return;
    }
    await route.fulfill({ status: 404, json: { error: "Rota não encontrada." } });
  });

  await page.goto(`/projects/${project.id}`);
  await page.getByRole("heading", { name: "Senior Art Director" }).waitFor();
  await page.getByRole("button", { name: "Gerar direção visual" }).click();
  await expect(page.getByRole("heading", { name: "Cartografia de gestos materiais" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Atelier", exact: true })).toBeVisible();
  await expect(page.getByText("Peças em contexto", { exact: true })).toBeVisible();
  await expect(page.getByText("Fallback mais leve").first()).toBeVisible();

  const originalSnapshot = revisions[0]!.canonicalSnapshot;
  await page.getByLabel(/quero salvar a revisão 1 como imutável/i).check();
  await page.getByRole("button", { name: "Aprovar esta revisão" }).click();
  await expect(page.getByText("Versão aprovada · revisão 1")).toBeVisible();
  await expect(page.getByText("APROVADA · IMUTÁVEL")).toBeVisible();

  await page.getByRole("button", { name: "Solicitar uma revisão" }).click();
  await page.getByLabel("O que deve mudar nesta nova versão?").fill("Aprofunde a relação entre material, escala e evidência.");
  await page.getByRole("button", { name: "Criar nova revisão" }).click();
  await expect(page.getByRole("heading", { name: "Cartografia por camadas" })).toBeVisible();
  await expect(page.getByText("Versão aprovada · revisão 1")).toBeVisible();
  expect(revisions[1]?.status).toBe("APPROVED");
  expect(revisions[1]?.canonicalSnapshot).toBe(originalSnapshot);
  expect(revisions[0]?.parentRevisionId).toBe(revisions[1]?.id);

  await page.reload();
  await expect(page.getByText("Versão aprovada · revisão 1")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cartografia por camadas" })).toBeVisible();
  await expect(page.getByText("Aprovar salva apenas esta direção. Nenhuma etapa M04 é iniciada automaticamente.")).toBeVisible();
  await page.screenshot({ path: ".engineering/evidence/IRIS-STUDIO-WO-0005-art-director-desktop.png", fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.getByRole("heading", { name: "Cartografia por camadas" })).toBeVisible();
  await page.screenshot({ path: ".engineering/evidence/IRIS-STUDIO-WO-0005-art-director-mobile.png", fullPage: true });
});
