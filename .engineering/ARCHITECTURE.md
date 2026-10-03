# Architecture

## Runtime
Host-native local-first. Docker is FUTURE because direct local Codex/ComfyUI/Blender/GPU access is central.

## App stack
Next.js App Router + TypeScript; lightweight styling; runtime schemas; SQLite with migrations; Playwright. Exact versions pinned by M01.

### M01 local core
The dashboard runs as a loopback-only Next.js application. SQLite is accessed through `better-sqlite3`, a versioned SQL migration, and a small server-side store. Zod validates project briefs at the API and persistence boundary. Project rows and briefs are stored in SQLite; empty project workspace directories are created separately under the user data directory. The default Windows root is `%LOCALAPPDATA%\IRIS Studio`; macOS/Linux use `$XDG_DATA_HOME/iris-studio` or `~/.local/share/iris-studio`. An explicit `IRIS_DATA_DIR` must be absolute and outside the source repository. The app does not expose workspace filesystem paths through its project API.

The M01 System Health probes are observational: Codex CLI and Blender are checked for presence on `PATH`; ComfyUI is queried only at `127.0.0.1:8188/system_stats`. A positive result does not assert authentication, model availability, MCP readiness, or execution capability.

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
