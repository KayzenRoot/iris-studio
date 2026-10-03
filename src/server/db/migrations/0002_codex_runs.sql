CREATE TABLE codex_runs (
  id TEXT PRIMARY KEY NOT NULL,
  generation_run_id TEXT NOT NULL UNIQUE REFERENCES generation_runs(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workspace_path TEXT NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1 CHECK (schema_version = 1),
  status TEXT NOT NULL CHECK (status IN ('RUNNING', 'CANCELLING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'TIMED_OUT', 'INTERRUPTED')),
  cli_version TEXT NOT NULL,
  exit_code INTEGER,
  retry_class TEXT NOT NULL DEFAULT 'NONE' CHECK (retry_class IN ('NONE', 'TRANSIENT', 'USER_ACTION', 'MANUAL_REVIEW')),
  error_code TEXT,
  stdout_log TEXT NOT NULL DEFAULT '',
  stderr_log TEXT NOT NULL DEFAULT '',
  result_json TEXT CHECK (result_json IS NULL OR json_valid(result_json)),
  result_path TEXT,
  created_at TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  updated_at TEXT NOT NULL
);

CREATE INDEX codex_runs_project_idx ON codex_runs(project_id, created_at DESC);
CREATE INDEX codex_runs_status_idx ON codex_runs(status);
