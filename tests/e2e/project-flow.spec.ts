import { expect, test } from "@playwright/test";

test("creates a project and reopens its persisted brief from the dashboard", async ({ page }) => {
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));

  await page.goto("/projects/new");
  await page.getByLabel("Nome do projeto").fill("Casa Aurora");
  await page.getByLabel("Tipo de site").selectOption("portfolio");
  await page.getByLabel("Resumo do projeto").fill("Portfólio para um estúdio de arquitetura autoral.");
  await page.getByLabel("Objetivo principal").fill("Receber pedidos de projetos de arquitetura residencial.");
  await page.getByLabel("Público principal").fill("Pessoas que buscam orientação para espaços de moradia.");
  await page.getByLabel("Páginas desejadas").fill("Início, Projetos, Contato");
  await page.getByLabel("Referências").fill("https://example.com/referencia");
  await page.getByLabel("Tom de voz").fill("Editorial e acolhedor");
  await page.getByLabel("Paleta de cores").fill("#10231e, #e8e3d9");
  await page.getByLabel("Direção visual").fill("Fotografia de arquitetura com luz natural");
  await page.getByLabel("Direção de movimento").fill("Transições discretas");
  await page.getByLabel("Modo de qualidade").selectOption("PREMIUM");
  await page.getByRole("button", { name: "Criar projeto" }).click();

  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]+$/i);
  await expect(page.getByRole("heading", { name: "Casa Aurora" })).toBeVisible();
  await expect(page.getByText("Portfólio para um estúdio de arquitetura autoral.")).toBeVisible();
  await expect(page.getByText("Início, Projetos, Contato")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Casa Aurora" })).toBeVisible();
  await expect(page.getByText("Editorial e acolhedor")).toBeVisible();
  expect(browserErrors).toEqual([]);

  await page.screenshot({
    path: ".engineering/evidence/IRIS-STUDIO-WO-0005-project-detail.png",
    fullPage: true,
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Ideias que ganham forma." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Casa Aurora" })).toBeVisible();
  await page.screenshot({
    path: ".engineering/evidence/IRIS-STUDIO-WO-0005-dashboard.png",
    fullPage: true,
  });
});
