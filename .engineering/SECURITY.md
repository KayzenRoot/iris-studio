# Security

WO-0001 repository controls remain mandatory.

## Trust boundaries
Dashboard input; filesystem/workspace; Codex child process; ComfyUI localhost; Blender MCP/process; generated-site dependency/build scripts; browser preview.

## Controls
- No OpenAI API key required/read/stored for MVP Codex path.
- Never inspect/copy Codex auth tokens.
- Spawn subprocesses with argument arrays, not user-built shell strings.
- Allowlist executables and normalize/confine paths.
- External outputs write only to approved project workspace by default.
- ComfyUI/Blender MCP localhost-only by default.
- No unrestricted arbitrary-Python Blender MCP tool in default mode.
- Treat generated code/package scripts as untrusted until checks pass.
- Redact/cap process logs.
- Large/generated binaries stay out of IRIS Git.

## Risk
M01/M03/M06/M07 STANDARD. M02/M04/M05/M08 ELEVATED and require path-confinement, failure/recovery and exposure review.

Existing GEF REVIEW states remain REVIEW.
