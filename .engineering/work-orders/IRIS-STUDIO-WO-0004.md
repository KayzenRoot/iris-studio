# IRIS-STUDIO-WO-0004 — M02 Codex Bridge

Status: APPROVED
Risk: ELEVATED
Depends on: M01 APPROVED and merged

## OBJECTIVE
Connect IRIS to the locally installed Codex CLI authenticated through the user's ChatGPT account, without requiring an OpenAI API key, and expose a safe execution bridge.

## CONTEXT
IRIS Studio is a local-first website creation orchestrator. M02 turns the observational M01 Codex health signal into a bounded local execution bridge. M03 and all website-generation behavior remain out of scope.

## SCOPE
- Detect Codex CLI installation/version.
- Detect usable authenticated state by supported CLI invocation without reading credentials.
- Execute bounded Codex jobs from IRIS.
- Stream bounded/redacted stdout/stderr/status into GenerationRun.
- Cancellation, timeout, retry classification and structured result files.
- Safe workspace contract confining Codex to the selected project workspace.
- Dashboard telemetry and cancellation control.

## OUT OF SCOPE
- OpenAI API integration/API keys/credit management.
- Art-direction/site-building prompts.
- Separate remote agent service.
- ComfyUI, Blender MCP or generated websites.

## FILES / SOURCES TO READ
- .engineering/README.md
- .engineering/CHECKPOINT.md and CHECKPOINT.json
- .engineering/DECISIONS-LEDGER.md
- .engineering/SCOPE.md
- .engineering/ARCHITECTURE.md
- .engineering/REQUIREMENTS.md
- .engineering/DEFINITION-OF-DONE.md
- .engineering/TEST-PLAN.md
- .engineering/MODULES.md
- .engineering/context-locks/IRIS-STUDIO-WO-0004.md
- Relevant predecessor Evidence Bundles and merged code

## CONTEXT LOCK
Recompiled during execution after the governed audit-policy change. Final candidate reported base fingerprints 12/12 and candidate fingerprints 13/13 against `main` base `17baf076dedc5c17a37a5a9fe0b4b333f18b61a4`.

## REQUIREMENTS
- Primary path works with ChatGPT/Codex authentication and no API key. **PASS**
- Never inspect/expose/persist Codex auth tokens. **PASS**
- Every job records run ID/workspace/exit/result evidence. **PASS**
- Dashboard can cancel running Codex jobs. **PASS**

## ARCHITECTURE RULES
- CodexAdapter interface isolates CLI details. **PASS**
- Spawn with argument arrays, never shell-concatenated user strings. **PASS**
- Allowlist executable/workspaces. **PASS**
- Redacted bounded logs. **PASS**
- Versioned JSON job schemas. **PASS**

## CONSTRAINTS
- M02 only. **PASS**
- GEF Bootstrap 1.1.2 preserved. **PASS**
- No force-push/history rewrite/destructive user-data operation. **PASS**
- Subprocesses/filesystem paths treated as untrusted boundaries. **PASS**
- Unavailable evidence is not represented as PASS. **PASS**

## ACCEPTANCE CRITERIA
- Health distinguishes missing CLI, unauthenticated CLI and ready CLI. **PASS**
- Harmless live test job wrote only inside a disposable workspace and returned structured completion. **PASS**
- Cancel/timeout terminates the process tree and persists terminal state. **PASS**
- No OpenAI API key requested or introduced. **PASS**
- Path/symlink escape rejected. **PASS**

## TESTS
- Adapter unit tests with process doubles. **PASS**
- Live smoke against available local Codex. **PASS**
- Cancellation/timeout tests. **PASS**
- Path/command-injection tests. **PASS**
- lint + typecheck + build + security review. **PASS**
- Runtime production dependency audit. **PASS**
- Governed full-tree audit policy. **PASS with IRIS-STUDIO-SEC-0001**

## DELIVERABLES
- CodexAdapter/execution service. **DELIVERED**
- Dashboard Codex telemetry. **DELIVERED**
- Structured run schema/redaction. **DELIVERED**
- Evidence proving no project API key requirement. **DELIVERED**
- Scoped PR #15. **DELIVERED**

## SECURITY EXCEPTION
`IRIS-STUDIO-SEC-0001` temporarily governs the exact dev-only `GHSA-VFJ7-8CJW-P6XM` chain. Production audit is clean. The exception must be reviewed by 2026-10-17 and removed immediately when a compatible official fix is available. It does not waive the final MVP DoD requirement to close known High/Critical findings.

## INDEPENDENT AUDIT
Verdict: **APPROVED**.

Manual audit found no blocking defect. The implementation does not expose arbitrary shell execution, does not read/store Codex credentials, confines jobs to project workspaces, provides bounded/redacted logs, kills process trees on cancel/timeout, persists interrupted state safely, and does not implement M03. CodeRabbit remained processing and is recorded as PENDING/UNKNOWN rather than PASS.

Independent evidence: `.engineering/evidence/IRIS-STUDIO-WO-0004-independent-audit.md`.

## STOP CONDITION
**SATISFIED.** IRIS safely invokes, observes and cancels bounded Codex CLI jobs inside a confined project workspace through the user's existing ChatGPT-authenticated local Codex session, with no IRIS OpenAI API-key dependency and no M03 functionality.
