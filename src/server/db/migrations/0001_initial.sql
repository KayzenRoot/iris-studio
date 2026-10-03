CREATE TABLE projects (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 2 AND 80),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'ARCHIVED')),
  workspace_path TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE project_specs (
  project_id TEXT PRIMARY KEY NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  content_json TEXT NOT NULL CHECK (json_valid(content_json)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE generation_runs (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE jobs (
  id TEXT PRIMARY KEY NOT NULL,
  generation_run_id TEXT NOT NULL REFERENCES generation_runs(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED')),
  progress REAL NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 1),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE artifacts (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  generation_run_id TEXT REFERENCES generation_runs(id) ON DELETE SET NULL,
  kind TEXT NOT NULL,
  relative_path TEXT NOT NULL,
  content_type TEXT,
  byte_length INTEGER CHECK (byte_length IS NULL OR byte_length >= 0),
  sha256 TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX projects_updated_at_idx ON projects(updated_at DESC);
CREATE INDEX generation_runs_project_idx ON generation_runs(project_id, created_at DESC);
CREATE INDEX jobs_run_idx ON jobs(generation_run_id, created_at);
CREATE INDEX artifacts_project_idx ON artifacts(project_id, created_at DESC);
