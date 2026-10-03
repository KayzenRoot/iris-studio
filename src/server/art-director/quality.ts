import type { ProjectBrief } from "../db/store";
import {
  antiGenericPatternIds,
  artDirectionOutputSchema,
  type ArtDirectionOutput,
} from "./schemas";

type SiteSection = ArtDirectionOutput["siteBlueprint"]["pages"][number]["sections"][number];

const mediumWeight = {
  HTML_CSS: 0,
  STILL_IMAGE: 1,
  SHORT_LOOP: 2,
  SHADER_CANVAS: 3,
  REALTIME_3D: 4,
} as const;

const advancedMediaStrategies = ["SHORT_LOOP", "SHADER_CANVAS", "REALTIME_3D"] as const;

function normalizeLabel(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}

function relativeLuminance(hex: string) {
  const channels = hex.slice(1).match(/.{2}/g)!.map((channel) => Number.parseInt(channel, 16) / 255);
  const linear = channels.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return linear[0]! * 0.2126 + linear[1]! * 0.7152 + linear[2]! * 0.0722;
}

function contrastRatio(first: string, second: string) {
  const values = [relativeLuminance(first), relativeLuminance(second)].sort((left, right) => right - left);
  return (values[0]! + 0.05) / (values[1]! + 0.05);
}

export type ArtDirectionValidation =
  | { valid: true; data: ArtDirectionOutput }
  | { valid: false; diagnostics: string[] };

function validateVisualContract(data: ArtDirectionOutput, brief: ProjectBrief) {
  const diagnostics: string[] = [];
  if (data.visualDNA.qualityMode !== brief.qualityMode || data.siteBlueprint.qualityMode !== brief.qualityMode) {
    diagnostics.push("qualityMode deve corresponder ao modo escolhido no briefing.");
  }
  if (data.visualDNA.promptVersion !== data.siteBlueprint.promptVersion) {
    diagnostics.push("visualDNA e siteBlueprint devem usar a mesma versão de prompt.");
  }
  const paletteRoles = data.visualDNA.palette.map((color) => color.role);
  const requiredRoles = ["CANVAS", "SURFACE", "INK", "ACCENT"] as const;
  if (new Set(paletteRoles).size !== paletteRoles.length || requiredRoles.some((role) => !paletteRoles.includes(role))) {
    diagnostics.push("a paleta deve atribuir uma cor distinta a cada papel CANVAS, SURFACE, INK e ACCENT.");
  }
  const ink = data.visualDNA.palette.find((color) => color.role === "INK");
  const readingSurfaces = data.visualDNA.palette.filter((color) => color.role === "CANVAS" || color.role === "SURFACE");
  if (ink && readingSurfaces.some((surface) => contrastRatio(ink.hex, surface.hex) < 4.5)) {
    diagnostics.push("a tinta principal precisa atingir contraste de pelo menos 4,5:1 nas superfícies de leitura declaradas.");
  }
  return diagnostics;
}

function validatePageStructure(data: ArtDirectionOutput, brief: ProjectBrief) {
  const diagnostics: string[] = [];
  const expectedPages = brief.pages.map(normalizeLabel);
  const pageNames = data.siteBlueprint.pages.map((page) => normalizeLabel(page.name));
  const sitemapNames = data.siteBlueprint.sitemap.map((page) => normalizeLabel(page.name));
  if (pageNames.length !== expectedPages.length || pageNames.some((name, index) => name !== expectedPages[index])) {
    diagnostics.push("pages deve cobrir exatamente todas as páginas solicitadas, sem renomear ou reordenar.");
  }
  if (sitemapNames.length !== expectedPages.length || sitemapNames.some((name, index) => name !== expectedPages[index])) {
    diagnostics.push("sitemap deve corresponder à lista e à ordem exata das páginas solicitadas.");
  }
  const pageIds = data.siteBlueprint.pages.map((page) => page.pageId);
  const sitemapIds = data.siteBlueprint.sitemap.map((page) => page.pageId);
  if (new Set(pageIds).size !== pageIds.length || pageIds.some((id, index) => id !== sitemapIds[index])) {
    diagnostics.push("pageId deve ser único e idêntico entre sitemap e pages.");
  }
  const sectionIds = data.siteBlueprint.pages.flatMap((page) => page.sections.map((section) => section.id));
  if (new Set(sectionIds).size !== sectionIds.length) {
    diagnostics.push("cada seção deve ter um id único no Site Blueprint.");
  }
  return diagnostics;
}

