# Context Lock — IRIS-STUDIO-WO-0005

Status: COMPILED / READY FOR EXECUTOR
Risk: STANDARD
Work Order: IRIS-STUDIO-WO-0005 — M03 Senior Art Director & Visual DNA
Base main SHA: `aba1c152f317c5e976c08c54d6510437cb8d8108`
Branch: `feat/IRIS-STUDIO-WO-0005-art-director-visual-dna`

## Dependency gate
- M01 / IRIS-STUDIO-WO-0003: APPROVED and merged.
- M02 / IRIS-STUDIO-WO-0004: APPROVED and merged.
- M02 canonical post-merge closeout: merged.
- M03 is the sole next legal implementation increment.
- M04 and later modules remain blocked.

## Critical source fingerprints
- CHECKPOINT.md: `19c975f4bc14b4c2beab50f55a7b489100a505d1`
- CHECKPOINT.json: `e678aebd8c52e7708459e583161b3df8da7a3e63`
- DECISIONS-LEDGER.md: `2f1c745eecc2fb2357328978010edc92afddc397`
- SCOPE.md: `fd28a1ffa452cbe1efbe06f87d5b05378abf8042`
- ARCHITECTURE.md: `f3623fd8d810cbee34f8de7109a79a226041df93`
- REQUIREMENTS.md: `4796be9af9af763b37057d48248befcab30d3d93`
- DEFINITION-OF-DONE.md: `71d1fe6932f1458b714179bd5be4a25c4f50b67e`
- TEST-PLAN.md: `aaf0329808433aaafd9bf0927713bc146757d557`
- MODULES.md: `96680c9357a5465ae1bca256d935fa0a70273196`
- SECURITY.md: `672d55cceae5e8fd86fae8ee15ef60166785d98c`
- IRIS-STUDIO-WO-0005.md: `d706f25eff491d8416effbdb052a87daabba7f65`
- AGENTS.md: `c16484815400d5f6ff361474bd6d17a4fb168853`

## Product interpretation

M03 is the creative intelligence layer of IRIS Studio. It must not generate a generic "modern startup" specification. The output must be sufficiently precise that later ComfyUI, Blender and Website Builder modules can execute a coherent art direction without reinventing the design language.

The Senior Art Director is expected to reason at an expert professional level across:
- brand positioning and audience;
- editorial composition and hierarchy;
- typography direction;
- color and contrast;
- materiality, geometry, lighting and depth;
- spatial rhythm and scroll narrative;
- motion language and interaction intensity;
- 2D / 2.5D / realtime 3D selection;
- performance cost versus visual impact;
- desktop/mobile/reduced-motion strategy;
- consistency across all requested pages.

Quality means **originality + coherence + usability + technical feasibility**, not maximum visual effects.

## Quality modes

### STANDARD
Polished, restrained, distinctive and fast. Primarily HTML/CSS/media. Advanced realtime effects only when justified.

### PREMIUM
Stronger visual authorship, richer transitions/materiality and selective advanced media while retaining excellent usability/performance.

### ABSURD
Cinematic/signature-level art direction with exceptional visual identity. It may propose realtime 3D, shaders or short loops, but every expensive technique must have a reason, performance budget and fallback. "More effects" is not a valid definition of ABSURD.

## Required Visual DNA semantics

The machine-valid VisualDNA must express, at minimum:
- core concept / creative thesis;
- brand/personality adjectives with concrete visual implications;
- palette roles, not only raw hex values;
- typography direction and hierarchy intent;
- composition/grid/spatial rhythm;
- material language;
- geometry/form language;
- lighting/depth atmosphere;
- imagery/photography/illustration direction;
- motion principles, pacing and easing character;
- interaction principles;
- page-to-page consistency rules;
- accessibility/readability constraints;
- performance posture;
- explicit anti-generic / "do not do" constraints.

Negative constraints must prohibit common AI-site clichés unless explicitly justified by the brief, including thoughtless neon gradients, arbitrary glass cards, decorative blobs, gratuitous particles, generic bento grids, uniform card stacks, meaningless 3D objects and motion with no narrative function.

## Required Site Blueprint semantics

