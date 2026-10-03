# Checkpoint

## Current state
- IRIS-STUDIO-WO-0001 repository foundation: **COMPLETE**.
- IRIS-STUDIO-WO-0002 MVP planning: **APPROVED**.
- IRIS-STUDIO-WO-0003 / M01 Local Core & Dashboard: **APPROVED**.
- M01 execution base: `f30937d57980ee4280487ba167677ab0cb170d8d`.
- Executor candidate before independent audit: `f8515dd874a5e96bd810e641dfdb9b3214a602f9`.
- Independent-audit correction commit: `1b6758e0fe1cc6197fe785368c4b883153416c91`.
- MVP module completion: **1 of 8 approved modules (12.5%)**.
- GEF Bootstrap remains pinned at **1.1.2**. Historical provenance/mutable-ref/operator-stale/drift observations remain `REVIEW` / known limitation and are not reclassified.
- Next legal implementation increment after this PR reaches `main`: **M02 / IRIS-STUDIO-WO-0004 — Codex Bridge**.

## M01 proven behavior
- Host-native Next.js + TypeScript dashboard runs on loopback.
- SQLite schema and ordered migrations initialize deterministically.
- Projects and briefs can be created, listed, reopened, and survive a real process restart.
- Project workspaces are isolated outside the source repository with path/symlink confinement checks.
- System Health reports IRIS/SQLite plus observational Codex CLI, ComfyUI and Blender availability without executing those integrations.
- Public project API does not expose physical workspace paths.
- Required lint, typecheck, build, unit/E2E, dependency audit and repository/GEF baseline checks pass on the audited candidate.

## Independent audit
The independent audit found one concrete documentation defect: `README.md` still instructed a free-form `npx playwright install chromium` even though CI had moved to the lockfile-backed Playwright command after a supply-chain finding. It was corrected in the same Work Order/PR to `npm run ci:install:playwright`, then the corrected HEAD was revalidated successfully.

Sonar reports Quality Gate PASS and zero Security Hotspots, while also reporting non-gating maintainability annotations and no imported coverage metric. Socket reports no new dependency alerts. CodeRabbit was manually triggered after the PR left Draft but its review was still processing at checkpoint compilation; it is therefore `UNKNOWN/PENDING` and is not used as evidence of PASS.

## Stop rule
M01 is complete after this approved checkpoint/evidence commit is validated and merged. Do not implement M03 or later work. M02 is the sole next necessary increment.
