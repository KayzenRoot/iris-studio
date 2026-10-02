# Architecture

## Runtime
Host-native local-first. Docker is FUTURE because direct local Codex/ComfyUI/Blender/GPU access is central.

## App stack
Next.js App Router + TypeScript; lightweight styling; runtime schemas; SQLite with migrations; Playwright. Exact versions pinned by M01.

## Generated sites
Independent Next.js + TypeScript workspaces. Three.js/React Three Fiber/GSAP optional per Site Blueprint.

## Topology
Dashboard/Application -> persisted Orchestrator/Job State -> CodexAdapter -> local authenticated Codex CLI
-> ComfyUIAdapter -> localhost ComfyUI
-> BlenderAdapter/MCP Client -> IRIS Blender MCP -> Blender Python/local process
-> Generated Site Workspace -> QualityRunner -> dashboard approval.

## Data
Project, ProjectBrief, VisualDNA revision, SiteBlueprint revision, GenerationRun, StageRun/Job, Artifact, GeneratedSite, QualityReport, Approval. Binaries/workspaces on disk; SQLite stores metadata/hashes/status/paths.

## Boundaries
IRIS repo stores code/prompts/schemas/workflow definitions/MCP source. User project workspaces live outside repo. External outputs enter only through normalized project paths.

## Agent model
No swarm. Codex powers two constrained roles: Senior Art Director and Website Engineer/Corrector. Additional local LLM routing is FUTURE.

## Blender
Own constrained website-focused MCP. High-level tools by default; no unrestricted raw Python tool.

## Orchestration
M08 owns the persisted state machine. Earlier modules expose adapters/services only.
