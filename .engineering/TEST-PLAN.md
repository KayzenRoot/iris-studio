# Test and benchmark plan

Layers: unit; SQLite/process/integration; Playwright desktop/mobile; security path/command tests; generated-site clean install/lint/typecheck/build/nav; accessibility/reduced-motion; performance/Lighthouse/asset budgets; optional local 3D frame sampling.

Generic CI must not fake Codex/ComfyUI/Blender availability. Use doubles in CI; live local runs record explicit evidence. Unavailable integration is SKIPPED/UNKNOWN, never PASS.

Default benchmark fixture gates: production build; no uncaught acceptance console errors; required routes; desktop/mobile smoke; Accessibility >=90; Lighthouse Performance >=90 desktop and >=80 mobile; CLS <=0.1; required reduced-motion/non-WebGL fallbacks.

M07 allows at most two automatic correction rounds per cycle. Remaining failure blocks READY.

Existing npm/GEF baseline remains mandatory.

## M01 Local Core & Dashboard
- Unit: validate configuration, enforce repository-external data/workspace paths, create/list/reopen a project across store restart, validate migrations and reject malformed or excessive project briefs.
- Health: exercise M01 AVAILABLE/UNAVAILABLE/MISCONFIGURED observations and M02 Codex READY/UNAUTHENTICATED/UNAVAILABLE/MISCONFIGURED states with injected probes; assert ComfyUI remains loopback-only and no credential material is exposed.
- Browser smoke: use Chromium against the production server to create a project, open its detail page, reload, and confirm persisted brief data. Store the screenshot in `.engineering/evidence/`.
- Required commands: `npm ci`, `npm run check:baseline`, `npm run gef:doctor`, `npm run gef:status`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`, `npm audit --omit=dev --audit-level=high`, and `npm run audit:policy`. The policy gate runs and displays the full `npm audit --json`; only exact active exceptions in `.engineering/security-exceptions/` may account for dev-only High findings.
- CI installs Chromium for Playwright. Live integrations remain unavailable/unknown unless directly observed; generic CI never fakes their availability.

## M02 Codex Bridge
- Adapter unit tests use process doubles; assert native executable allowlisting, argument arrays, `shell: false`, prompt-on-stdin, ChatGPT-auth classification without retaining CLI output, and that API-key/token-like environment variables are not forwarded.
- Workspace tests reject wrong project identity, repository-contained roots, symlink/junction roots and nested symlinks, path traversal, and command-injection strings; all accepted paths resolve to the selected project workspace.
- Lifecycle tests cover running/terminal transitions, one active job, timeout, cancellation, process-tree cleanup, interrupted-run recovery, bounded output, and secret redaction in stdout/stderr/result JSON.
- Browser tests verify the Codex panel/history and reject unsafe start requests; service/process tests exercise job telemetry and cancellation without faking CLI availability in generic CI.
- A live local smoke uses the installed Codex CLI only when `codex login status` reports ChatGPT authentication. It writes a harmless marker only in a disposable project workspace, uses ephemeral CLI mode, and records PASS or explicit SKIP/UNKNOWN without exposing account or credential data.
- Run the live-only smoke with `npm run test:codex`; it is separate from generic `npm test` so CI never substitutes a fake CLI for the user's local integration.
- Generic CI uses process doubles and never claims live Codex availability. Required repository checks remain the existing baseline commands.
- Dependency audit policy is fail-closed: Critical and non-allowlisted High findings block; an allowlisted finding blocks if it reaches production, expires, changes identity/path, or gains a compatible fix. The full npm audit JSON is preserved in evidence and printed without suppression.
