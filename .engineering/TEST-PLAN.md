# Test and benchmark plan

Layers: unit; SQLite/process/integration; Playwright desktop/mobile; security path/command tests; generated-site clean install/lint/typecheck/build/nav; accessibility/reduced-motion; performance/Lighthouse/asset budgets; optional local 3D frame sampling.

Generic CI must not fake Codex/ComfyUI/Blender availability. Use doubles in CI; live local runs record explicit evidence. Unavailable integration is SKIPPED/UNKNOWN, never PASS.

Default benchmark fixture gates: production build; no uncaught acceptance console errors; required routes; desktop/mobile smoke; Accessibility >=90; Lighthouse Performance >=90 desktop and >=80 mobile; CLS <=0.1; required reduced-motion/non-WebGL fallbacks.

M07 allows at most two automatic correction rounds per cycle. Remaining failure blocks READY.

Existing npm/GEF baseline remains mandatory.
