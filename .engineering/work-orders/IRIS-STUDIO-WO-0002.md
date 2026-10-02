# IRIS-STUDIO-WO-0002 — MVP Planning & Module Compilation

Status: APPROVED
Risk: STANDARD
Planning base: `5dba31f78985bbb25d64c41d3dcd23f12040f3fa`

## OBJECTIVE
Convert the approved product direction into a small complete MVP architecture, canonical product requirements/scope/DoD, eight implementation modules and executable Work Orders. No product code.

## CONTEXT
WO-0001 deliberately left product architecture TBD. Owner direction requires a local dashboard that produces complete sites; Codex remains executor via the existing ChatGPT/Codex plan; ComfyUI/Blender run locally; quality and fluid performance outrank feature breadth.

## SCOPE
Define product boundary, host-native architecture, persistence/integration boundaries, Art Director/media/builder/quality/orchestration responsibilities, eight modules and WO-0003..WO-0010; update affected Source Pack.

## OUT OF SCOPE
Application code/dependencies; tool integration code; generated website; GEF version/governance changes.

## FILES / SOURCES TO READ
CHECKPOINT, DECISIONS-LEDGER, SCOPE, DoD, ARCHITECTURE, REQUIREMENTS, AGENTS.md and owner-approved product direction.

## CONTEXT LOCK
Base main SHA: `5dba31f78985bbb25d64c41d3dcd23f12040f3fa`.
Pre-planning blob fingerprints:
- CHECKPOINT: `27d245bcca0878c8addbe0837cac5d2beb3265a6`
- DECISIONS: `fae2cd3bd5faf2728f97532e247653050ff4188e`
- SCOPE: `ab93b642ddc816cdd0b6db67a01cc4f2d2a094e0`
- DoD: `c875967b0da283eb6798d527b7072e60a8f933b3`
- ARCHITECTURE: `0909dd4fdb3aabbe03a29e5849b46e40023b7e02`
- REQUIREMENTS: `fe0c9591ba6087d4ef3c3f9d9c2ba23b5198bb73`

## REQUIREMENTS
Small application, complete-site output; extreme quality; dashboard primary UX; no manual prompt shuttle; no API-key dependency for Codex MVP path; local ComfyUI/Blender; large auditable Work Orders.

## ARCHITECTURE RULES
Simplest architecture preserving local tool/GPU access; no second LLM without necessity; separate planning/media/engineering/validation; selective 3D with mandatory performance fallbacks.

## CONSTRAINTS
Documentation-only. No product dependency installation/feature code. Preserve WO-0001 limitations.

## ACCEPTANCE CRITERIA
- Canonical docs no longer TBD where owner supplied direction.
- Exactly eight NECESSARY modules.
- WO-0003..0010 include required Work Order sections.
- Backlog/DoD/checkpoint align.
- No implementation code.

## TESTS
- Repository baseline/GEF checks.
- Markdown/source consistency audit.
- Canonical contradiction review.

## DELIVERABLES
Updated Source Pack, MODULES.md, WO-0002..0010, GitHub module issues, Evidence Bundle.

## REVIEW FORMAT
Audit verdict: APPROVED.

## STOP CONDITION
Satisfied. Planning is approved. M01 / WO-0003 is the next legal implementation increment after merge to main.
