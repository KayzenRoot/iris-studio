import { z } from "zod";

export const ART_DIRECTOR_PROMPT_VERSION = "1.0.0" as const;
export const ART_DIRECTION_SCHEMA_VERSION = 1 as const;

export const qualityModeSchema = z.enum(["STANDARD", "PREMIUM", "ABSURD"]);

export const antiGenericPatternIds = [
  "thoughtless-neon-gradient",
  "arbitrary-glass-cards",
  "decorative-blobs",
  "gratuitous-particles",
  "generic-bento-grid",
  "uniform-card-stacks",
  "meaningless-3d-object",
  "narrativeless-motion",
] as const;

const conciseDecision = z.object({
  topic: z.string().trim().min(2).max(100),
  statement: z.string().trim().min(30).max(360),
  question: z.string().trim().min(15).max(240),
}).strict();

export const visualDnaSchema = z.object({
  schemaVersion: z.literal(ART_DIRECTION_SCHEMA_VERSION),
  promptVersion: z.literal(ART_DIRECTOR_PROMPT_VERSION),
  qualityMode: qualityModeSchema,
  concept: z.object({
    title: z.string().trim().min(3).max(100),
    creativeThesis: z.string().trim().min(100).max(520),
    signatureMotif: z.object({
      name: z.string().trim().min(2).max(80),
      visualRule: z.string().trim().min(60).max(300),
      pageDeployments: z.array(z.string().trim().min(10).max(220)).min(3).max(10),
    }).strict(),
  }).strict(),
  brandPersonality: z.array(z.object({
    trait: z.string().trim().min(2).max(40),
    visualImplication: z.string().trim().min(45).max(220),
  }).strict()).min(3).max(5),
  palette: z.array(z.object({
    name: z.string().trim().min(2).max(60),
    role: z.enum(["CANVAS", "SURFACE", "INK", "ACCENT", "SUPPORT", "FEEDBACK"]),
    hex: z.string().regex(/^#[\da-fA-F]{6}$/),
    usage: z.string().trim().min(35).max(220),
    contrastIntent: z.string().trim().min(35).max(220),
  }).strict()).min(4).max(8),
  typography: z.object({
    displayDirection: z.string().trim().min(70).max(320),
    readingDirection: z.string().trim().min(70).max(320),
    hierarchy: z.array(z.object({
      role: z.string().trim().min(2).max(50),
      treatment: z.string().trim().min(35).max(180),
    }).strict()).min(3).max(7),
    readabilityRules: z.array(z.string().trim().min(30).max(180)).min(2).max(6),
  }).strict(),
  composition: z.object({
    grid: z.string().trim().min(60).max(280),
    hierarchy: z.string().trim().min(60).max(280),
    spatialRhythm: z.string().trim().min(60).max(280),
    scrollNarrative: z.string().trim().min(60).max(280),
  }).strict(),
  materialLanguage: z.array(z.object({
    material: z.string().trim().min(2).max(60),
    role: z.string().trim().min(30).max(180),
    behavior: z.string().trim().min(30).max(180),
  }).strict()).min(2).max(5),
  geometryLanguage: z.array(z.object({
    form: z.string().trim().min(2).max(60),
    meaning: z.string().trim().min(35).max(180),
    rule: z.string().trim().min(35).max(180),
  }).strict()).min(2).max(5),
  lightingAndDepth: z.object({
    lighting: z.string().trim().min(60).max(260),
    depth: z.string().trim().min(60).max(260),
    atmosphere: z.string().trim().min(60).max(260),
  }).strict(),
  imageDirection: z.object({
    subjects: z.string().trim().min(50).max(240),
    framing: z.string().trim().min(50).max(240),
    treatment: z.string().trim().min(50).max(240),
    avoid: z.string().trim().min(50).max(240),
  }).strict(),
  motion: z.object({
    principles: z.array(z.string().trim().min(35).max(180)).min(3).max(6),
    pacing: z.string().trim().min(50).max(220),
    easingCharacter: z.string().trim().min(40).max(180),
    mobileBehavior: z.string().trim().min(50).max(220),
    reducedMotionBehavior: z.string().trim().min(50).max(220),
    performanceBudget: z.string().trim().min(50).max(220),
  }).strict(),
  interactionPrinciples: z.array(z.object({
    trigger: z.string().trim().min(3).max(100),
    response: z.string().trim().min(40).max(200),
    userFeedback: z.string().trim().min(35).max(180),
  }).strict()).min(2).max(7),
  continuityRules: z.array(z.string().trim().min(40).max(200)).min(3).max(10),
  accessibility: z.object({
    contrast: z.string().trim().min(50).max(220),
    reading: z.string().trim().min(50).max(220),
    focusAndInput: z.string().trim().min(50).max(220),
    colorIndependence: z.string().trim().min(50).max(220),
  }).strict(),
  performance: z.object({
    posture: z.string().trim().min(70).max(300),
    initialTransferBudgetKB: z.number().int().min(0).max(5000),
    deferredMediaBudgetKB: z.number().int().min(0).max(25000),
    runtimeBudget: z.string().trim().min(60).max(260),
    measurementCue: z.string().trim().min(40).max(180),
  }).strict(),
  antiGenericConstraints: z.array(z.object({
    patternId: z.enum(antiGenericPatternIds),
    prohibition: z.string().trim().min(35).max(180),
    distinctAlternative: z.string().trim().min(35).max(180),
    onlyJustifyWhen: z.string().trim().min(35).max(180),
  }).strict()).length(antiGenericPatternIds.length),
  referenceInterpretations: z.array(z.object({
    referenceIndex: z.number().int().min(0).max(11),
    abstractSignal: z.string().trim().min(35).max(180),
    transformation: z.string().trim().min(45).max(220),
    identityBoundary: z.string().trim().min(40).max(200),
  }).strict()).max(12),
  assumptions: z.array(conciseDecision).max(12),
  decisionNeeds: z.array(conciseDecision).max(12),
}).strict();

export const mediaStrategySchema = z.enum([
  "HTML_CSS",
  "STILL_IMAGE",
  "SHORT_LOOP",
  "SHADER_CANVAS",
  "REALTIME_3D",
]);

const downstreamAssetSchema = z.object({
  kind: z.enum(["IMAGE", "ILLUSTRATION", "TEXTURE", "VIDEO_LOOP", "3D_SCENE", "ICON", "TYPE"]),
  intent: z.string().trim().min(35).max(180),
  constraints: z.string().trim().min(35).max(180),
}).strict();

const sectionSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(64),
  title: z.string().trim().min(2).max(100),
  contentIntent: z.string().trim().min(55).max(300),
  visualRole: z.string().trim().min(45).max(220),
  media: z.object({
    strategy: mediaStrategySchema,
    impactRationale: z.string().trim().min(90).max(320),
    loadTiming: z.enum(["INITIAL", "DEFERRED", "ON_INTERACTION"]),
    estimatedPayloadKB: z.number().int().min(0).max(12000),
    runtimeCost: z.enum(["LOW", "MEDIUM", "HIGH"]),
    fallbackStrategy: mediaStrategySchema,
    fallbackRationale: z.string().trim().min(60).max(240),
  }).strict(),
  interactionIntent: z.string().trim().min(40).max(220),
  mobileTreatment: z.string().trim().min(50).max(240),
  reducedMotionTreatment: z.string().trim().min(50).max(240),
  performanceSensitivity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  downstreamAssets: z.array(downstreamAssetSchema).max(8),
  continuityRole: z.string().trim().min(35).max(180),
}).strict();

