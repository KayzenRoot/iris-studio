# IRIS-STUDIO-WO-0004 — M02 Codex Bridge

Status: PLANNED
Risk: ELEVATED
Depends on: M01 APPROVED and merged

## OBJECTIVE
Connect IRIS to the locally installed Codex CLI authenticated through the user's ChatGPT account, without requiring an OpenAI API key, and expose a safe execution bridge.

## CONTEXT
IRIS Studio is a local-first website creation orchestrator. The MVP must produce complete websites, not just visual assets. Codex is the reasoning/engineering executor through the locally authenticated Codex CLI; ComfyUI and Blender perform local visual work. Do not start until dependencies are APPROVED and merged.

## SCOPE
- Detect Codex CLI installation/version.
- Detect usable authenticated state by supported CLI invocation without reading credentials.
- Execute bounded Codex jobs from IRIS.
- Stream stdout/stderr/status into GenerationRun.
- Cancellation, timeout, retry classification and structured result files.
- Safe workspace contract confining Codex to the selected project workspace.

## OUT OF SCOPE
- OpenAI API integration/API keys/credit management.
- Art-direction/site-building prompts.
- Separate remote agent service.

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
- Primary path works with ChatGPT/Codex authentication and no API key.
- Never inspect/expose/persist Codex auth tokens.
- Every job records run ID/workspace/exit/result evidence.
- Dashboard can cancel running Codex jobs.

## ARCHITECTURE RULES
- CodexAdapter interface isolates CLI details.
- Spawn with argument arrays, never shell-concatenated user strings.
- Allowlist executable/workspaces.
- Redacted bounded logs.
- Versioned JSON job schemas.

## CONSTRAINTS
- Implement only this Work Order.
- Inspect repository before edits.
- Preserve GEF Bootstrap 1.1.2 and governance.
- No force-push/history rewrite/destructive user-data operation.
- Treat subprocesses and filesystem paths as untrusted boundaries.
- Never claim unavailable dependency testing as PASS.
- Final review/Evidence Bundle in Brazilian Portuguese.

## ACCEPTANCE CRITERIA
- Health distinguishes missing CLI, unauthenticated CLI and ready CLI.
- Harmless test job writes only inside disposable workspace and returns structured completion.
- Cancel terminates process tree and job state.
- No API key requested.
- Path escape rejected.

## TESTS
- Adapter unit tests with process doubles.
- Live smoke when Codex available; explicit SKIP otherwise.
- Cancellation/timeout tests.
- Path/command-injection tests.
- lint + typecheck + build + security review.

## DELIVERABLES
- CodexAdapter/execution service.
- Dashboard Codex telemetry.
- Structured run schema/redaction.
- Evidence proving no project API key requirement.
- Scoped PR.

## REVIEW FORMAT
Evidence Bundle: base/head SHA; files; decisions; tests/results; lint/typecheck/build; security/architecture; regressions; fixed errors; risks/UNKNOWNs; screenshots/artifacts when relevant; proposed Checkpoint Delta. Audit verdict: APPROVED / CORRECTION REQUIRED / BLOCKED.

## STOP CONDITION
Stop when IRIS safely invokes and monitors local Codex jobs inside a confined workspace with no API-key dependency.
