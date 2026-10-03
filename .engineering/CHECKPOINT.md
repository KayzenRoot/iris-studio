# Checkpoint

## Current state
- IRIS-STUDIO-WO-0001 repository foundation: **COMPLETE**.
- IRIS-STUDIO-WO-0002 MVP planning: **APPROVED**.
- IRIS-STUDIO-WO-0003 / M01 Local Core & Dashboard: **APPROVED AND MERGED**.
- IRIS-STUDIO-WO-0004 / M02 Codex Bridge: **APPROVED**, pending merge of this final checkpoint/evidence commit.
- M02 execution base: `17baf076dedc5c17a37a5a9fe0b4b333f18b61a4`.
- Executor candidate before independent audit: `a56669cc6df7267b5a1385a594095ac616ace1cf`.
- MVP module completion after M02 approval: **2 of 8 approved modules (25%)**.
- GEF Bootstrap remains pinned at **1.1.2**. Historical provenance/mutable-ref/operator-stale/drift observations remain `REVIEW` / known limitation and are not reclassified.
- Temporary security exception `IRIS-STUDIO-SEC-0001` is ACTIVE through review deadline **2026-10-17** and does not waive the final MVP DoD requirement to close known High/Critical findings.
- Next legal implementation increment after this PR reaches `main`: **M03 / IRIS-STUDIO-WO-0005 — Senior Art Director & Visual DNA**.

## M02 proven behavior
- IRIS discovers the native Codex CLI/version and classifies the local ChatGPT authentication state without reading or persisting credentials.
- The primary execution path uses the user's existing local Codex/ChatGPT session and does not require an OpenAI API key.
- Codex execution is behind `CodexAdapter`; callers cannot supply executable, shell command, raw argument array, sandbox policy or arbitrary working directory.
- Jobs execute inside the canonical selected project workspace with repeated path/symlink/reparse-point confinement checks.
- Child processes use argument arrays with `shell:false`; prompts are passed over stdin.
- Logs are bounded, secret-shaped values and exact prompts are redacted, and physical workspace/data/repository paths are removed from public output.
- Timeout/cancel performs process-tree termination, including Windows `taskkill /T /F` with argument arrays.
- Run/job/result lifecycle is persisted; incomplete jobs are marked INTERRUPTED after process restart rather than resumed silently.
- Result documents are written outside the project workspace under the local IRIS data directory.
- Live smoke with Codex CLI 0.160.0 and ChatGPT session READY succeeded and created only the expected marker inside a disposable workspace.

## Security audit
- Runtime audit: **0 High / 0 Critical**.
- Full-tree audit: **4 High / 0 Critical**, all mapped to the single dev-only chain governed by `IRIS-STUDIO-SEC-0001`.
- `audit:policy` requires exact GHSA/package/version/path identities, rejects any Critical or non-allowlisted High, rejects production exposure, expires the exception at the deadline, and rejects a newly compatible npm fix.
- The npm-suggested downgrade of `@next/eslint-plugin-next` to 14.2.35 was not applied because it is a semver-major downgrade incompatible with the approved Next 16 line.
- Windows `unelevated` sandbox remains a documented residual risk: filesystem restrictions are present, but network isolation is weaker than elevated mode and `network_access=false` is not represented as proof of strong network isolation.

## Independent audit
Manual review covered process spawning, executable discovery, authentication handling, workspace identity, symlink/path confinement, API same-origin restrictions, log redaction, cancellation/timeout, process-tree cleanup, persistence/restart behavior, result placement, the governed dependency exception and M03 scope leakage.

No blocking defect was found in the M02 implementation. Sonar Quality Gate passed with 0 Security Hotspots; Socket checks passed. Sonar still reports non-gating code-quality annotations and no imported coverage metric. CodeRabbit was explicitly re-triggered after the PR left Draft but remained processing at checkpoint compilation; it is recorded as `UNKNOWN/PENDING` and is not used as evidence of PASS.

## Stop rule
M02 is complete after this approved checkpoint/evidence commit is validated and merged. Do not implement M04 or later work. M03 is the sole next necessary increment.
