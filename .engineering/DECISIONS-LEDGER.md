# Decisions ledger

This ledger preserves approved historical decisions and appends approved MVP decisions. Existing decisions are never replaced by later summaries.

## IRIS-STUDIO-WO-0001 — approved foundation decisions

### Empty-repository base exception
Before the foundation work, the verified `KayzenRoot/iris-studio` repository had no branch refs or base commit. Its GitHub default branch was set to `main`, the local checkout was empty, and the authenticated `KayzenRoot` account had admin permission. Under section 6 of the Work Order, one base commit was created on `main`: `818eb53d53371fd595a6b8303f1ddc0d0fdcd0a8`, containing only a minimal README and no product implementation. The substantive work proceeded on `feat/IRIS-STUDIO-WO-0001-bootstrap`.

The SHA-256 fingerprint of that initial README before the Source Pack replaced it was `6A963690AD1CB25BA1E34D33B49084A0310315A6BB6FBB5026F1501345967D22`.

### GEF Bootstrap package
Use the official `@gef-bootstrap/cli` package at exactly `1.1.2`, installed as a locked development dependency. The package identity, release tag `v1.1.2` at source commit `af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82`, published npm metadata, tool version, and initialization procedure were verified from the GEF release and registry. The npm tarball SHA-256 is `331a5d035188ef1dc1c92e5c4e5317edcdbf45956dc07703231bbc64dbb7ab97`; npm registry integrity is `sha512-zLu0oaBWqwIPviZgN0PTk1/5QlsHK8r7aCNOkMop0MnlzqFZ1um3zfkRO2l8hx005nd/2xZ/Ll/lDzYUbH01uw==`.

### GEF managed baseline
After the Source Pack was committed, `gef status` observed a clean Git tree and valid checkpoint but reported `UNEXPECTED` drift and `stale: true` against the earlier init fingerprint. The official `gef adopt --apply` created `.gef/adopt-state.json` and a receipt without changing project files. GEF 1.1.2 status still prefers the original init drift reference; preserve this as `REVIEW`.

### Foundation product boundary
WO-0001 approved no product architecture. Those decisions were deferred to MVP planning.

## IRIS-STUDIO-WO-0002 — approved MVP decisions
- D-002-01: Product = local-first single-operator complete website production app.
- D-002-02: Host-native MVP; Docker FUTURE.
- D-002-03: Next.js App Router + TypeScript dashboard; exact versions pinned in M01.
- D-002-04: SQLite metadata/persistence; binaries/workspaces on disk.
- D-002-05: Codex is MVP reasoning/engineering executor via locally authenticated CLI; no OpenAI API key required by primary path; IRIS never reads/stores Codex tokens.
- D-002-06: No second general-purpose local LLM in MVP.
- D-002-07: ComfyUI = curated local 2D + short website-loop media engine; third-party model weights are not bundled.
- D-002-08: IRIS owns constrained website-focused Blender MCP; no raw arbitrary-Python tool by default.
- D-002-09: Generated sites default Next.js + TypeScript; Three.js/R3F/GSAP opt-in by blueprint.
- D-002-10: STANDARD/PREMIUM/ABSURD quality modes.
- D-002-11: READY requires deterministic gates + final visual approval; automatic corrections are bounded.
- D-002-12: Eight large implementation Work Orders WO-0003..WO-0010.

## IRIS-STUDIO-WO-0003 — approved M01 implementation decisions
- D-003-01: Pin Next.js 16.3.8, React 19.3.0, better-sqlite3 13.0.3, Zod 4.6.5, TypeScript 5.9.3, Playwright 1.63.0, Vitest 5.0.3, and ESLint 10.12.0 exactly in `package.json`/`package-lock.json`; preserve `@gef-bootstrap/cli` at exactly `1.1.2`.
- D-003-02: Use `better-sqlite3` behind a server-side store with ordered SQL migrations for project, project brief, generation run, job, and artifact metadata.
- D-003-03: Keep the application bound to `127.0.0.1`; use a per-user data directory outside the repository for SQLite and project workspaces. Require explicit data paths to be absolute and reject repository-contained paths, including symlink escapes.
- D-003-04: M01 health is detection-only. Codex CLI and Blender are checked for executable presence; ComfyUI is queried only at its default loopback health endpoint. Authentication, MCP readiness, models, execution, and generated websites are not asserted.
- D-003-05: Playwright browser installation in documented validation uses the lockfile-backed repository script `npm run ci:install:playwright`, not a free-form `npx` fetch.

M01 independent audit is **APPROVED**. PR #13 was squash-merged as `b85c6f22be21c74d878379570dd426a243483a1c`.

## IRIS-STUDIO-WO-0004 — approved M02 implementation decisions
- D-004-01: Use the native locally installed Codex CLI as the sole MVP execution bridge; IRIS does not introduce an OpenAI API-key path.
- D-004-02: Classify ChatGPT readiness via supported CLI commands while retaining only readiness/version markers; never read or persist Codex credential-store contents or raw login output.
- D-004-03: Execute only fixed Codex argument arrays through `CodexAdapter`, with `shell:false`, prompt on stdin, canonical project cwd, ignored user config for task execution and bounded sandbox settings.
- D-004-04: Permit only one active Codex run per IRIS process in M02. Persist run/generation/job state plus sanitized bounded logs and versioned result metadata; never persist task prompt text.
- D-004-05: Revalidate the UUID-derived project workspace and full no-link tree before process launch; reject repository-contained/noncanonical/symlink paths.
- D-004-06: Cancellation/timeout terminates the process tree; after process restart, prior RUNNING/CANCELLING records become INTERRUPTED and are not resumed implicitly.
- D-004-07: Windows `unelevated` sandbox is accepted for the MVP bridge with its weaker network-isolation limitation explicitly recorded; `network_access=false` is not evidence of strong network isolation.
- D-004-08: M02 independent audit is APPROVED. The final audited checkpoint candidate `73e263f2c028ebe4b731fe1520b0a8dbf88c60ef` passed required final-head checks and PR #15 was squash-merged as `0a978130ef75509addd0514b18d822652d4cdddb`. M03 / IRIS-STUDIO-WO-0005 is the next legal increment.

## IRIS-STUDIO-WO-0004 — governed dependency exception
- D-SEC-0001-01 (2026-10-03): Temporary exception `IRIS-STUDIO-SEC-0001` governs only `GHSA-VFJ7-8CJW-P6XM` / `CVE-2026-93687`. The four High npm audit entries are confined to the recorded dev-only Next ESLint tooling path, the production-only audit has zero findings, and the official advisory lists no patched `braces` release. Do not downgrade the Next 16 toolchain to accept npm's incompatible major fix. Require `npm run audit:policy` plus the production-only audit; review by 2026-10-17 and remove immediately once an official compatible fix is available. This temporary exception does not waive the MVP Definition of Done requirement to close known High/Critical findings.
