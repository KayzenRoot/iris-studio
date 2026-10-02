# IRIS-STUDIO-WO-0003 — M01 Local Core & Dashboard

Status: PLANNED
Risk: STANDARD
Depends on: WO-0002 merged

## OBJECTIVE
Create the minimal local IRIS Studio application shell: browser dashboard, local persistence, project/job model, health surface and deterministic developer runtime.

## CONTEXT
IRIS Studio is a local-first website creation orchestrator. The MVP must produce complete websites, not just visual assets. Codex is the reasoning/engineering executor through the locally authenticated Codex CLI; ComfyUI and Blender perform local visual work. Do not start until dependencies are APPROVED and merged.

## SCOPE
- Next.js + TypeScript local dashboard shell.
- SQLite persistence for projects, specs, generation runs, artifacts metadata and job state.
- Project workspace service isolated from the source repository.
- Health checks for IRIS plus Codex/ComfyUI/Blender availability.
- Create Project, Project List, Project Detail and System Health screens.
- Baseline logging, configuration validation and local error boundaries.

## OUT OF SCOPE
- Codex execution, ComfyUI calls, Blender automation or generated websites.
- Authentication, multi-user, cloud sync, billing, CMS or remote deployment.
- Visual editor/Figma-like canvas.

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
- Single local operator; no login for MVP.
- Host-native runtime is default; Docker is not required.
- Persistent data stays local unless a later approved integration explicitly sends it elsewhere.
- Configuration is explicit/validated and secrets are never committed.

## ARCHITECTURE RULES
- Next.js App Router + TypeScript for local UI/server.
- SQLite behind repositories/services with explicit migrations.
- Runtime schemas at process/persistence boundaries.
- Generated project workspaces outside source tree by default.
- Pin admitted dependency versions and record decisions.

## CONSTRAINTS
- Implement only this Work Order.
- Inspect repository before edits.
- Preserve GEF Bootstrap 1.1.2 and governance.
- No force-push/history rewrite/destructive user-data operation.
- Treat subprocesses and filesystem paths as untrusted boundaries.
- Never claim unavailable dependency testing as PASS.
- Final review/Evidence Bundle in Brazilian Portuguese.

## ACCEPTANCE CRITERIA
- Fresh clone installs and starts locally with documented commands.
- Project can be created, listed and reopened after restart.
- Clean database migration is deterministic and tested.
- Health page reports AVAILABLE/UNAVAILABLE/MISCONFIGURED without crashing.
- No unimplemented integration is represented as working.

## TESTS
- Unit tests for config/project/persistence.
- Migration smoke test on clean temp DB.
- UI smoke create/open project.
- lint + typecheck + production build.
- GEF/repository baseline.

## DELIVERABLES
- Local application shell/dashboard.
- SQLite schema/migrations.
- Workspace abstraction.
- Docs + Evidence Bundle.
- Single scoped PR.

## REVIEW FORMAT
Evidence Bundle: base/head SHA; files; decisions; tests/results; lint/typecheck/build; security/architecture; regressions; fixed errors; risks/UNKNOWNs; screenshots/artifacts when relevant; proposed Checkpoint Delta. Audit verdict: APPROVED / CORRECTION REQUIRED / BLOCKED.

## STOP CONDITION
Stop when shell is reproducible, persistence survives restart, checks are green and no external integration beyond health detection has been implemented.
