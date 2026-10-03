# IRIS Studio

IRIS Studio is a local-first application for orchestrating high-quality complete website creation with a dashboard, local ComfyUI, an IRIS-owned Blender MCP/3D engine and the user's locally authenticated Codex CLI.

## Current status
Repository foundation and MVP planning are complete. **M01 / IRIS-STUDIO-WO-0003 — Local Core & Dashboard is APPROVED and merged** in PR #13. **M02 / IRIS-STUDIO-WO-0004 — Codex Bridge** is the active implementation increment on PR #15.

## Local operation (M01)
Use Node.js 24.19.0 and npm 11.17.0 as pinned in the repository:

```powershell
npm ci
npm run dev
```

Open `http://127.0.0.1:3000`. The dashboard, project briefings, SQLite database, project workspaces, and Codex run records stay on this device. Codex can write only during a task submitted for that project's workspace. By default, Windows data is stored under `%LOCALAPPDATA%\IRIS Studio`; macOS/Linux use `$XDG_DATA_HOME/iris-studio` or `~/.local/share/iris-studio`. Set `IRIS_DATA_DIR` to an absolute path outside the source repository to choose another data directory. `PORT` may select a port from 1 through 65535; the server remains bound to loopback.

The System Health page reports local database/migration status, Codex CLI version and ChatGPT sign-in status, Blender presence, and a response from the default local ComfyUI endpoint. IRIS retains only the Codex login classification and version, not login output or credentials. Jobs use the existing ChatGPT-authenticated CLI session; IRIS does not require an OpenAI API key.

## Local validation

```powershell
npm run check:baseline
npm run ci:install:playwright
npm run lint
npm run typecheck
npm run build
npm test
npm run gef:doctor
npm run gef:status
```

Use the repository script for Playwright installation so the lockfile-backed Playwright package is used consistently with CI.

## Canonical sources
Start at [.engineering/README.md](.engineering/README.md). Modules: [.engineering/MODULES.md](.engineering/MODULES.md). Executable module Work Orders: [.engineering/work-orders/](.engineering/work-orders/).

## GEF
GEF Bootstrap @gef-bootstrap/cli is pinned at 1.1.2. Preserve its baseline and historical REVIEW evidence.