export const siteBlueprintSchema = z.object({
  schemaVersion: z.literal(ART_DIRECTION_SCHEMA_VERSION),
  promptVersion: z.literal(ART_DIRECTOR_PROMPT_VERSION),
  qualityMode: qualityModeSchema,
  goalSummary: z.string().trim().min(90).max(360),
  navigationModel: z.string().trim().min(50).max(220),
  crossPageNarrative: z.string().trim().min(70).max(280),
  sitemap: z.array(z.object({
    pageId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(64),
    name: z.string().trim().min(1).max(80),
  }).strict()).min(1).max(8),
  pages: z.array(z.object({
    pageId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(64),
    name: z.string().trim().min(1).max(80),
    purpose: z.string().trim().min(50).max(240),
    primaryUserAction: z.string().trim().min(3).max(100),
    sections: z.array(sectionSchema).min(1).max(12),
    crossPageContinuity: z.string().trim().min(45).max(200),
  }).strict()).min(1).max(8),
  assumptions: z.array(conciseDecision).max(12),
  decisionNeeds: z.array(conciseDecision).max(12),
  performance: z.object({
    initialTransferBudgetKB: z.number().int().min(0).max(5000),
    totalMediaBudgetKB: z.number().int().min(0).max(25000),
    maximumConcurrentRichMedia: z.number().int().min(1).max(4),
    degradationRule: z.string().trim().min(70).max(280),
  }).strict(),
}).strict();

export const artDirectionOutputSchema = z.object({
  visualDNA: visualDnaSchema,
  siteBlueprint: siteBlueprintSchema,
}).strict();

export type VisualDNA = z.infer<typeof visualDnaSchema>;
export type SiteBlueprint = z.infer<typeof siteBlueprintSchema>;
export type ArtDirectionOutput = z.infer<typeof artDirectionOutputSchema>;
