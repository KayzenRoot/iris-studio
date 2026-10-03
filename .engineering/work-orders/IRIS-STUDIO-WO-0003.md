# IRIS-STUDIO-WO-0003 — M01 Local Core & Dashboard

Status: APPROVED
Risk: STANDARD
Depends on: WO-0002 merged

## OBJECTIVE
Create the minimal local IRIS Studio application shell: browser dashboard, local persistence, project/job model, health surface and deterministic developer runtime.

## CONTEXT
IRIS Studio is a local-first website creation orchestrator. The MVP must produce complete websites, not just visual assets. Codex is the reasoning/engineering executor through the locally authenticated Codex CLI; ComfyUI and Blender perform local visual work.

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
Compiled at `.engineering/context-locks/IRIS-STUDIO-WO-0003.md` against base `f30937d57980ee4280487ba167677ab0cb170d8d`. The executor verified the lock remained current before implementation.

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
- Preserve GEF Bootstrap 1.1.2 and governance.
- No force-push/history rewrite/destructive user-data operation.
- Treat subprocesses and filesystem paths as untrusted boundaries.
- Never claim unavailable dependency testing as PASS.

## ACCEPTANCE CRITERIA
- Fresh clone installs and starts locally with documented commands. **PASS**
- Project can be created, listed and reopened after restart. **PASS**
- Clean database migration is deterministic and tested. **PASS**
- Health page reports AVAILABLE/UNAVAILABLE/MISCONFIGURED without crashing. **PASS**
- No unimplemented integration is represented as working. **PASS**

## TESTS
- Unit tests for config/project/persistence. **PASS**
- Migration/persistence smoke including reopen/restart. **PASS**
- UI smoke create/open project. **PASS**
- lint + typecheck + production build. **PASS**
- GEF/repository baseline. **PASS**, with historical GEF REVIEW states preserved honestly.

## DELIVERABLES
- Local application shell/dashboard. **DELIVERED**
- SQLite schema/migrations. **DELIVERED**
- Workspace abstraction. **DELIVERED**
- Docs + Evidence Bundle. **DELIVERED**
- Single scoped PR #13. **DELIVERED**

## INDEPENDENT AUDIT
Verdict: **APPROVED**.

The audit reviewed scope, Context Lock, critical filesystem/SQLite/API/health boundaries, persistence/restart tests and CI evidence. One documentation inconsistency involving a free-form Playwright `npx` command was corrected on the same PR and revalidated. CodeRabbit remained processing and is recorded as PENDING/UNKNOWN rather than PASS.

Independent audit evidence: `.engineering/evidence/IRIS-STUDIO-WO-0003.md`.

## STOP CONDITION
**SATISFIED.** The shell is reproducible, persistence survives restart, required checks are green, System Health is observational only, and no external integration beyond health detection is implemented.
