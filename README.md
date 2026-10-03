# IRIS Studio

IRIS Studio is a local-first application for orchestrating high-quality complete website creation with a dashboard, local ComfyUI, an IRIS-owned Blender MCP/3D engine and the user's locally authenticated Codex CLI.

## Current status
The repository foundation and MVP planning are complete. The M01 / IRIS-STUDIO-WO-0003 implementation is under review in [PR #13](https://github.com/KayzenRoot/iris-studio/pull/13). M02 and all generation or automation integrations remain out of scope.

## Local operation (M01)
Use Node.js 24.19.0 and npm 11.17.0 as pinned in the repository:

```powershell
npm ci
npm run dev
```

Open `http://127.0.0.1:3000`. The dashboard, project briefings, SQLite database, and empty project workspaces stay on this device. By default, Windows data is stored under `%LOCALAPPDATA%\IRIS Studio`; macOS/Linux use `$XDG_DATA_HOME/iris-studio` or `~/.local/share/iris-studio`. Set `IRIS_DATA_DIR` to an absolute path outside the source repository to choose another data directory. `PORT` may select a port from 1 through 65535; the server remains bound to loopback.

The System Health page reports only local checks: database/migration access, Codex CLI and Blender presence on `PATH`, and a response from the default local ComfyUI health endpoint. It does not inspect credentials or run external tools, jobs, workflows, Blender automation, or website generation.

## Local validation

```powershell
npm run check:baseline
npx playwright install chromium
npm run lint
npm run typecheck
npm run build
npm test
npm run gef:doctor
npm run gef:status
```

## Canonical sources
Start at [.engineering/README.md](.engineering/README.md). Modules: [.engineering/MODULES.md](.engineering/MODULES.md). Executable module Work Orders: [.engineering/work-orders/](.engineering/work-orders/).

## GEF
GEF Bootstrap @gef-bootstrap/cli is pinned at 1.1.2. Preserve its baseline and historical REVIEW evidence.
