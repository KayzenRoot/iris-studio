# Decisions ledger

This ledger records only decisions and procedural exceptions admitted by an approved Work Order. Product architecture remains undecided.

## IRIS-STUDIO-WO-0001

### Empty-repository base exception

Before the foundation work, the verified `KayzenRoot/iris-studio` repository had no branch refs or base commit. Its GitHub default branch was set to `main`, the local checkout was empty, and the authenticated `KayzenRoot` account had admin permission. Under section 6 of the Work Order, one base commit was created on `main`: `818eb53d53371fd595a6b8303f1ddc0d0fdcd0a8`, containing only a minimal README and no product implementation. The substantive work proceeds on `feat/IRIS-STUDIO-WO-0001-bootstrap`.

The SHA-256 fingerprint of that initial README before the Source Pack replaced it was `6A963690AD1CB25BA1E34D33B49084A0310315A6BB6FBB5026F1501345967D22`.

### GEF Bootstrap package

Use the official `@gef-bootstrap/cli` package at exactly `1.1.2`, installed as a locked development dependency. The package identity, release tag `v1.1.2` at source commit `af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82`, published npm metadata, tool version, and initialization procedure were verified from the GEF release and registry. The npm tarball SHA-256 is `331a5d035188ef1dc1c92e5c4e5317edcdbf45956dc07703231bbc64dbb7ab97`; npm registry integrity is `sha512-zLu0oaBWqwIPviZgN0PTk1/5QlsHK8r7aCNOkMop0MnlzqFZ1um3zfkRO2l8hx005nd/2xZ/Ll/lDzYUbH01uw==`. The tagged installation guide has stale publication text; the newer release record and registry metadata confirm the 1.1.2 publication.

### GEF managed baseline

After the Source Pack was committed, `gef status` observed a clean Git tree and valid checkpoint but reported `UNEXPECTED` drift and `stale: true` against the earlier init fingerprint. The read-only `gef adopt` preflight then reported a clean tree, ready canonical checkpoint, and no conflict. Its official `--apply` transaction created `.gef/adopt-state.json` and a receipt without changing project files. GEF 1.1.2 status prefers an existing init state over an adopt state when selecting its drift reference, so the status remains stale against the original init observation; report this as `REVIEW` and do not reinterpret it as a clean-drift result.

### Product decisions

No application framework, database, integration architecture, deployment topology, product feature, or detailed requirement is approved by this foundation increment. Those decisions remain `TBD`.
