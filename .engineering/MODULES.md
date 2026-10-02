# MVP modules

Eight large modules, one stable Work Order each.

| Module | Work Order | Risk | Dependency |
|---|---|---|---|
| M01 Local Core & Dashboard | IRIS-STUDIO-WO-0003 | STANDARD | WO-0002 merged |
| M02 Codex Bridge | IRIS-STUDIO-WO-0004 | ELEVATED | M01 APPROVED and merged |
| M03 Senior Art Director & Visual DNA | IRIS-STUDIO-WO-0005 | STANDARD | M02 APPROVED and merged |
| M04 ComfyUI Visual Engine | IRIS-STUDIO-WO-0006 | ELEVATED | M03 APPROVED and merged |
| M05 Blender Creative MCP & 3D Engine | IRIS-STUDIO-WO-0007 | ELEVATED | M03 APPROVED; M04 recommended |
| M06 Complete Website Builder | IRIS-STUDIO-WO-0008 | STANDARD | M02-M05 APPROVED and merged |
| M07 Quality Gate & Auto-Correction | IRIS-STUDIO-WO-0009 | STANDARD | M06 APPROVED and merged |
| M08 End-to-End Orchestrator & MVP Packaging | IRIS-STUDIO-WO-0010 | ELEVATED | M01-M07 APPROVED and merged |

Completion chain: M01 -> M02 -> M03 -> M04/M05 -> M06 -> M07 -> M08.

M04/M05 are separate media engines; M06 requires both approved. Feature breadth stays small. Quality is concentrated in the Art Director contracts, curated media pipelines, constrained Blender tools, complete-site builder and strict quality gate.
