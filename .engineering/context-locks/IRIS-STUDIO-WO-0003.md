# Context Lock — IRIS-STUDIO-WO-0003

Status: COMPILED / READY FOR EXECUTOR
Work Order: IRIS-STUDIO-WO-0003 — M01 Local Core & Dashboard
Base main SHA: `f30937d57980ee4280487ba167677ab0cb170d8d`
Branch: `feat/IRIS-STUDIO-WO-0003-local-core-dashboard`

## Critical source fingerprints
- CHECKPOINT.md: `6fe149f1fbe46f1d782676b1ece23a294d2d22e0`
- CHECKPOINT.json: `63a5edc155504577ba34f740fdfea9c5c0baabe4`
- DECISIONS-LEDGER.md: `326464652cdf3e3bb68a38f381e9f3aa2fad395f`
- SCOPE.md: `fd28a1ffa452cbe1efbe06f87d5b05378abf8042`
- ARCHITECTURE.md: `d504c8bca6003173a57154367e0acc154748c2d7`
- REQUIREMENTS.md: `4796be9af9af763b37057d48248befcab30d3d93`
- DEFINITION-OF-DONE.md: `71d1fe6932f1458b714179bd5be4a25c4f50b67e`
- TEST-PLAN.md: `1476b88537145f84c6bfecf5c1541b1c49997f44`
- IRIS-STUDIO-WO-0003.md: `32461d7c64441d523f4a93db9c013d92a02995b5`
- AGENTS.md: `dd31d32bfb22edcfea1dd146fa07aecf2726c108`

## Preflight interpretation
- WO-0002 is APPROVED and merged.
- WO-0003 is the sole next legal implementation increment.
- Product implementation at compilation time: 0%.
- GEF Bootstrap 1.1.2 remains pinned.
- Host-native runtime, Next.js + TypeScript, SQLite and local-only persistence are approved.
- Codex/ComfyUI/Blender execution is OUT OF SCOPE for M01. Only honest availability/health detection is allowed.
- Docker remains FUTURE for the MVP.

## STALE rule
Before any implementation edit, compare current `main` and these critical blob SHAs. If any critical source changed, mark this lock STALE, re-read canonical sources and recompile before continuing.

## Executor stop condition
Stop when the local shell is reproducible, persistence survives restart, checks are green, System Health reports integrations honestly, and no external integration beyond health detection has been implemented.
