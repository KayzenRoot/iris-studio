# Test and benchmark plan

## Foundation validation

The repository baseline is validated with:

- `npm ci` for deterministic clean dependency installation.
- `npm run check:baseline` for the committed Source Pack, exact GEF version, lockfile, and generated GEF state.
- `npm run gef:doctor` and `npm run gef:status` for the installed GEF diagnostics.
- `npm audit --audit-level=high` for dependency vulnerability findings.
- The GitHub Actions baseline workflow on the exact pull request head; GitHub also parses the workflow before running it.

The GEF CLI exposes `init`, `adopt`, `upgrade`, `doctor`, and `status`; it does not expose a separate `validate` command. The installation procedure is verified by the installed version, `gef init --apply`, doctor/status diagnostics, npm lockfile, clean-install workflow, and audit.

## Product validation

Application test layers, supported browsers/platforms, benchmarks, performance budgets, and acceptance data: `TBD` during MVP planning. No application test is claimed before product code exists.
