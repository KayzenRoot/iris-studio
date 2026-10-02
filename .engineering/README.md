# IRIS Studio source hierarchy

This directory is the canonical repository Source Pack.

## Authority order
1. Owner-approved Work Order and Context Lock define increment scope.
2. `REQUIREMENTS.md`, `SCOPE.md`, `ARCHITECTURE.md`, `DECISIONS-LEDGER.md`, `DEFINITION-OF-DONE.md` and `SECURITY.md` record approved decisions.
3. `TEST-PLAN.md`, `DEPLOYMENT.md`, `MODULES.md` and `BACKLOG.md` refine execution/validation.
4. `CHECKPOINT.md` and `CHECKPOINT.json` report progress but do not grant scope.
5. Root README/AGENTS are entry/execution guidance.

## Canonical documents
- [Project overview](PROJECT-OVERVIEW.md)
- [Requirements](REQUIREMENTS.md)
- [Scope](SCOPE.md)
- [Architecture](ARCHITECTURE.md)
- [Security](SECURITY.md)
- [Test and benchmark plan](TEST-PLAN.md)
- [Deployment](DEPLOYMENT.md)
- [Modules](MODULES.md)
- [Backlog](BACKLOG.md)
- [Definition of done](DEFINITION-OF-DONE.md)
- [Decisions ledger](DECISIONS-LEDGER.md)
- [Checkpoint](CHECKPOINT.md) / [machine checkpoint](CHECKPOINT.json)
- [Work Orders](work-orders/README.md)

## GEF state preserved from foundation
GEF Bootstrap CLI `@gef-bootstrap/cli@1.1.2` is pinned in `package.json` and `package-lock.json`. Official `gef init --apply` created `.gef/init-state.json`; later `gef adopt --apply` created `.gef/adopt-state.json`. Receipts remain under `.gef/`; local journals/recovery under `.gef-private/` remain excluded from Git.

GEF 1.1.2 does not provide a generic consumer Source Pack/workflow template set. Its CLI exposes `init`, `adopt`, `upgrade`, `doctor`, and `status`; no separate generic `validate` command exists. Historical stale/UNEXPECTED drift remains a known REVIEW state and must not be silently upgraded to PASS.
