# Context Lock — IRIS-STUDIO-WO-0004

Status: COMPILED / READY FOR EXECUTOR — recompiled after IRIS-STUDIO-SEC-0001 baseline-policy change
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
- SECURITY.md: `a51bad830f2dd33d5f40465673de183b6ce26bea`
- MODULES.md: `96680c9357a5465ae1bca256d935fa0a70273196`
- IRIS-STUDIO-WO-0004.md: `b49c1151fe4b51a323b51b8746d260825bd951bd`
- AGENTS.md: `c16484815400d5f6ff361474bd6d17a4fb168853`

## Recompiled governance state — 2026-10-03
The lock was marked STALE after the audit-baseline policy changed. It was recompiled against current `origin/main` `17baf076dedc5c17a37a5a9fe0b4b333f18b61a4`; the original 11 critical fingerprints plus the SECURITY.md base fingerprint match 12/12. The M02 candidate remains based on the same main SHA.

The following Git blob fingerprints bind the candidate governance Source Pack and its executable gate at recompilation time. If one changes, recompile this lock before proceeding:
- DECISIONS-LEDGER.md (candidate): `9cab8d21ca4bd9e322a9ef966ce6ea02ba684c58`
- SECURITY.md (candidate): `672d55cceae5e8fd86fae8ee15ef60166785d98c`
- TEST-PLAN.md (candidate): `aaf0329808433aaafd9bf0927713bc146757d557`
- security-exceptions/README.md: `ed269aff1b1781e2b63c1dd4079ea38235a9eaa9`
- security-exceptions/IRIS-STUDIO-SEC-0001.md: `9c5c77431f79551dc5029a5f3bf1a03883e2313a`
- security-exceptions/IRIS-STUDIO-SEC-0001.json: `029ce01dadc18766e43fcd3b047c015a9787d521`
- .github/workflows/baseline.yml: `7f1c9cea1fdc2cfec6712328cb0cd15839329108`
- package.json: `613a2f4e936ad2f55b23e6a5f3573c551100151d`
- scripts/check-baseline.mjs: `c968465a3f9d8837429dd6900d773d3ff7888ede`
- scripts/audit-policy.mjs: `7d35227ae9cd1e8009bf2e0406afba8184c1c832`
- tests/unit/audit-policy.test.mjs: `464ac606059c9770fb37c8ce8da5ef229ce9128c`
- vitest.config.mts: `73e72fcdce08c0de8d8b200087be43be65598805`
- README.md: `087ea2caf0318c62e538981963e0596774bfe971`

The exception Markdown fingerprint was recompiled after a whitespace-only diff-check correction on 2026-10-03; all other candidate fingerprints and the main base remain unchanged.

This recompilation admits only the exact dev-only dependency exception recorded by IRIS-STUDIO-SEC-0001 and the fail-closed `audit:policy` gate. It does not change M02 scope, dependency versions, or any M03 boundary.

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
