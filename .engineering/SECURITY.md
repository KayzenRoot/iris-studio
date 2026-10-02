# Security baseline

## Repository controls

- GitHub secret scanning and push protection are enabled.
- GitHub private vulnerability reporting is enabled.
- Dependency vulnerability alerts and Dependabot security updates are enabled.
- Workflow-level and repository-default `GITHUB_TOKEN` permissions are read-only.
- Workflow actions are pinned to full commit SHAs, and the repository allows only the actions used by the baseline workflow.
- `npm audit --audit-level=high` is part of baseline validation.
- Product-specific threat model, data classification, trust boundaries, and security requirements: `TBD` during MVP planning.

GEF `doctor` reports dependency provenance as `unverified` and GitHub security capability as `REVIEW` in this local environment; its toolchain and repository invariants pass. The 1.1.2 registry attestation metadata is present, and the downloaded npm tarball SHA-256 matches the immutable GEF release record. `npm audit signatures` was also attempted but exits with npm `E404` while resolving GEF's bundled, unpublished workspace dependency `@gef-bootstrap/kernel@0.0.0`; it is not used as a CI gate. These observations are retained as `REVIEW`, not converted to `PASS`.

## Reporting

Use GitHub private vulnerability reporting for sensitive vulnerability reports. Keep secrets and exploit-sensitive details out of public issues, pull requests, logs, and screenshots. See the root [Security Policy](../SECURITY.md).

## Limits

CodeQL is not configured while the repository contains no product source language for meaningful analysis. Reassess CodeQL when application source is admitted. No finding is inferred from the absence of a scan.
