# IRIS Studio source hierarchy

This directory is the canonical repository source pack. It records the approved project context and the foundation state without filling product decisions that have not been planned.

## Authority order

1. An owner-approved Work Order and its Context Lock define the scope of an increment.
2. `.engineering/REQUIREMENTS.md`, `SCOPE.md`, `ARCHITECTURE.md`, `DECISIONS-LEDGER.md`, and `SECURITY.md` record approved project decisions. Unapproved product choices remain `TBD`.
3. `.engineering/CHECKPOINT.md` and `CHECKPOINT.json` report current progress; they do not grant scope or replace source decisions.
4. `README.md` is the repository entry point. Root `AGENTS.md` supplies execution rules consistent with this hierarchy.

The approved project context is limited to a local-first product intended to orchestrate high-quality website creation. Its product architecture, framework, database, integrations, deployment topology, features, and acceptance criteria remain `TBD`.

## Canonical documents

- [Project overview](PROJECT-OVERVIEW.md)
- [Requirements](REQUIREMENTS.md)
- [Scope](SCOPE.md)
- [Architecture](ARCHITECTURE.md)
- [Security](SECURITY.md)
- [Test and benchmark plan](TEST-PLAN.md)
- [Deployment](DEPLOYMENT.md)
- [Backlog](BACKLOG.md)
- [Definition of done](DEFINITION-OF-DONE.md)
- [Decisions ledger](DECISIONS-LEDGER.md)
- [Checkpoint](CHECKPOINT.md) and [machine-readable checkpoint](CHECKPOINT.json)

## GEF state

GEF Bootstrap CLI `@gef-bootstrap/cli@1.1.2` is pinned in `package.json` and `package-lock.json`. The official `gef init --apply` created `.gef/init-state.json` and its transaction receipt under `.gef/`. Local transaction journals and recovery data under `.gef-private/` are excluded from Git.

The v1.1.2 package does not provide a generic consumer Source Pack or repository workflow template set. Its official initialization creates GEF-managed state and a receipt; this project's honest Source Pack and baseline workflow are therefore authored from the Work Order. The CLI exposes `init`, `adopt`, `upgrade`, `doctor`, and `status`; no separate `validate` command is present.
