# Security baseline

## Repository controls inherited from WO-0001
- GitHub secret scanning and push protection are enabled.
- GitHub private vulnerability reporting is enabled.
- Dependency vulnerability alerts and Dependabot security updates are enabled.
- Workflow-level and repository-default `GITHUB_TOKEN` permissions are read-only.
- Workflow actions are pinned to full commit SHAs, and the repository allows only the actions used by the baseline workflow.
- `npm audit --audit-level=high` is part of baseline validation.

## GitHub security entitlement limits preserved from WO-0001
The repository is public and owned by the personal GitHub user `KayzenRoot`. Provider-pattern secret scanning and push protection are enabled. Optional `secret_scanning_non_provider_patterns` and `secret_scanning_validity_checks` remain disabled under the current account/repository entitlement. Reassess only if ownership or entitlements change.

GEF `doctor` reports dependency provenance as `unverified` and GitHub security capability as `REVIEW` in the recorded foundation environment; toolchain/repository invariants passed. GEF 1.1.2 registry attestation metadata was present and the npm tarball SHA-256 matched the immutable release record. `npm audit signatures` was attempted but npm returned E404 while resolving bundled unpublished workspace dependency `@gef-bootstrap/kernel@0.0.0`; it is not a CI gate. These observations remain `REVIEW`, not PASS.

## MVP trust boundaries
1. Dashboard/user input.
2. Local filesystem/project workspace.
3. Codex child process.
4. ComfyUI localhost service and workflow outputs.
5. Blender MCP/process and Python execution environment.
6. Generated website dependencies/build scripts.
7. Browser preview.

## MVP required controls
- Never require, read, copy or persist an OpenAI API key for the primary MVP Codex path.
- Never scrape Codex authentication stores/tokens; invoke the authenticated CLI as an external client.
- Spawn child processes with argument arrays, not shell-concatenated user strings.
- Allowlist executable paths and normalize/contain project paths.
- Generated projects/tool outputs may write only inside approved project workspaces unless user explicitly selects another export path.
- Do not expose Blender MCP or ComfyUI externally by default; localhost only.
- Do not expose unrestricted arbitrary-Python Blender MCP tooling in default mode.
- Treat generated code and package scripts as untrusted until quality/security checks pass.
- Redact logs and cap retained process output.
- Keep large/generated binary artifacts out of IRIS source Git history.

## M02 Codex Bridge controls
- Resolve only the native `codex` executable from `PATH`; never execute `.cmd`/`.bat` shims or user-supplied executable paths. Use Node process spawning with an argument array and `shell: false`.
- Detect ChatGPT sign-in through the supported `codex login status` command. Keep only transient fixed classification markers; discard all raw login output. Do not open, inspect, copy, log or persist Codex credentials. Remove API-key/token/secret variables from the child environment and do not accept API keys in IRIS requests or project settings.
- Pass task text through stdin, not the process command line. Invoke non-interactively with JSON events, ephemeral session storage, `--ignore-user-config`, `workspace-write` sandboxing, empty additional writable roots, temporary-root exclusions and network access disabled. The user's auth store remains available only to the Codex CLI. Do not offer arbitrary executable, shell, cwd, args, sandbox, or approval-policy controls in the API.
- Native Windows uses Codex's documented `unelevated` sandbox fallback because the default sandbox did not perform the disposable marker write in the live smoke. This uses the restricted-token/ACL boundary, while IRIS path/tree checks remain active and sandbox network access stays disabled; the elevated mode provides stronger network isolation.
- Derive workspace paths from persisted project identity, resolve them canonically, reject repository-contained/outside paths and symlinks/junctions/reparse points in the project tree, and revalidate immediately before spawn.
- Limit active Codex work to one job, task size to 8 KiB UTF-8, runtime to five minutes, and retained stdout/stderr to 32 KiB each. Normalize JSON events; redact credential-like text before persistence or display; never persist the task prompt or raw JSON event stream.
- Record a versioned structured result under the IRIS user-data directory, outside the project workspace and source repository. Cancellation, timeout and shutdown kill the process tree; stale RUNNING records become INTERRUPTED and are not resumed automatically.
- Require same-origin loopback POST requests for start/cancel. Generic CI uses process doubles; live CLI smoke is explicit and never reads credential stores.

## Risk levels
M01, M03, M06, M07: STANDARD.
M02, M04, M05, M08: ELEVATED because they execute local processes/models or resumable orchestration. ELEVATED increments require path-confinement tests, failure/recovery evidence and explicit subprocess/network review.

## Privacy
MVP is local-first. Data leaves the machine only through an external service already inherent to a configured tool. Codex jobs use the user's Codex/ChatGPT client path; IRIS must not silently introduce separate providers.

## Reporting
Use GitHub private vulnerability reporting for sensitive reports. Keep secrets/exploit-sensitive data out of public issues, PRs, logs and screenshots. See root SECURITY.md.
