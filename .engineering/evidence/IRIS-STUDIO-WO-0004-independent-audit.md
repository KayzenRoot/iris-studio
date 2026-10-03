# Evidence Bundle — Independent Audit — IRIS-STUDIO-WO-0004 / M02

## Verdict
**APPROVED**

## Git identity
- Repository: `KayzenRoot/iris-studio`
- PR: #15
- Base main: `17baf076dedc5c17a37a5a9fe0b4b333f18b61a4`
- Executor candidate audited: `a56669cc6df7267b5a1385a594095ac616ace1cf`

## Scope reviewed
M02 only: native Codex CLI discovery, ChatGPT-session classification, bounded local process execution, run persistence, output redaction, cancellation/timeout, workspace confinement, dashboard telemetry, API boundaries and dependency-security governance.

No Art Director, Visual DNA, ComfyUI, Blender MCP or website generation behavior was admitted.

## Manual security review

### Authentication / API-key boundary
- IRIS calls the supported local CLI and uses `codex login status` only to classify readiness.
- Login output is scanned transiently for markers and is not stored.
- Child environment uses an explicit safe-key allowlist and does not forward `OPENAI_API_KEY` or similarly named API credential variables.
- No code path asks the user for an API key or reads the Codex credential store.
- Live smoke confirms ChatGPT-authenticated CLI operation without an IRIS API-key dependency.

### Process boundary
- Only a native `codex`/Windows `codex.exe` discovered from PATH is accepted.
- Symlink executables are rejected.
- Execution uses fixed argument arrays, `shell:false`, a fixed sandbox mode/config, a canonical selected workspace and prompt via stdin.
- API callers cannot supply executable, raw arguments, sandbox settings, shell text or arbitrary cwd.
- Generic arbitrary-shell execution is not exposed.

### Workspace confinement
- Project IDs must be UUIDs.
- Persisted workspace must exactly match the UUID-derived project workspace.
- Project root/workspace cannot be symlink/junction or canonicalize outside the approved projects root.
- The full workspace tree is scanned for symbolic links before launch and revalidated after the async health probe and immediately at the process boundary.
- Repository-contained workspaces are rejected.
- The live disposable smoke produced exactly one expected marker file.

### Logs / results / paths
- Process output is byte-bounded.
- Secret-shaped strings are redacted.
- The exact submitted prompt is replaced with `[PROMPT]` if echoed.
- Repository/data/workspace physical paths are replaced before public persistence/output.
- Public run objects omit `workspacePath` and `resultPath`.
- Structured result files are created with exclusive-create semantics outside the project workspace under the local IRIS data directory.

### Cancellation / timeout / restart
- Unix runs use a detached process group and group SIGTERM followed by SIGKILL.
- Windows uses `taskkill.exe /PID <pid> /T /F` with an argument array and `shell:false`, with a child-kill fallback.
- Cancellation moves the persisted run through CANCELLING to a terminal state.
- Timeout returns TIMED_OUT.
- On store reopen, leftover RUNNING/CANCELLING Codex records become INTERRUPTED and their generic generation/job state becomes FAILED; runs are never resumed silently.

### Local HTTP boundary
- Mutating Codex endpoints require loopback + same-origin Origin/Host checks.
- Request body size is bounded.
- Public APIs return sanitized run models and do not accept filesystem/process-control parameters.

## Dependency-security review
Full npm audit remains 4 High / 0 Critical. The four package findings map to one affected descendant, `braces@3.0.3`, in the exact dev-only Next ESLint tooling path governed by `IRIS-STUDIO-SEC-0001`.

Production-only audit reports zero vulnerabilities. The policy gate:
- accepts only the exact GHSA/package/version/node/dependency-path identities;
- fails any Critical;
- fails any High not allowlisted;
- fails if the allowlisted advisory appears in production;
- fails if the exception is stale/expired;
- fails when a compatible npm fix appears;
- rejects path/version identity drift;
- independently requires `npm audit --omit=dev --audit-level=high` to pass.

The exception review deadline is 2026-10-17. It is an accepted temporary module-level risk, not a waiver of the final MVP DoD.

## Validation evidence
Exact executor candidate `a56669c...`:
- GitHub Actions run `37096016731`: SUCCESS.
- Install locked dependencies: PASS.
- Repository baseline / GEF diagnostics: PASS, with historical GEF REVIEW states preserved.
- Playwright Chromium setup: PASS.
- lint / typecheck / Next production build: PASS.
- unit tests: 39 PASS.
- E2E: 4 PASS.
- production audit: PASS / zero runtime vulnerabilities.
- `audit:policy`: PASS.
- live Codex smoke: PASS using CLI 0.160.0, ChatGPT status READY, run SUCCEEDED, exactly one workspace marker, result schema v1, no retained account/credential output.
- SonarCloud Quality Gate: PASS, 0 Security Hotspots.
- Socket Project Report / PR Alerts: PASS.
- Sonar reports 40 non-gating new code-quality annotations and no imported coverage metric; those are not misrepresented as absent.
- CodeRabbit was re-triggered after the PR left Draft and remained processing at checkpoint compilation. Status: PENDING/UNKNOWN, not PASS.

## Residual risks
1. Windows `unelevated` Codex sandbox provides weaker network isolation than elevated mode; `network_access=false` is not treated as proof of strong network isolation.
2. `IRIS-STUDIO-SEC-0001` remains active for a dev-only High advisory chain until its review/removal condition.
3. Sonar coverage is not imported as a metric, even though unit/E2E tests run and pass.
4. GEF provenance/mutable-ref/operator-stale observations remain REVIEW from prior increments.

## Checkpoint Delta
- M02: PLANNED -> **APPROVED**
- approved modules: **2 / 8**
- structural MVP progress: **25%**
- next legal increment after merge: **M03 / IRIS-STUDIO-WO-0005 — Senior Art Director & Visual DNA**
