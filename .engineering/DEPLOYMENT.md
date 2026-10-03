# Deployment and local operation

IRIS MVP is host-native and opened locally in a browser. Docker is FUTURE, not a prerequisite. M08 provides install/start docs, prerequisite diagnostics, config example, data/workspace location and non-destructive recovery/reset instructions.

### M01 local dashboard
On Node.js 24.19.0 and npm 11.17.0, run `npm ci` and `npm run dev`, then open `http://127.0.0.1:3000`. `npm run start` serves the production build on loopback. `IRIS_DATA_DIR` selects an absolute local data root outside the source repository; otherwise Windows uses `%LOCALAPPDATA%\IRIS Studio` and macOS/Linux use `$XDG_DATA_HOME/iris-studio` or `~/.local/share/iris-studio`. `PORT` accepts 1–65535. Do not move, delete, or reset the data root as part of an ordinary update. Broader recovery/reset procedures remain assigned to M08.

M01 detects local Codex CLI/Blender executables and the default local ComfyUI health endpoint only. These checks do not launch or authenticate external tools.

Generated websites are independent source workspaces with documented build/run commands. Automatic hosting is out of scope and no single deployment vendor is hard-coded.
