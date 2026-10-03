# IRIS-STUDIO-SEC-0001 — dev-only dependency advisory

**Status:** ACTIVE, approved by the user's explicit instruction for WO-0004 on 2026-10-03

**Review deadline:** 2026-10-17 (14 days after approval; `audit:policy` treats the deadline as expired at 00:00 UTC)

**Scope:** the single advisory GHSA-VFJ7-8CJW-P6XM / CVE-2026-93687. No wildcard package, advisory, or version matching is permitted.

## Finding classification

| npm audit package finding | Version | Advisory / CVE | Severity | Complete dependency path | Scope | npm `fixAvailable` | Official fixed version |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `@next/eslint-plugin-next` | 16.3.8 | GHSA-VFJ7-8CJW-P6XM / CVE-2026-93687 | High | `root:devDependencies > @next/eslint-plugin-next@16.3.8 > fast-glob@3.3.1 > micromatch@4.0.8 > braces@3.0.3` | Dev-only; dependent finding through the vulnerable descendant | `@next/eslint-plugin-next@14.2.35`, major downgrade; incompatible | None listed by official advisory |
| `fast-glob` | 3.3.1 | GHSA-VFJ7-8CJW-P6XM / CVE-2026-93687 | High | `root:devDependencies > @next/eslint-plugin-next@16.3.8 > fast-glob@3.3.1 > micromatch@4.0.8 > braces@3.0.3` | Dev-only; dependent finding through the vulnerable descendant | `@next/eslint-plugin-next@14.2.35`, major downgrade; incompatible | None listed by official advisory |
| `micromatch` | 4.0.8 | GHSA-VFJ7-8CJW-P6XM / CVE-2026-93687 | High | `root:devDependencies > @next/eslint-plugin-next@16.3.8 > fast-glob@3.3.1 > micromatch@4.0.8 > braces@3.0.3` | Dev-only; dependent finding through the vulnerable descendant | `@next/eslint-plugin-next@14.2.35`, major downgrade; incompatible | None listed by official advisory |
| `braces` | 3.0.3 | GHSA-VFJ7-8CJW-P6XM / CVE-2026-93687 | High | `root:devDependencies > @next/eslint-plugin-next@16.3.8 > fast-glob@3.3.1 > micromatch@4.0.8 > braces@3.0.3` | Dev-only; affected package | `@next/eslint-plugin-next@14.2.35`, major downgrade; incompatible | None listed by official advisory |

`npm ls braces brace-expansion @next/eslint-plugin-next` and `npm explain braces` establish the path. `braces@3.0.3` is the only direct advisory source; npm reports its affected dependents as four High package findings. `brace-expansion@5.0.12` appears under dev-only `eslint` but has no High/Critical advisory in the captured audit.

## Fix availability

The GitHub-reviewed advisory reports affected `braces` versions `<=3.0.3` and **no patched version** as of 2026-10-03: <https://github.com/advisories/GHSA-vfj7-8cjw-p6xm>. `npm audit` suggests `@next/eslint-plugin-next@14.2.35` with `isSemVerMajor: true`; that downgrade is incompatible with the repository's `next@16.3.8` / `@next/eslint-plugin-next@16.3.8` line and is not an accepted fix. No dependency downgrade, override, or lockfile change is authorized by this exception.

## Runtime classification and exposure

The complete dependency path is rooted only in `devDependencies`. The captured `npm audit --omit=dev --audit-level=high` exited 0 and reported `found 0 vulnerabilities`; the full JSON audit reports 4 High and 0 Critical. Runtime/production dependencies therefore do not install this chain under `npm ci --omit=dev` or production-only installation. Exposure is limited to local/CI development tooling that evaluates deeply nested brace patterns; the upstream advisory describes stack exhaustion/availability impact. This is not evidence that the runtime chain is safe if dependency classification changes.

Initial command output and exit codes are preserved in `.engineering/evidence/IRIS-STUDIO-SEC-0001/2026-10-03-initial/`. The final `audit:policy` run stores and prints the complete raw full-tree and production-tree audit outputs.

## Mitigation and enforcement

- `npm run audit:policy` executes and retains the full `npm audit --json`; it does not discard or rewrite npm output.
- Only the exact GHSA above and the four exact package/version/path findings in the JSON record can pass.
- Any Critical, any non-allowlisted High, any changed package/version/node/dependency path, any allowlisted advisory in the production tree, or any expired exception fails the gate.
- The gate also fails if npm reports a compatible fix (`fixAvailable: true` or a non-major fix object). The currently observed major plugin downgrade is recorded and rejected as incompatible.
- `npm audit --omit=dev --audit-level=high` independently remains a required baseline gate.
- Review by 2026-10-17 at the latest. Remove this exception immediately when an official compatible fix is available, when the dependency path changes, or when the chain no longer produces the finding; the policy gate blocks stale records.

## Residual risk

The advisory permits stack exhaustion when a deeply nested brace pattern reaches the affected parser; the captured dependency audit does not establish an untrusted-input route. The plausible impact is local/CI tooling availability. Keep CI inputs trusted, avoid adding untrusted brace-pattern ingestion, and retain the production-only audit gate. The Windows Codex sandbox uses the documented `unelevated` fallback: it runs with a restricted Windows token, applies ACL-based filesystem boundaries, and uses environment-level offline controls instead of the elevated mode's dedicated offline-user firewall rule. Its network isolation is weaker than `elevated`; IRIS sets `network_access=false`, but this does **not** establish strong network isolation. Reassess Windows sandbox mode independently; this exception does not waive that residual risk.
