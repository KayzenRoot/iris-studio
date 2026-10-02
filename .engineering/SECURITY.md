# Security baseline

## Repository controls

- GitHub secret scanning and push protection are enabled.
- GitHub private vulnerability reporting is enabled.
- Dependency vulnerability alerts and Dependabot security updates are enabled.
- Workflow-level and repository-default `GITHUB_TOKEN` permissions are read-only.
- Workflow actions are pinned to full commit SHAs, and the repository allows only the actions used by the baseline workflow.
- `npm audit --audit-level=high` is part of baseline validation.
- Product-specific threat model, data classification, trust boundaries, and security requirements: `TBD` during MVP planning.

## GitHub security entitlement limits

The repository is public and owned by the personal GitHub user `KayzenRoot`. Provider-pattern secret scanning and push protection are enabled. The optional `secret_scanning_non_provider_patterns` and `secret_scanning_validity_checks` settings remain disabled; an API enablement request returned them as disabled. GitHub documents generic-pattern scanning for organization-owned repositories on GitHub Team with GitHub Secret Protection, and partner-pattern validity checks for organization-owned repositories on GitHub Team with GitHub Secret Protection. These settings are unavailable for this user-owned repository under its current account configuration. Reassess if ownership or entitlements change.

References: [GitHub generic-pattern eligibility](https://docs.github.com/en/code-security/how-tos/secure-your-secrets/detect-secret-leaks/enabling-secret-scanning-for-generic-patterns) and [GitHub validity-check eligibility](https://docs.github.com/en/code-security/how-tos/secure-your-secrets/customize-leak-detection/enable-validity-checks).

GEF `doctor` reports dependency provenance as `unverified` and GitHub security capability as `REVIEW` in this local environment; its toolchain and repository invariants pass. The 1.1.2 registry attestation metadata is present, and the downloaded npm tarball SHA-256 matches the immutable GEF release record. `npm audit signatures` was also attempted but exits with npm `E404` while resolving GEF's bundled, unpublished workspace dependency `@gef-bootstrap/kernel@0.0.0`; it is not used as a CI gate. These observations are retained as `REVIEW`, not converted to `PASS`.

## Reporting

Use GitHub private vulnerability reporting for sensitive vulnerability reports. Keep secrets and exploit-sensitive details out of public issues, pull requests, logs, and screenshots. See the root [Security Policy](../SECURITY.md).

## Limits

CodeQL is not configured while the repository contains no product source language for meaningful analysis. Reassess CodeQL when application source is admitted. No finding is inferred from the absence of a scan.
