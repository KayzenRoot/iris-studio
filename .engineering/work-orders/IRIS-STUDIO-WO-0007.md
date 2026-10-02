# IRIS-STUDIO-WO-0007 — M05 Blender Creative MCP & 3D Engine

Status: PLANNED
Risk: ELEVATED
Depends on: M03 APPROVED; M04 recommended

## OBJECTIVE
Build IRIS Studio's own constrained Blender MCP and local 3D adapter so agents can create, light, animate, render and export web-ready scenes with high-level tools.

## CONTEXT
IRIS Studio is a local-first website creation orchestrator. The MVP must produce complete websites, not just visual assets. Codex is the reasoning/engineering executor through the locally authenticated Codex CLI; ComfyUI and Blender perform local visual work. Do not start until dependencies are APPROVED and merged.

## SCOPE
- Python local Blender MCP with versioned tool schemas.
- High-level tools for scene, reference/mesh import, procedural geometry, transforms, materials/textures, lighting, camera and animation.
- Preview render and turntable/short-loop render.
- GLB/GLTF export with compression/optimization metadata.
- Validation: textures, scale, polycount, clips and export readiness.
- Dashboard health/job/artifact ingestion.

## OUT OF SCOPE
- Unrestricted arbitrary Python tool by default.
- Character rigging suite/digital-human reconstruction/sculpting UI.
- Game-asset workflows.

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
- Purpose-built website tools and safe automation.
- Destructive operations target project scene copy, not arbitrary user files.
- 3D asset requires mobile/static fallback strategy.
- Every web export includes quality/performance report.

## ARCHITECTURE RULES
- Local stdio/localhost-only MCP.
- Blender Python internally; high-level operations externally.
- IRIS backend acts as MCP client; Codex may use same contract.
- Separate source scenes, previews and optimized exports.

## CONSTRAINTS
- Implement only this Work Order.
- Inspect repository before edits.
- Preserve GEF Bootstrap 1.1.2 and governance.
- No force-push/history rewrite/destructive user-data operation.
- Treat subprocesses and filesystem paths as untrusted boundaries.
- Never claim unavailable dependency testing as PASS.
- Final review/Evidence Bundle in Brazilian Portuguese.

## ACCEPTANCE CRITERIA
- IRIS connects and runs Blender health.
- Agent creates branded procedural hero scene from DNA, lights/animates/renders/exports GLB.
- Project reference texture can be safely applied.
- Validator reports complexity/problems.
- No arbitrary Python tool in default mode.

## TESTS
- Python validation/path tests.
- MCP contract tests.
- Headless Blender smoke when available.
- Golden GLB metadata/openability test.
- Security path/forbidden-op tests.

## DELIVERABLES
- tools/blender-mcp.
- IRIS Blender client.
- Website materials/light/camera presets.
- Validator/export pipeline.
- Preview + GLB evidence.

## REVIEW FORMAT
Evidence Bundle: base/head SHA; files; decisions; tests/results; lint/typecheck/build; security/architecture; regressions; fixed errors; risks/UNKNOWNs; screenshots/artifacts when relevant; proposed Checkpoint Delta. Audit verdict: APPROVED / CORRECTION REQUIRED / BLOCKED.

## STOP CONDITION
Stop when a constrained agent can create and export a smooth web-ready 3D hero scene through IRIS without manual Blender editing.
