# Decisions ledger

This ledger records only decisions and procedural exceptions admitted by an approved Work Order. Product architecture remains undecided.

## IRIS-STUDIO-WO-0001

### Empty-repository base exception

Before the foundation work, the verified `KayzenRoot/iris-studio` repository had no branch refs or base commit. Its GitHub default branch was set to `main`, the local checkout was empty, and the authenticated `KayzenRoot` account had admin permission. Under section 6 of the Work Order, one base commit was created on `main`: `818eb53d53371fd595a6b8303f1ddc0d0fdcd0a8`, containing only a minimal README and no product implementation. The substantive work proceeds on `feat/IRIS-STUDIO-WO-0001-bootstrap`.

The SHA-256 fingerprint of that initial README before the Source Pack replaced it was `6A963690AD1CB25BA1E34D33B49084A0310315A6BB6FBB5026F1501345967D22`.

### GEF Bootstrap package

Use the official `@gef-bootstrap/cli` package at exactly `1.1.2`, installed as a locked development dependency. The package identity, release tag, published npm metadata, tool version, and initialization procedure were verified from the GEF release and registry. The tagged installation guide has stale publication text; the newer release record and registry metadata confirm the 1.1.2 publication.

### Product decisions

No application framework, database, integration architecture, deployment topology, product feature, or detailed requirement is approved by this foundation increment. Those decisions remain `TBD`.
