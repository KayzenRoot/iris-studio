# Architecture

## Runtime
Host-native local-first. Docker is FUTURE because direct local Codex/ComfyUI/Blender/GPU access is central.

## App stack
Next.js App Router + TypeScript; lightweight styling; runtime schemas; SQLite with migrations; Playwright. Exact versions pinned by M01.

### M01 local core
The dashboard runs as a loopback-only Next.js application. SQLite is accessed through `better-sqlite3`, a versioned SQL migration, and a small server-side store. Zod validates project briefs at the API and persistence boundary. Project rows and briefs are stored in SQLite; empty project workspace directories are created separately under the user data directory. The default Windows root is `%LOCALAPPDATA%\IRIS Studio`; macOS/Linux use `$XDG_DATA_HOME/iris-studio` or `~/.local/share/iris-studio`. An explicit `IRIS_DATA_DIR` must be absolute and outside the source repository. The app does not expose workspace filesystem paths through its project API.

The M01 baseline checked Codex CLI and Blender presence on `PATH`; M02 extends the Codex probe to classify the supported ChatGPT login state. ComfyUI remains queried only at `127.0.0.1:8188/system_stats`. A positive result does not assert model availability, MCP readiness, or execution capability.

### M02 Codex Bridge
M02 keeps CLI discovery, ChatGPT-session detection and process execution behind `CodexAdapter`. It resolves only a native `codex` executable, invokes `codex login status` while retaining only transient classification markers, and never reads the CLI credential store. Jobs use the existing ChatGPT-authenticated CLI session, `--ignore-user-config`, `codex exec --json --ephemeral --sandbox workspace-write`, explicit empty additional writable roots, disabled network/temp roots, a fixed argument array and the prompt on stdin. The executable runs with the canonical selected project workspace as its working root; IRIS accepts no caller-supplied executable, shell command, argument list or filesystem path.

Codex run identity, project/workspace identity, lifecycle state, CLI version, exit code, retry classification, bounded sanitized logs and a versioned result document are persisted locally. Result documents live under the per-user IRIS data directory. Only one Codex run may be active at a time. The service rejects non-canonical workspaces and any symlink/reparse point in a project tree before launch, enforces a fixed timeout, and terminates the full child-process tree on cancel/timeout/shutdown. Incomplete runs are closed as INTERRUPTED on the next store open; they are never resumed implicitly.

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
