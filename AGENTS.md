# Repository instructions

- Read `.engineering/README.md` and `.engineering/CHECKPOINT.md` before work. Treat the approved Work Order and its Context Lock as the scope for each change.
- Keep `.engineering/` as the canonical project source pack. Product decisions that have not been approved must remain marked `TBD`.
- Do not implement product features or select an application framework, database, deployment topology, model runtime, or integration design without an approved planning increment.
- Keep the GEF Bootstrap CLI dependency and lockfile exact. Use `npm ci` for clean installs and run the repository baseline checks that exist in `package.json`.
- Preserve unrelated work. Do not force-push, rewrite history, expose secrets, or treat unknown or partial evidence as a pass.
- Do not add application tests or claim application behavior is validated before application code and a test plan are admitted.
