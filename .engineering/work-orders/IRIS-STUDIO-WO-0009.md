# IRIS-STUDIO-WO-0009 — M07 Quality Gate & Auto-Correction

Status: PLANNED
Risk: STANDARD
Depends on: M06 APPROVED and merged

## OBJECTIVE
Prevent READY until functional, visual, accessibility and performance gates are measured and bounded automatic correction completes.

## CONTEXT
IRIS Studio is a local-first website creation orchestrator. The MVP must produce complete websites, not just visual assets. Codex is the reasoning/engineering executor through the locally authenticated Codex CLI; ComfyUI and Blender perform local visual work. Do not start until dependencies are APPROVED and merged.

## SCOPE
- Generated-site install/lint/typecheck/tests/build/broken-link checks.
- Playwright desktop/mobile journeys/screenshots.
- Console/page error capture.
- Accessibility and reduced-motion validation.
- Performance/asset budgets and browser metrics.
- 3D fallback/lazy-load/context-failure/frame-sampling checks.
- Structured QualityReport and max two Codex correction rounds.
- Final human visual approval.

## OUT OF SCOPE
- Claiming subjective artistic perfection from metrics.
- Infinite self-healing.
- Replacing final human taste approval.

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
- UNKNOWN/SKIPPED never becomes PASS.
- Failed required gate blocks READY.
- Corrections are minimal diffs in same generated workspace.
- Evidence binds to exact generated-site hash/environment.

## ARCHITECTURE RULES
- QualityRunner -> versioned QualityReport.
- Correction compiler sends only failed gates/evidence to Codex.
- Budgets configurable with sensible defaults and recorded overrides.
- Large binaries stay outside IRIS Git.

## CONSTRAINTS
- Implement only this Work Order.
- Inspect repository before edits.
- Preserve GEF Bootstrap 1.1.2 and governance.
- No force-push/history rewrite/destructive user-data operation.
- Treat subprocesses and filesystem paths as untrusted boundaries.
- Never claim unavailable dependency testing as PASS.
- Final review/Evidence Bundle in Brazilian Portuguese.

## ACCEPTANCE CRITERIA
- Known-bad fixture rejected.
- Known-good reaches AWAITING_VISUAL_APPROVAL.
- Max two auto-corrections.
- Desktop/mobile screenshots/metrics shown.
- User approval -> READY; rejection -> new correction/revision.

## TESTS
- QualityRunner unit tests.
- Playwright fixtures.
- Intentional a11y violation fixture.
- Performance budget fixture.
- Correction-loop/state-machine tests.

## DELIVERABLES
- QualityRunner/QualityReport.
- Playwright/a11y/performance harness.
- Correction compiler.
- Dashboard report/approval.
- Evidence Bundle.

## REVIEW FORMAT
Evidence Bundle: base/head SHA; files; decisions; tests/results; lint/typecheck/build; security/architecture; regressions; fixed errors; risks/UNKNOWNs; screenshots/artifacts when relevant; proposed Checkpoint Delta. Audit verdict: APPROVED / CORRECTION REQUIRED / BLOCKED.

## STOP CONDITION
Stop when no generated site can be READY without required deterministic gates and explicit final visual approval.
