# Decisions ledger

This ledger preserves approved historical decisions and appends proposed MVP decisions. Existing decisions are never replaced by later summaries.

## IRIS-STUDIO-WO-0001 — approved foundation decisions

### Empty-repository base exception
Before the foundation work, the verified `KayzenRoot/iris-studio` repository had no branch refs or base commit. Its GitHub default branch was set to `main`, the local checkout was empty, and the authenticated `KayzenRoot` account had admin permission. Under section 6 of the Work Order, one base commit was created on `main`: `818eb53d53371fd595a6b8303f1ddc0d0fdcd0a8`, containing only a minimal README and no product implementation. The substantive work proceeded on `feat/IRIS-STUDIO-WO-0001-bootstrap`.

The SHA-256 fingerprint of that initial README before the Source Pack replaced it was `6A963690AD1CB25BA1E34D33B49084A0310315A6BB6FBB5026F1501345967D22`.

### GEF Bootstrap package
Use the official `@gef-bootstrap/cli` package at exactly `1.1.2`, installed as a locked development dependency. The package identity, release tag `v1.1.2` at source commit `af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82`, published npm metadata, tool version, and initialization procedure were verified from the GEF release and registry. The npm tarball SHA-256 is `331a5d035188ef1dc1c92e5c4e5317edcdbf45956dc07703231bbc64dbb7ab97`; npm registry integrity is `sha512-zLu0oaBWqwIPviZgN0PTk1/5QlsHK8r7aCNOkMop0MnlzqFZ1um3zfkRO2l8hx005nd/2xZ/Ll/lDzYUbH01uw==`. The tagged installation guide has stale publication text; the newer release record and registry metadata confirm the 1.1.2 publication.

### GEF managed baseline
After the Source Pack was committed, `gef status` observed a clean Git tree and valid checkpoint but reported `UNEXPECTED` drift and `stale: true` against the earlier init fingerprint. The read-only `gef adopt` preflight then reported a clean tree, ready canonical checkpoint, and no conflict. Its official `--apply` transaction created `.gef/adopt-state.json` and a receipt without changing project files. GEF 1.1.2 status prefers an existing init state over an adopt state when selecting its drift reference, so the status remains stale against the original init observation; report this as `REVIEW` and do not reinterpret it as a clean-drift result.

### Foundation product boundary
WO-0001 approved no application framework, database, integration architecture, deployment topology, product feature, or detailed requirement. Those decisions remained TBD until MVP planning.

## IRIS-STUDIO-WO-0002 — proposed MVP decisions
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

These WO-0002 decisions become canonical only after PR approval and merge.
