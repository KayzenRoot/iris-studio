# Context Lock — IRIS-STUDIO-WO-0004

Status: COMPILED / READY FOR EXECUTOR
Risk: ELEVATED
Work Order: IRIS-STUDIO-WO-0004 — M02 Codex Bridge
Base main SHA: `17baf076dedc5c17a37a5a9fe0b4b333f18b61a4`
Branch: `feat/IRIS-STUDIO-WO-0004-codex-bridge`

## Dependency gate
- M01 / IRIS-STUDIO-WO-0003 is APPROVED and merged.
- M01 canonical post-merge closeout is aligned on main.
- M02 is the sole next legal implementation increment.
- M03 and later modules remain blocked.

## Critical source fingerprints
- CHECKPOINT.md: `5bc248f2267f2e44408dfadbead645a9b5f21f90`
- CHECKPOINT.json: `51764e2ca3eb3af40445389f4d6d08fd749208da`
- DECISIONS-LEDGER.md: `01ff0eab2350606f518879407bfcb68c97f333d9`
- SCOPE.md: `fd28a1ffa452cbe1efbe06f87d5b05378abf8042`
- ARCHITECTURE.md: `864253b83e298e9604afdb08f6725b068743f6eb`
- REQUIREMENTS.md: `4796be9af9af763b37057d48248befcab30d3d93`
- DEFINITION-OF-DONE.md: `71d1fe6932f1458b714179bd5be4a25c4f50b67e`
- TEST-PLAN.md: `aed9c3627a6b9c09e7db1963cdefce08e7e54af0`
- MODULES.md: `96680c9357a5465ae1bca256d935fa0a70273196`
- IRIS-STUDIO-WO-0004.md: `b49c1151fe4b51a323b51b8746d260825bd951bd`
- AGENTS.md: `c16484815400d5f6ff361474bd6d17a4fb168853`

## Approved M02 interpretation
M02 turns the M01 observational Codex health signal into a safe local execution bridge. The primary path must use the user's already-authenticated local Codex client/CLI and must not require an OpenAI API key inside IRIS.

The implementation must:
- discover the installed Codex CLI/version using supported local commands;
- determine whether a usable authenticated session exists without opening, scraping, copying, logging, persisting or transmitting authentication tokens;
- introduce a `CodexAdapter` boundary rather than coupling UI/services directly to process details;
- spawn processes with executable + argument arrays, never shell-concatenated user strings;
- confine every execution to the approved project workspace and reject path escapes, including symlink/canonical-path escapes;
- persist run identity, workspace identity, lifecycle state, exit/result metadata and bounded/redacted logs;
- support cancellation and timeout, including child-process-tree cleanup appropriate to the supported host OS;
- expose dashboard telemetry/status needed to observe and cancel a run;
- keep generic CI deterministic using doubles/fakes; live local Codex evidence is required only when Codex is actually available and must otherwise be explicitly SKIPPED/UNKNOWN.

## Explicit non-goals
- No OpenAI API key integration, API billing/credit handling or direct REST API path.
- No Art Director prompt, Visual DNA generation or website-building prompt logic.
- No ComfyUI, Blender MCP or website generation.
- No general remote-agent service.
- Do not expose a generic arbitrary-shell execution endpoint.

## Elevated-risk review focus
Independent review must explicitly inspect:
1. command-injection resistance;
2. executable allowlisting/resolution;
3. workspace/path/symlink confinement;
4. authentication-token non-access;
5. stdout/stderr redaction and retention bounds;
6. timeout/cancellation/process-tree cleanup;
7. persistence state transitions and crash recovery;
8. distinction between CLI installed, unauthenticated, ready, running, failed, cancelled and timed out;
9. API/UI ability to trigger only the bounded Codex capability admitted by this Work Order;
10. no M03 scope leakage.

## STALE rule
Immediately before implementation edits, compare current `main` and the critical blob SHAs above. If any critical source changed, mark this Context Lock **STALE**, re-read the canonical Source Pack and recompile before continuing.

## Executor STOP CONDITION
Stop only when IRIS can safely invoke, observe and cancel bounded Codex CLI jobs inside the selected project workspace through the user's existing local Codex/ChatGPT authentication path, with no IRIS OpenAI API-key dependency, all required tests/checks green, and no M03 functionality implemented.
