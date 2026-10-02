# IRIS-STUDIO-WO-0005 — M03 Senior Art Director & Visual DNA

Status: PLANNED
Risk: STANDARD
Depends on: M02 APPROVED and merged

## OBJECTIVE
Turn a website brief into a high-quality structured Visual DNA and complete Site Blueprint through a senior-grade Art Director workflow executed via Codex.

## CONTEXT
IRIS Studio is a local-first website creation orchestrator. The MVP must produce complete websites, not just visual assets. Codex is the reasoning/engineering executor through the locally authenticated Codex CLI; ComfyUI and Blender perform local visual work. Do not start until dependencies are APPROVED and merged.

## SCOPE
- Brief UI for goal/audience/pages/references/tone/colors/2D-3D/motion/quality.
- Quality modes STANDARD, PREMIUM and ABSURD.
- Versioned Art Director prompt and output schemas.
- Visual DNA: concept, palette, typography direction, materials, geometry, lighting, motion, density, interactions, anti-generic constraints.
- Site Blueprint: sitemap, page goals, sections, content intent, asset plan, implementation strategy.
- Per-section media strategy: HTML/CSS, image, short loop, shader or realtime 3D.
- Review/approve/revise gate before expensive generation.

## OUT OF SCOPE
- Generating final images/3D.
- Building website.
- Fine-tuning or adding another local LLM.

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
- This Work Order
- Relevant predecessor Evidence Bundles and merged code

## CONTEXT LOCK
At execution start, record current main SHA and Git blob SHAs for CHECKPOINT, SCOPE, ARCHITECTURE, REQUIREMENTS, DEFINITION-OF-DONE and this Work Order. If a critical source changes, mark STALE and recompile before implementation.

## REQUIREMENTS
- Optimize for originality, coherence, readability and performance, not effect count.
- ABSURD still defines mobile/reduced-motion fallbacks.
- Every plan contains explicit negative constraints against generic AI-site patterns.
- Machine-validate output before approval.

## ARCHITECTURE RULES
- Pure planning stage: ProjectBrief -> versioned VisualDNA + SiteBlueprint.
- Prompts are version-controlled product code.
- Codex output accepted only through schema validation; invalid output gets one diagnostic retry.
- Approved DNA is immutable input unless a new revision is created.

## CONSTRAINTS
- Implement only this Work Order.
- Inspect repository before edits.
- Preserve GEF Bootstrap 1.1.2 and governance.
- No force-push/history rewrite/destructive user-data operation.
- Treat subprocesses and filesystem paths as untrusted boundaries.
- Never claim unavailable dependency testing as PASS.
- Final review/Evidence Bundle in Brazilian Portuguese.

## ACCEPTANCE CRITERIA
- Brief produces valid DNA/Blueprint.
- Every requested page/section covered.
- Media strategy includes performance fallbacks.
- User approves/revises before site code generation.
- Approved DNA persists exactly across reopen.

## TESTS
- Schema/unit tests.
- Golden prompt cases for simple/premium/experimental briefs.
- Regression on negative constraints.
- UI brief->generate->approve flow.
- lint/typecheck/build.

## DELIVERABLES
- Art Director prompt pack.
- DNA/Blueprint schemas.
- Dashboard briefing/review flow.
- Golden fixtures/Evidence Bundle.
- Scoped PR.

## REVIEW FORMAT
Evidence Bundle: base/head SHA; files; decisions; tests/results; lint/typecheck/build; security/architecture; regressions; fixed errors; risks/UNKNOWNs; screenshots/artifacts when relevant; proposed Checkpoint Delta. Audit verdict: APPROVED / CORRECTION REQUIRED / BLOCKED.

## STOP CONDITION
Stop when approved versioned Visual DNA + complete Site Blueprint can be produced without final media or site code.