function validateRequiredSections(data: ArtDirectionOutput, brief: ProjectBrief) {
  const diagnostics: string[] = [];
  for (const requested of brief.requiredSections ?? []) {
    const pageName = normalizeLabel(requested.page);
    const page = data.siteBlueprint.pages.find((candidate) => normalizeLabel(candidate.name) === pageName);
    if (!page) {
      diagnostics.push("uma página com seções obrigatórias não aparece no Site Blueprint.");
      continue;
    }
    const sectionNames = new Set(page.sections.map((section) => normalizeLabel(section.title)));
    for (const requiredSection of requested.sections) {
      if (!sectionNames.has(normalizeLabel(requiredSection))) {
        diagnostics.push("uma seção obrigatória do briefing não aparece na página correspondente.");
      }
    }
  }
  return diagnostics;
}

function validateAntiGenericConstraints(data: ArtDirectionOutput) {
  const patternIds = data.visualDNA.antiGenericConstraints.map((item) => item.patternId);
  return new Set(patternIds).size === antiGenericPatternIds.length
    && antiGenericPatternIds.every((patternId) => patternIds.includes(patternId))
    ? []
    : ["antiGenericConstraints deve proibir explicitamente os oito padrões genéricos obrigatórios."];
}

function validateReferenceInterpretations(data: ArtDirectionOutput, brief: ProjectBrief) {
  const referenceIndexes = data.visualDNA.referenceInterpretations
    .map((item) => item.referenceIndex)
    .sort((left, right) => left - right);
  return referenceIndexes.length === brief.references.length
    && referenceIndexes.every((index, position) => index === position)
    ? []
    : ["cada referência deve receber uma interpretação abstrata, sem copiar identidade."];
}

function validatePerformanceBudgets(data: ArtDirectionOutput, sections: SiteSection[]) {
  const initialPayload = sections
    .filter((section) => section.media.loadTiming === "INITIAL")
    .reduce((total, section) => total + section.media.estimatedPayloadKB, 0);
  const totalPayload = sections.reduce((total, section) => total + section.media.estimatedPayloadKB, 0);
  const diagnostics: string[] = [];
  if (initialPayload > data.siteBlueprint.performance.initialTransferBudgetKB
    || initialPayload > data.visualDNA.performance.initialTransferBudgetKB) {
    diagnostics.push("o payload estimado na carga inicial excede o orçamento declarado.");
  }
  if (totalPayload > data.siteBlueprint.performance.totalMediaBudgetKB
    || totalPayload > data.visualDNA.performance.deferredMediaBudgetKB + data.visualDNA.performance.initialTransferBudgetKB) {
    diagnostics.push("o payload estimado das seções excede o orçamento total declarado.");
  }
  return diagnostics;
}

function hasLighterFallback(section: SiteSection) {
  return section.media.strategy === "HTML_CSS"
    ? section.media.fallbackStrategy === "HTML_CSS"
    : mediumWeight[section.media.fallbackStrategy] < mediumWeight[section.media.strategy];
}

function requiredAssetKinds(section: SiteSection) {
  switch (section.media.strategy) {
    case "STILL_IMAGE": return ["IMAGE", "ILLUSTRATION", "TEXTURE"];
    case "SHORT_LOOP": return ["VIDEO_LOOP"];
    case "REALTIME_3D": return ["3D_SCENE"];
    default: return [];
  }
}

