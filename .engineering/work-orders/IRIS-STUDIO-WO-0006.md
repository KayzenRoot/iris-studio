# IRIS-STUDIO-WO-0006 — M04 ComfyUI Visual Engine

Status: PLANNED
Risk: ELEVATED
Depends on: M03 APPROVED and merged

## OBJECTIVE
Use local ComfyUI as IRIS Studio's high-quality 2D visual production engine for styleframes, hero imagery, backgrounds and textures.

## CONTEXT
IRIS Studio is a local-first website creation orchestrator. The MVP must produce complete websites, not just visual assets. Codex is the reasoning/engineering executor through the locally authenticated Codex CLI; ComfyUI and Blender perform local visual work. Do not start until dependencies are APPROVED and merged.

## SCOPE
- ComfyUI health/config adapter over local HTTP/WebSocket interfaces.
- Versioned workflow registry with declared model dependencies.
- Jobs for styleframes, hero images, backgrounds and texture/reference images.
- Quality presets suitable for local 8 GB VRAM with practical fallback/offload profiles.
- Artifact ingestion: hash/dimensions/format/provenance/workflow/project.
- Preview/select/regenerate/variant UI.

## OUT OF SCOPE
- Bundling third-party model weights.
- Guaranteeing a specific model is installed.
- Full video studio/arbitrary workflow editor.
- 3D scene construction.

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
- Missing workflow/model dependency fails clearly.
- Retain source-quality originals and separate web derivatives.
- Jobs are asynchronous and cancellable when supported.
- Workflow/prompt provenance stored.

## ARCHITECTURE RULES
- ComfyUIAdapter hides API details.
- Workflow JSON versioned in repo; outputs stay in project workspace.
- Normalize paths from external tool.
- Deterministic web derivative optimization.

## CONSTRAINTS
- Implement only this Work Order.
- Inspect repository before edits.
- Preserve GEF Bootstrap 1.1.2 and governance.
- No force-push/history rewrite/destructive user-data operation.
- Treat subprocesses and filesystem paths as untrusted boundaries.
- Never claim unavailable dependency testing as PASS.
- Final review/Evidence Bundle in Brazilian Portuguese.

## ACCEPTANCE CRITERIA
- IRIS detects configured ComfyUI and missing dependencies honestly.
- Approved DNA can produce/select styleframes and final hero/background asset.
- Every artifact has provenance + optimized derivative.
- Failure is recoverable/retryable.

## TESTS
- Mocked adapter tests.
- Workflow schema validation.
- Artifact hash/path-safety tests.
- Optional live smoke.
- Image optimization regression.

## DELIVERABLES
- ComfyUI adapter/workflow registry.
- Curated MVP workflows/config templates.
- Artifact pipeline/selection UI.
- Evidence with example outputs when available.
- Scoped PR.

## REVIEW FORMAT
Evidence Bundle: base/head SHA; files; decisions; tests/results; lint/typecheck/build; security/architecture; regressions; fixed errors; risks/UNKNOWNs; screenshots/artifacts when relevant; proposed Checkpoint Delta. Audit verdict: APPROVED / CORRECTION REQUIRED / BLOCKED.

## STOP CONDITION
Stop when IRIS reliably produces, catalogs, previews and optimizes high-quality 2D website media through local ComfyUI without manual node editing.
