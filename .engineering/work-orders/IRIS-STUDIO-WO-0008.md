# IRIS-STUDIO-WO-0008 — M06 Complete Website Builder

Status: PLANNED
Risk: STANDARD
Depends on: M02-M05 APPROVED and merged

## OBJECTIVE
Generate a complete deployable responsive website from an approved blueprint and selected assets, using Codex as engineering executor.

## CONTEXT
IRIS Studio is a local-first website creation orchestrator. The MVP must produce complete websites, not just visual assets. Codex is the reasoning/engineering executor through the locally authenticated Codex CLI; ComfyUI and Blender perform local visual work. Do not start until dependencies are APPROVED and merged.

## SCOPE
- Versioned starter template.
- Codex Build Work Order compiler consuming DNA/Blueprint/assets.
- Complete 1-8 page marketing/institutional sites.
- Responsive nav/header/footer/pages/sections, semantic structure, SEO, favicon/brand assets and not-found state.
- Three.js/R3F/GSAP only when blueprint requires.
- Lazy media, mobile/reduced-motion fallbacks and optimization hooks.
- Local preview command/build manifest.

## OUT OF SCOPE
- E-commerce/auth/CMS/database-backed apps.
- Automatic domains/hosting/third-party service accounts.
- General software generation outside websites.

## FILES / SOURCES TO READ
- .engineering/README.md
- .engineering/CHECKPOINT.md and CHECKPOINT.json
- .engineering/DECISIONS-LEDGER.md
- .engineering/SCOPE.md
- .engineering/ARCHITECTURE.md
- .engineering/REQUIREMENTS.md
- .engineering/DEFINITION-OF-DONE.md
- .engineering/TEST-PLAN.md
- .engineering/MODULES.md
- This Work Order
- Relevant predecessor Evidence Bundles and merged code

## CONTEXT LOCK
At execution start, record current main SHA and Git blob SHAs for CHECKPOINT, SCOPE, ARCHITECTURE, REQUIREMENTS, DEFINITION-OF-DONE and this Work Order. If a critical source changes, mark STALE and recompile before implementation.

## REQUIREMENTS
- Output is real independent source, not screenshots.
- All requested pages reachable.
- DNA consistent across pages.
- Usable with reduced motion/mobile fallback.
- Default stack Next.js + TypeScript; advanced visuals opt-in.

## ARCHITECTURE RULES
- Generated site has independent package/lockfile.
- Codex gets compiled Work Order + immutable asset manifest.
- Prefer native web/CSS over WebGL when impact doesn't justify cost.
- Asset refs use manifest IDs/paths.

## CONSTRAINTS
- Implement only this Work Order.
- Inspect repository before edits.
- Preserve GEF Bootstrap 1.1.2 and governance.
- No force-push/history rewrite/destructive user-data operation.
- Treat subprocesses and filesystem paths as untrusted boundaries.
- Never claim unavailable dependency testing as PASS.
- Final review/Evidence Bundle in Brazilian Portuguese.

## ACCEPTANCE CRITERIA
- Representative brief generates every blueprint page.
- Clean install/build succeeds.
- Desktop/mobile nav works and 404 exists.
- 3D/motion has lighter fallback.
- Source runs independently outside IRIS.

## TESTS
- Template tests.
- Fixture site lint/typecheck/build.
- Playwright navigation/responsive smoke.
- Broken link/asset detection.
- IRIS baseline.

## DELIVERABLES
- Website template.
- Codex Work Order compiler.
- Generated project manifest/schema.
- Representative evidence.
- Scoped PR.

## REVIEW FORMAT
Evidence Bundle: base/head SHA; files; decisions; tests/results; lint/typecheck/build; security/architecture; regressions; fixed errors; risks/UNKNOWNs; screenshots/artifacts when relevant; proposed Checkpoint Delta. Audit verdict: APPROVED / CORRECTION REQUIRED / BLOCKED.

## STOP CONDITION
Stop when IRIS turns an approved blueprint/assets into a complete independent website source tree that builds and runs locally.
