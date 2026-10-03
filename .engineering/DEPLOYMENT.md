# Deployment and local operation

IRIS MVP is host-native and opened locally in a browser. Docker is FUTURE, not a prerequisite. M08 provides install/start docs, prerequisite diagnostics, config example, data/workspace location and non-destructive recovery/reset instructions.

### M01 local dashboard
On Node.js 24.19.0 and npm 11.17.0, run `npm ci` and `npm run dev`, then open `http://127.0.0.1:3000`. `npm run start` serves the production build on loopback. `IRIS_DATA_DIR` selects an absolute local data root outside the source repository; otherwise Windows uses `%LOCALAPPDATA%\IRIS Studio` and macOS/Linux use `$XDG_DATA_HOME/iris-studio` or `~/.local/share/iris-studio`. `PORT` accepts 1–65535. Do not move, delete, or reset the data root as part of an ordinary update. Broader recovery/reset procedures remain assigned to M08.

The M01 baseline detected local Codex CLI/Blender executables and the default local ComfyUI health endpoint only. M02 adds the supported Codex login-status probe and local bounded job execution described below.

### M02 local Codex Bridge
M02 requires the native Codex CLI on `PATH` and a ChatGPT sign-in already managed by Codex. Check it with `codex --version` and `codex login status`; IRIS reports only the detected state/version and does not ask for or read an API key. Jobs use `workspace-write` with empty additional writable roots, no temp-root exceptions or network access, and ignore the Codex user configuration for task execution while the CLI still uses its local authentication. Jobs are ephemeral and have a five-minute timeout. Project run history/result documents stay in the configured IRIS user-data directory; task prompts are not retained in IRIS logs or run records.

Generated websites are independent source workspaces with documented build/run commands. Automatic hosting is out of scope and no single deployment vendor is hard-coded.
