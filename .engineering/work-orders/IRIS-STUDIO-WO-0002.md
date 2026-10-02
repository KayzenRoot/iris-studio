# IRIS-STUDIO-WO-0002 — MVP Planning & Module Compilation

Status: IN REVIEW
Risk: STANDARD
Planning base: 5dba31f78985bbb25d64c41d3dcd23f12040f3fa

## OBJECTIVE
Convert the approved product direction into a small complete MVP architecture, canonical product requirements/scope/DoD, eight implementation modules and executable Work Orders. No product code.

## CONTEXT
WO-0001 deliberately left product architecture TBD. Owner direction now requires a local dashboard that produces complete sites; Codex remains executor via existing ChatGPT/Codex plan; ComfyUI/Blender run locally; quality and fluid performance outrank feature breadth.

## SCOPE
Define product boundary, host-native architecture, persistence/integration boundaries, Art Director/media/builder/quality/orchestration responsibilities, eight modules and WO-0003..WO-0010; update affected Source Pack.

## OUT OF SCOPE
Application code/dependencies; tool integration code; generated website; GEF version/governance changes.

## FILES / SOURCES TO READ
CHECKPOINT, DECISIONS-LEDGER, SCOPE, DoD, ARCHITECTURE, REQUIREMENTS, AGENTS.md and owner-approved conversation.

## CONTEXT LOCK
Base main SHA: 5dba31f78985bbb25d64c41d3dcd23f12040f3fa
Pre-planning blobs: CHECKPOINT 27d245bcca0878c8addbe0837cac5d2beb3265a6; DECISIONS fae2cd3bd5faf2728f97532e247653050ff4188e; SCOPE ab93b642ddc816cdd0b6db67a01cc4f2d2a094e0; DoD c875967b0da283eb6798d527b7072e60a8f933b3; ARCHITECTURE 0909dd4fdb3aabbe03a29e5849b46e40023b7e02; REQUIREMENTS fe0c9591ba6087d4ef3c3f9d9c2ba23b5198bb73.

## REQUIREMENTS
Small application, complete-site output; extreme quality; dashboard is primary UX; no manual prompt shuttle; no API-key dependency for Codex MVP path; local ComfyUI/Blender; large auditable Work Orders.

## ARCHITECTURE RULES
Simplest architecture preserving local tool/GPU access; no second LLM without necessity; separate planning/media/engineering/validation; selective 3D with mandatory performance fallbacks.

## CONSTRAINTS
Documentation-only. No product dependency installation/feature code. Preserve WO-0001 limitations.

## ACCEPTANCE CRITERIA
Canonical docs no longer TBD where owner supplied direction; exactly eight NECESSARY modules; WO-0003..0010 include required sections; backlog/DoD/checkpoint align; no implementation.

## TESTS
Repository baseline/GEF docs checks; Markdown/link sanity; contradiction audit across canonical docs.

## DELIVERABLES
Updated Source Pack, MODULES.md, WO-0002..0010, planning PR/Evidence Bundle.

## REVIEW FORMAT
Audit against owner direction, source hierarchy, scope discipline and internal consistency. APPROVED / CORRECTION REQUIRED / BLOCKED.

## STOP CONDITION
Stop after planning PR is validated. M01 cannot start until WO-0002 is APPROVED and merged.