function validateSectionMedia(section: SiteSection, brief: ProjectBrief) {
  const diagnostics: string[] = [];
  const { media } = section;
  if (!hasLighterFallback(section)) {
    diagnostics.push("cada fallback de mídia deve ser tecnicamente mais leve que a estratégia primária.");
  }
  if (brief.mediaPreference === "2D_ONLY" && media.strategy === "REALTIME_3D") {
    diagnostics.push("REALTIME_3D é incompatível com a preferência 2D_ONLY do briefing.");
  }
  const requiredKinds = requiredAssetKinds(section);
  if (requiredKinds.length && !section.downstreamAssets.some((asset) => requiredKinds.includes(asset.kind))) {
    diagnostics.push("a estratégia de mídia escolhida exige um requisito de asset downstream correspondente.");
  }
  if (media.strategy === "HTML_CSS" && media.runtimeCost !== "LOW") {
    diagnostics.push("HTML/CSS nativo deve permanecer com custo de runtime LOW.");
  }
  if (media.strategy === "STILL_IMAGE" && media.runtimeCost === "HIGH") {
    diagnostics.push("uma imagem estática não pode ser classificada com custo de runtime HIGH.");
  }
  if (advancedMediaStrategies.includes(media.strategy as typeof advancedMediaStrategies[number]) && media.loadTiming === "INITIAL") {
    diagnostics.push("mídia avançada deve ser adiada ou iniciada sob interação, nunca competir com a carga inicial.");
  }
  if (media.strategy === "REALTIME_3D" && media.runtimeCost !== "HIGH") {
    diagnostics.push("REALTIME_3D deve ser classificado com custo HIGH.");
  }
  if (brief.qualityMode === "STANDARD" && media.runtimeCost === "HIGH") {
    diagnostics.push("STANDARD não pode introduzir mídia de alto custo de runtime.");
  }
  if (advancedMediaStrategies.includes(media.strategy as typeof advancedMediaStrategies[number]) && media.impactRationale.length < 100) {
    diagnostics.push("mídia avançada precisa justificar impacto e custo com clareza.");
  }
  return diagnostics;
}

function validateBriefCompleteness(data: ArtDirectionOutput, brief: ProjectBrief) {
  const assumptions = new Set(data.siteBlueprint.assumptions.map((item) => normalizeLabel(item.topic)));
  const decisionNeeds = new Set(data.siteBlueprint.decisionNeeds.map((item) => normalizeLabel(item.topic)));
  const diagnostics: string[] = [];
  if (brief.goal.startsWith("Não informado") && !assumptions.has("goal") && !decisionNeeds.has("goal")) {
    diagnostics.push("o objetivo ausente deve aparecer em assumptions ou decisionNeeds.");
  }
  if (brief.audience.startsWith("Não informada") && !assumptions.has("audience") && !decisionNeeds.has("audience")) {
    diagnostics.push("o público ausente deve aparecer em assumptions ou decisionNeeds.");
  }
  return diagnostics;
}

export function validateArtDirectionOutput(value: unknown, brief: ProjectBrief): ArtDirectionValidation {
  const parsed = artDirectionOutputSchema.safeParse(value);
  if (!parsed.success) {
    return {
      valid: false,
      diagnostics: parsed.error.issues.slice(0, 24).map((issue) => {
        const path = issue.path.length ? issue.path.join(".") : "$";
        return path + ": " + issue.message;
      }),
    };
  }

  const data = parsed.data;
  const sections = data.siteBlueprint.pages.flatMap((page) => page.sections);
  const diagnostics = [
    ...validateVisualContract(data, brief),
    ...validatePageStructure(data, brief),
    ...validateRequiredSections(data, brief),
    ...validateAntiGenericConstraints(data),
    ...validateReferenceInterpretations(data, brief),
    ...validatePerformanceBudgets(data, sections),
    ...sections.flatMap((section) => validateSectionMedia(section, brief)),
    ...validateBriefCompleteness(data, brief),
  ];
  return diagnostics.length
    ? { valid: false, diagnostics: [...new Set(diagnostics)].slice(0, 24) }
    : { valid: true, data };
}

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map((item) => canonicalJson(item)).join(",") + "]";
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort((left, right) => left.localeCompare(right, "en"));
  return "{" + keys.map((key) => JSON.stringify(key) + ":" + canonicalJson(record[key])).join(",") + "}";
}

export function parseCanonicalArtDirection(json: string, brief: ProjectBrief) {
  let value: unknown;
  try {
    value = JSON.parse(json) as unknown;
  } catch {
    return { valid: false as const, diagnostics: ["o snapshot persistido não é JSON válido."] };
  }
  const validation = validateArtDirectionOutput(value, brief);
  if (!validation.valid) return validation;
  return { valid: true as const, data: validation.data, canonicalJson: canonicalJson(validation.data) };
}
