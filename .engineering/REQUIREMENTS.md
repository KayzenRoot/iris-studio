# Requirements

## Functional
- R1 Local single-operator browser dashboard with local persistence.
- R2 Persist projects, briefs, approved DNA/Blueprint, runs, artifact metadata and quality status.
- R3 Brief includes pages/references/tone/colors/2D-3D/motion/quality.
- R4 Use locally authenticated Codex CLI; no OpenAI API key required by primary MVP path.
- R5 Senior Art Director outputs schema-valid Visual DNA + complete Site Blueprint.
- R6 User approves/revises direction before expensive generation.
- R7 Local ComfyUI integration for curated high-quality 2D website media and short hero/ambient loops when a compatible local workflow/model is configured.
- R8 IRIS-owned constrained Blender MCP for website scenes/materials/light/animation/render/export.
- R9 Generate a complete independent website source workspace.
- R10 Support normally 1-8 page marketing/institutional sites with responsive nav, requested sections, SEO/brand assets and 404.
- R11 Three.js/R3F/GSAP only when blueprint justifies cost.
- R12 Heavy motion/3D/loop media has reduced-motion and mobile/light fallback.
- R13 Validate build/browser/accessibility/performance before READY.
- R14 Bounded Codex auto-correction + explicit final visual approval.
- R15 End-to-end run is observable/recoverable and can resume after restart.

## Quality
- UNKNOWN/SKIPPED never becomes PASS.
- Visual consistency follows approved DNA.
- Keep source-quality media + separate web derivatives.
- Optimize smoothness/payload, not maximum 3D density.
- Required pages usable with reduced motion/WebGL fallback.
- Benchmark fixture targets: Lighthouse Performance >=90 desktop, >=80 mobile; Accessibility >=90; CLS <=0.1. Exceptions explicit.
- Interactive animation targets 60 FPS on configured benchmark profile and avoids sustained severe drops; final method in M07.
- READY forbidden with build errors, uncaught acceptance-journey console errors, broken required nav or missing required fallbacks.

## MVP output
STANDARD, PREMIUM, ABSURD marketing/portfolio/studio/product-presentation/institutional websites.

## Not required
E-commerce, generated-site auth/CMS/database SaaS, auto hosting/domain, multi-user IRIS.
