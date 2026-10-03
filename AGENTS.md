# Repository instructions

- Read `.engineering/README.md` and `.engineering/CHECKPOINT.md` before work. Treat the approved Work Order and its Context Lock as the scope for each change.
- Keep `.engineering/` as the canonical project source pack. Product decisions that have not been approved must remain marked `TBD`.
- Do not implement product features or select an application framework, database, deployment topology, model runtime, or integration design without an approved planning increment.
- Keep the GEF Bootstrap CLI dependency and lockfile exact. Use `npm ci` for clean installs and run the repository baseline checks that exist in `package.json`.
- Preserve unrelated work. Do not force-push, rewrite history, expose secrets, or treat unknown or partial evidence as a pass.
- Do not add application tests or claim application behavior is validated before application code and a test plan are admitted.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
