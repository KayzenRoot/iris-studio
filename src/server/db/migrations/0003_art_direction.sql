CREATE TABLE art_direction_revisions (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  revision INTEGER NOT NULL CHECK (revision >= 1),
  parent_revision_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('GENERATING', 'DRAFT', 'APPROVED', 'FAILED')),
  prompt_version TEXT NOT NULL,
  schema_version INTEGER NOT NULL CHECK (schema_version = 1),
  quality_mode TEXT NOT NULL CHECK (quality_mode IN ('STANDARD', 'PREMIUM', 'ABSURD')),
  attempts_used INTEGER NOT NULL DEFAULT 1 CHECK (attempts_used IN (1, 2)),
  codex_run_id TEXT REFERENCES codex_runs(id) ON DELETE RESTRICT,
  brief_file_name TEXT,
  contract_file_name TEXT,
  output_file_name TEXT,
  snapshot_json TEXT CHECK (snapshot_json IS NULL OR json_valid(snapshot_json)),
  error_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  finished_at TEXT,
  approved_at TEXT,
  UNIQUE (project_id, revision),
  UNIQUE (project_id, id),
  FOREIGN KEY (project_id, parent_revision_id)
    REFERENCES art_direction_revisions(project_id, id) ON DELETE RESTRICT,
  CHECK (
    (status IN ('GENERATING', 'FAILED') AND snapshot_json IS NULL AND approved_at IS NULL)
    OR (status = 'DRAFT' AND snapshot_json IS NOT NULL AND approved_at IS NULL)
    OR (status = 'APPROVED' AND snapshot_json IS NOT NULL AND approved_at IS NOT NULL)
  )
);

CREATE INDEX art_direction_revisions_project_idx
  ON art_direction_revisions(project_id, revision DESC);

CREATE INDEX art_direction_revisions_status_idx
  ON art_direction_revisions(status);

CREATE TABLE art_direction_approvals (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL,
  revision_id TEXT NOT NULL UNIQUE,
  snapshot_json TEXT NOT NULL CHECK (json_valid(snapshot_json)),
  approved_at TEXT NOT NULL,
  FOREIGN KEY (project_id, revision_id)
    REFERENCES art_direction_revisions(project_id, id) ON DELETE RESTRICT
);

CREATE INDEX art_direction_approvals_project_idx
  ON art_direction_approvals(project_id, approved_at DESC);

CREATE TRIGGER art_direction_approval_matches_approved_revision
BEFORE INSERT ON art_direction_approvals
WHEN NOT EXISTS (
  SELECT 1 FROM art_direction_revisions
  WHERE project_id = NEW.project_id
    AND id = NEW.revision_id
    AND status = 'APPROVED'
    AND snapshot_json = NEW.snapshot_json
    AND approved_at = NEW.approved_at
)
BEGIN
  SELECT RAISE(ABORT, 'approval must reference the exact approved revision snapshot');
END;

CREATE TRIGGER art_direction_approved_revision_immutable
BEFORE UPDATE ON art_direction_revisions
WHEN OLD.status = 'APPROVED'
BEGIN
  SELECT RAISE(ABORT, 'approved art direction revisions are immutable');
END;

CREATE TRIGGER art_direction_approved_revision_no_delete
BEFORE DELETE ON art_direction_revisions
WHEN OLD.status = 'APPROVED'
BEGIN
  SELECT RAISE(ABORT, 'approved art direction revisions cannot be deleted');
END;

CREATE TRIGGER art_direction_revision_snapshot_immutable
BEFORE UPDATE ON art_direction_revisions
WHEN OLD.snapshot_json IS NOT NULL AND NEW.snapshot_json IS NOT OLD.snapshot_json
BEGIN
  SELECT RAISE(ABORT, 'art direction revision snapshots are immutable');
END;

CREATE TRIGGER art_direction_revision_identity_immutable
BEFORE UPDATE ON art_direction_revisions
WHEN OLD.project_id IS NOT NEW.project_id
  OR OLD.revision IS NOT NEW.revision
  OR OLD.parent_revision_id IS NOT NEW.parent_revision_id
  OR OLD.prompt_version IS NOT NEW.prompt_version
  OR OLD.schema_version IS NOT NEW.schema_version
  OR OLD.quality_mode IS NOT NEW.quality_mode
BEGIN
  SELECT RAISE(ABORT, 'art direction revision identity is immutable');
END;

CREATE TRIGGER art_direction_revision_state_transition
BEFORE UPDATE ON art_direction_revisions
WHEN (OLD.status = 'GENERATING' AND NEW.status NOT IN ('GENERATING', 'DRAFT', 'FAILED'))
  OR (OLD.status = 'DRAFT' AND NEW.status NOT IN ('DRAFT', 'APPROVED'))
  OR (OLD.status = 'FAILED' AND NEW.status <> 'FAILED')
  OR NEW.attempts_used < OLD.attempts_used
BEGIN
  SELECT RAISE(ABORT, 'invalid art direction revision state transition');
END;

CREATE TRIGGER art_direction_approval_no_update
BEFORE UPDATE ON art_direction_approvals
BEGIN
  SELECT RAISE(ABORT, 'art direction approvals are append-only');
END;

CREATE TRIGGER art_direction_approval_no_delete
BEFORE DELETE ON art_direction_approvals
BEGIN
  SELECT RAISE(ABORT, 'art direction approvals are append-only');
END;
