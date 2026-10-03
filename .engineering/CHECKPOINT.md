# Checkpoint

## Current state
- IRIS-STUDIO-WO-0001 repository foundation: **COMPLETE**.
- IRIS-STUDIO-WO-0002 MVP planning: **APPROVED**.
- IRIS-STUDIO-WO-0003 / M01 Local Core & Dashboard: **APPROVED AND MERGED**.
- M01 merge commit on `main`: `b85c6f22be21c74d878379570dd426a243483a1c`.
- M01 execution base: `f30937d57980ee4280487ba167677ab0cb170d8d`.
- Executor candidate before independent audit: `f8515dd874a5e96bd810e641dfdb9b3214a602f9`.
- Independent-audit correction commit: `1b6758e0fe1cc6197fe785368c4b883153416c91`.
- Final checkpoint/evidence candidate before squash merge: `16c932de49a83a0ec2e7fa7bb1dd4d05c823cb09`.
- MVP module completion: **1 of 8 approved modules (12.5%)**.
- GEF Bootstrap remains pinned at **1.1.2**. Historical provenance/mutable-ref/operator-stale/drift observations remain `REVIEW` / known limitation and are not reclassified.
- Next legal implementation increment: **M02 / IRIS-STUDIO-WO-0004 — Codex Bridge**.

## M01 proven behavior
- Host-native Next.js + TypeScript dashboard runs on loopback.
- SQLite schema and ordered migrations initialize deterministically.
- Projects and briefs can be created, listed, reopened, and survive a real process restart.
- Project workspaces are isolated outside the source repository with path/symlink confinement checks.
- System Health reports IRIS/SQLite plus observational Codex CLI, ComfyUI and Blender availability without executing those integrations.
- Public project API does not expose physical workspace paths.
- Required lint, typecheck, build, unit/E2E, dependency audit and repository/GEF baseline checks passed on the final audited candidate.

## Independent audit
The independent audit found one concrete documentation defect: `README.md` still instructed a free-form `npx playwright install chromium` even though CI had moved to the lockfile-backed Playwright command after a supply-chain finding. It was corrected in the same Work Order/PR to `npm run ci:install:playwright`, then revalidated successfully.

Sonar reported Quality Gate PASS and zero Security Hotspots, while also reporting non-gating maintainability annotations and no imported coverage metric. Socket reported no new dependency alerts. CodeRabbit was triggered after the PR left Draft but remained processing during checkpoint compilation; it stays recorded as `UNKNOWN/PENDING` and was not used as evidence of PASS.

## Stop rule
M01 is closed and merged. Do not implement M03 or later work. M02 is the sole next necessary increment.