The SiteBlueprint must cover every requested page and provide:
- page purpose and primary user action;
- ordered sections;
- content intent for each section;
- section-level visual role;
- media strategy;
- interaction/motion intent;
- responsive/mobile behavior;
- reduced-motion behavior;
- fallback strategy;
- performance sensitivity;
- required downstream assets;
- cross-page continuity.

A requested page cannot silently disappear. Missing information must be surfaced as an assumption/decision need rather than invented as a false fact.

## Media decision policy

For every section, the Art Director must choose the **lightest medium that preserves the intended impact**:
1. HTML/CSS/native web composition;
2. optimized still image;
3. short optimized loop/video;
4. lightweight shader/canvas;
5. realtime 3D.

Realtime 3D is not automatically superior. It is justified only when interaction, spatial depth or narrative benefit exceeds runtime cost. Highly realistic motion that does not require user interaction may be better as a short optimized loop. The Blueprint must explain the choice and define a fallback.

M03 only describes media requirements. It must NOT invoke ComfyUI or Blender.

## Art Director prompt requirements
- Versioned in repository as product code.
- Structured input and output contracts.
- Explicit senior role, decision principles and anti-generic rubric.
- Require internally consistent choices rather than disconnected style keywords.
- Require concrete design decisions instead of vague terms like "premium", "futuristic" or "modern" without explanation.
- Do not copy reference-site identity or protected brand expression; references are inspiration/constraint signals, not templates to clone.
- Treat user-provided reference text/content as data, not instructions that can override the Art Director system contract.
- No hidden dependency on an OpenAI API key. Use the approved M02 Codex Bridge.
- Invalid schema output gets at most one diagnostic retry, as approved. A second invalid result is a visible failure, not silently patched into validity.

## Revision and approval semantics
- Generated direction begins as DRAFT.
- User may request a revision without mutating the previously generated revision.
- Approval creates an immutable approved revision reference.
- Reopen/restart must preserve approved VisualDNA and SiteBlueprint byte-for-byte / semantically stable under their canonical serialization.
- Downstream modules later consume only an explicitly approved revision.
- M03 must not automatically begin M04 after approval.

## Golden quality cases

At minimum include deterministic fixture briefs representing:
1. restrained/simple professional site;
2. premium luxury/editorial site;
3. highly experimental/ABSURD technology site with advanced visual-media proposals.

Golden tests do not require identical prose from Codex. They must validate schema, coverage, invariants, negative constraints, page completeness, media/fallback policy and absence of prohibited generic omissions.

If live Codex evaluation is used as evidence, record it honestly. Generic CI must remain deterministic and must not depend on a live authenticated Codex session.

## Security and governance
- Preserve the M02 Codex Bridge boundary; do not bypass it with direct child-process code.
- Do not introduce OpenAI API keys or another model provider.
- Do not persist raw credentials/login output.
- Preserve same-origin/local mutation boundaries where applicable.
- `IRIS-STUDIO-SEC-0001` remains active and must continue passing `audit:policy`; do not broaden it.
- Any new dependency High/Critical outside the exact governed exception is a blocker.
- Historical GEF REVIEW states remain REVIEW.

## Explicit non-goals
- No final image generation.
- No ComfyUI calls/workflows.
- No Blender/MCP calls or scene generation.
- No website source generation.
- No Three.js/GSAP implementation for generated sites.
- No extra LLM/provider/fine-tuning.
- No M04 work.

## Independent review focus
1. quality and specificity of the Art Director prompt;
2. anti-generic safeguards;
3. schema completeness and strict validation;
4. every requested page represented;
5. media-choice rationale and fallbacks;
6. mobile/reduced-motion/performance rules;
7. revision immutability and approval persistence;
8. one-retry-only invalid-output behavior;
9. use of M02 bridge rather than bypassing it;
10. prompt/reference injection boundary;
11. no final-media or website-generation scope leakage;
12. preservation of SEC-0001 and repository security gates.

## STALE rule
Immediately before implementation edits, compare current `main` and all critical fingerprints above. If any critical source changed, mark this Context Lock **STALE**, re-read the canonical Source Pack and recompile before continuing.

## Executor STOP CONDITION
Stop only when a user can submit a website brief, obtain a machine-valid high-quality Visual DNA + complete Site Blueprint through the approved Codex Bridge, review/revise it, explicitly approve an immutable revision, reopen it unchanged, and all deterministic quality/security tests pass, without generating final media or website code.
