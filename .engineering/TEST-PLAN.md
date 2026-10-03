# Test and benchmark plan

Layers: unit; SQLite/process/integration; Playwright desktop/mobile; security path/command tests; generated-site clean install/lint/typecheck/build/nav; accessibility/reduced-motion; performance/Lighthouse/asset budgets; optional local 3D frame sampling.

Generic CI must not fake Codex/ComfyUI/Blender availability. Use doubles in CI; live local runs record explicit evidence. Unavailable integration is SKIPPED/UNKNOWN, never PASS.

Default benchmark fixture gates: production build; no uncaught acceptance console errors; required routes; desktop/mobile smoke; Accessibility >=90; Lighthouse Performance >=90 desktop and >=80 mobile; CLS <=0.1; required reduced-motion/non-WebGL fallbacks.

M07 allows at most two automatic correction rounds per cycle. Remaining failure blocks READY.

Existing npm/GEF baseline remains mandatory.

## M01 Local Core & Dashboard
- Unit: validate configuration, enforce repository-external data/workspace paths, create/list/reopen a project across store restart, validate migrations and reject malformed or excessive project briefs.
- Health: exercise AVAILABLE/UNAVAILABLE/MISCONFIGURED observations with injected probes; assert the ComfyUI check remains loopback-only and Codex authentication is not inferred.
- Browser smoke: use Chromium against the production server to create a project, open its detail page, reload, and confirm persisted brief data. Store the screenshot in `.engineering/evidence/`.
- Required commands: `npm ci`, `npm run check:baseline`, `npm run gef:doctor`, `npm run gef:status`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`, and `npm audit --audit-level=high`.
- CI installs Chromium for Playwright. Live integrations remain unavailable/unknown unless directly observed; generic CI never fakes their availability.
