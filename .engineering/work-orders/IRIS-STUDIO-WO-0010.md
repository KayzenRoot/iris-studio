# IRIS-STUDIO-WO-0010 — M08 End-to-End Orchestrator & MVP Packaging

Status: PLANNED
Risk: ELEVATED
Depends on: M01-M07 APPROVED and merged

## OBJECTIVE
Connect all approved modules into one resumable Generate Website workflow and package IRIS Studio as a practical local MVP operated from the dashboard.

## CONTEXT
IRIS Studio is a local-first website creation orchestrator. The MVP must produce complete websites, not just visual assets. Codex is the reasoning/engineering executor through the locally authenticated Codex CLI; ComfyUI and Blender perform local visual work. Do not start until dependencies are APPROVED and merged.

## SCOPE
- Persisted state machine from brief -> direction -> media -> build -> quality/correction -> approval.
- Primary Generate/Continue workflow with visible stages/logs/artifacts.
- Resume after restart and retry failed stage without repeating successful expensive work.
- Generated-site preview launcher.
- Open/export site folder + evidence summary.
- Local setup/start scripts and prerequisite diagnostics.
- Acceptance runs: one STANDARD and one ABSURD project.

## OUT OF SCOPE
- Cloud accounts/multi-user/billing/marketplace/auto-hosting/updater/Docker-first distribution.
- Figma/Spline/Rive/Adobe providers.
- General-purpose agent platform.

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
- Normal operation is dashboard-driven after prerequisites are ready.
- Codex uses local authenticated CLI; no OpenAI API key requirement.
- ComfyUI/Blender local.
- Stages observable/cancellable where safe/recoverable.
- Final output complete independent website.

## ARCHITECTURE RULES
- Persisted state machine, not in-memory callback chain.
- Adapters map failures to common states.
- Idempotency prevents duplicate expensive jobs.
- No Docker dependency in MVP.

## CONSTRAINTS
- Implement only this Work Order.
- Inspect repository before edits.
- Preserve GEF Bootstrap 1.1.2 and governance.
- No force-push/history rewrite/destructive user-data operation.
- Treat subprocesses and filesystem paths as untrusted boundaries.
- Never claim unavailable dependency testing as PASS.
- Final review/Evidence Bundle in Brazilian Portuguese.

## ACCEPTANCE CRITERIA
- Supported local setup completes full site lifecycle from dashboard.
- Restart preserves/resumes state.
- STANDARD proves simple path; ABSURD proves advanced media/3D path with fallback.
- All regression + GEF checks pass.
- Docs/checkpoint match behavior.

## TESTS
- E2E state-machine with mocked adapters.
- Live local acceptance when prerequisites available.
- Restart/resume/retry.
- Security/path regression.
- Full regression suite + audit + GEF.

## DELIVERABLES
- Integrated orchestrator.
- Final MVP dashboard flow.
- Setup/start/operator docs.
- Two acceptance evidence bundles.
- Checkpoint proposal only if full DoD satisfied.

## REVIEW FORMAT
Evidence Bundle: base/head SHA; files; decisions; tests/results; lint/typecheck/build; security/architecture; regressions; fixed errors; risks/UNKNOWNs; screenshots/artifacts when relevant; proposed Checkpoint Delta. Audit verdict: APPROVED / CORRECTION REQUIRED / BLOCKED.

## STOP CONDITION
Stop only when the complete dashboard-driven flow produces validated complete websites and the MVP DoD is objectively satisfied.
