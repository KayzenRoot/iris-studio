import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmdirSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { z } from "zod";

import { assertOutsideSourceRepository, resolveProjectWorkspacePath, samePath } from "../workspaces/paths";

export const projectBriefSchema = z.object({
  siteType: z.enum(["marketing", "portfolio", "institutional", "product-presentation"]),
  description: z.string().trim().min(10).max(2000),
  pages: z.array(z.string().trim().min(1).max(80)).min(1).max(8),
  references: z.array(z.string().trim().min(1).max(500)).max(12),
  tone: z.string().trim().min(2).max(240),
  colors: z.array(z.string().regex(/^#[\da-fA-F]{6}$/)).min(1).max(8),
  mediaDirection: z.string().trim().min(2).max(500),
  motionDirection: z.string().trim().min(2).max(500),
  qualityMode: z.enum(["STANDARD", "PREMIUM", "ABSURD"]),
});

export const createProjectSchema = z.object({
  name: z.string().trim().min(2).max(80),
  brief: projectBriefSchema,
});

export type ProjectBrief = z.infer<typeof projectBriefSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export interface ProjectRecord {
  id: string;
  name: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  workspacePath: string;
  createdAt: string;
  updatedAt: string;
  brief: ProjectBrief;
}

export type CodexRunStatus = "RUNNING" | "CANCELLING" | "SUCCEEDED" | "FAILED" | "CANCELLED" | "TIMED_OUT" | "INTERRUPTED";
export type CodexRetryClass = "NONE" | "TRANSIENT" | "USER_ACTION" | "MANUAL_REVIEW";

export interface CodexRunRecord {
  id: string;
  generationRunId: string;
  projectId: string;
  workspacePath: string;
  schemaVersion: 1;
  status: CodexRunStatus;
  cliVersion: string;
  exitCode: number | null;
  retryClass: CodexRetryClass;
  errorCode: string | null;
  stdoutLog: string;
  stderrLog: string;
  resultJson: string | null;
  resultPath: string | null;
  createdAt: string;
  startedAt: string;
  finishedAt: string | null;
  updatedAt: string;
}

export interface CodexRunUpdate {
  status?: CodexRunStatus;
  exitCode?: number | null;
  retryClass?: CodexRetryClass;
  errorCode?: string | null;
  stdoutLog?: string;
  stderrLog?: string;
  resultJson?: string | null;
  resultPath?: string | null;
  finishedAt?: string | null;
}

export interface IrisStoreOptions {
  databasePath: string;
  projectsDirectory: string;
  repositoryRoot: string;
  migrationsDirectory?: string;
}

export interface IrisStore {
  close(): void;
  createProject(input: CreateProjectInput): ProjectRecord;
  getProject(id: string): ProjectRecord | null;
  listProjects(): ProjectRecord[];
  createCodexRun(input: { projectId: string; workspacePath: string; cliVersion: string }): CodexRunRecord;
  getCodexRun(projectId: string, id: string): CodexRunRecord | null;
  listCodexRuns(projectId: string): CodexRunRecord[];
  updateCodexRun(id: string, update: CodexRunUpdate): CodexRunRecord | null;
}

function readMigrations(directory: string) {
  return readdirSync(directory)
    .filter((entry) => /^\d{4}_[a-z0-9_-]+\.sql$/i.test(entry))
    .sort()
    .map((name) => ({
      version: Number(name.slice(0, 4)),
      name,
      sql: readFileSync(join(directory, name), "utf8"),
    }));
}

function migrate(database: Database.Database, directory: string) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL
    );
  `);

  const migrations = readMigrations(directory);
  const apply = database.transaction((migration: (typeof migrations)[number]) => {
    database.exec(migration.sql);
    database.prepare("INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)")
      .run(migration.version, migration.name, new Date().toISOString());
  });

  for (const migration of migrations) {
    const applied = database.prepare("SELECT name FROM schema_migrations WHERE version = ?").get(migration.version) as
      | { name: string }
      | undefined;
    if (applied && applied.name !== migration.name) {
      throw new Error(`A migração ${migration.version} já foi aplicada com outro nome.`);
    }
    if (!applied) apply.immediate(migration);
  }
}

function mapProject(row: Record<string, unknown> | undefined): ProjectRecord | null {
  if (!row) return null;
  return {
    id: String(row.id),
    name: String(row.name),
    status: row.status as ProjectRecord["status"],
    workspacePath: String(row.workspace_path),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    brief: projectBriefSchema.parse(JSON.parse(String(row.content_json))),
  };
}

function mapCodexRun(row: Record<string, unknown> | undefined): CodexRunRecord | null {
  if (!row) return null;
  return {
    id: String(row.id),
    generationRunId: String(row.generation_run_id),
    projectId: String(row.project_id),
    workspacePath: String(row.workspace_path),
    schemaVersion: Number(row.schema_version) as 1,
    status: String(row.status) as CodexRunStatus,
    cliVersion: String(row.cli_version),
    exitCode: row.exit_code === null ? null : Number(row.exit_code),
    retryClass: String(row.retry_class) as CodexRetryClass,
    errorCode: row.error_code === null ? null : String(row.error_code),
    stdoutLog: String(row.stdout_log),
    stderrLog: String(row.stderr_log),
    resultJson: row.result_json === null ? null : String(row.result_json),
    resultPath: row.result_path === null ? null : String(row.result_path),
    createdAt: String(row.created_at),
    startedAt: String(row.started_at),
    finishedAt: row.finished_at === null ? null : String(row.finished_at),
    updatedAt: String(row.updated_at),
  };
}

function genericRunStatus(status: CodexRunStatus) {
  if (status === "SUCCEEDED") return { run: "SUCCEEDED", job: "SUCCEEDED", progress: 1 } as const;
  if (status === "CANCELLED") return { run: "CANCELLED", job: "CANCELLED", progress: 0 } as const;
  if (status === "RUNNING" || status === "CANCELLING") return { run: "RUNNING", job: "RUNNING", progress: 0.5 } as const;
  return { run: "FAILED", job: "FAILED", progress: 0 } as const;
}

export function openIrisStore(options: IrisStoreOptions): IrisStore {
  if (![options.databasePath, options.projectsDirectory, options.repositoryRoot].every(isAbsolute)) {
    throw new Error("Database, projects directory e source repository devem usar caminhos absolutos.");
  }
  const databasePath = resolve(options.databasePath);
  const projectsDirectory = resolve(options.projectsDirectory);
  const repositoryRoot = resolve(options.repositoryRoot);

  assertOutsideSourceRepository(databasePath, repositoryRoot);
  assertOutsideSourceRepository(projectsDirectory, repositoryRoot);
  const migrationsDirectory = options.migrationsDirectory ?? join(repositoryRoot, "src", "server", "db", "migrations");
  if (!existsSync(/*turbopackIgnore: true*/ migrationsDirectory)) {
    throw new Error(`Diretório de migrações não encontrado: ${migrationsDirectory}`);
  }

  mkdirSync(dirname(databasePath), { recursive: true });
  mkdirSync(projectsDirectory, { recursive: true });
  assertOutsideSourceRepository(databasePath, repositoryRoot);
  assertOutsideSourceRepository(projectsDirectory, repositoryRoot);

  const database = new Database(databasePath);
  database.pragma("foreign_keys = ON");
  database.pragma("busy_timeout = 5000");
  database.pragma("journal_mode = WAL");

  try {
    migrate(database, migrationsDirectory);
  } catch (error) {
    database.close();
    throw error;
  }

  const selectProject = database.prepare(`
    SELECT projects.*, project_specs.content_json
    FROM projects
    JOIN project_specs ON project_specs.project_id = projects.id
    WHERE projects.id = ?
  `);
  database.prepare(`
    UPDATE codex_runs SET status = 'INTERRUPTED', error_code = 'PROCESS_RESTARTED',
      retry_class = 'MANUAL_REVIEW', updated_at = ?
    WHERE status IN ('RUNNING', 'CANCELLING')
  `).run(new Date().toISOString());
  database.prepare(`
    UPDATE generation_runs SET status = 'FAILED', updated_at = ?
    WHERE id IN (SELECT generation_run_id FROM codex_runs WHERE status = 'INTERRUPTED')
      AND status = 'RUNNING'
  `).run(new Date().toISOString());
  database.prepare(`
    UPDATE jobs SET status = 'FAILED', updated_at = ?
    WHERE generation_run_id IN (SELECT generation_run_id FROM codex_runs WHERE status = 'INTERRUPTED')
      AND status = 'RUNNING'
  `).run(new Date().toISOString());
  const codexRunSelect = database.prepare("SELECT * FROM codex_runs WHERE id = ?");

  return {
    close() {
      if (database.open) database.close();
    },
    createProject(input) {
      const projectInput = createProjectSchema.parse(input);
      const id = randomUUID();
      const workspacePath = resolveProjectWorkspacePath(projectsDirectory, id);
      const createdAt = new Date().toISOString();
      mkdirSync(workspacePath);
      try {
        const insert = database.transaction(() => {
          database.prepare(`
            INSERT INTO projects (id, name, workspace_path, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
          `).run(id, projectInput.name, workspacePath, createdAt, createdAt);
          database.prepare(`
            INSERT INTO project_specs (project_id, content_json, created_at, updated_at)
            VALUES (?, ?, ?, ?)
          `).run(id, JSON.stringify(projectInput.brief), createdAt, createdAt);
        });
        insert.immediate();
      } catch (error) {
        try {
          rmdirSync(workspacePath);
        } catch {
          // Remove only an empty directory created by this operation; never recurse into workspace content.
        }
        throw error;
      }

      const project = mapProject(selectProject.get(id) as Record<string, unknown> | undefined);
      if (!project) throw new Error("O projeto foi salvo, mas não pôde ser reaberto.");
      return project;
    },
    getProject(id) {
      if (!z.uuid().safeParse(id).success) return null;
      return mapProject(selectProject.get(id) as Record<string, unknown> | undefined);
    },
    listProjects() {
      const rows = database.prepare(`
        SELECT projects.*, project_specs.content_json
        FROM projects
        JOIN project_specs ON project_specs.project_id = projects.id
        ORDER BY projects.updated_at DESC, projects.created_at DESC
      `).all() as Record<string, unknown>[];
      return rows.map((row) => mapProject(row)).filter((project): project is ProjectRecord => project !== null);
    },
    createCodexRun(input) {
      if (!z.uuid().safeParse(input.projectId).success) throw new Error("Projeto inválido para execução Codex.");
      const project = mapProject(selectProject.get(input.projectId) as Record<string, unknown> | undefined);
      if (!project) throw new Error("Projeto não encontrado para execução Codex.");
      if (!samePath(input.workspacePath, project.workspacePath)) throw new Error("Workspace não corresponde ao projeto selecionado.");
      const id = randomUUID();
      const generationRunId = randomUUID();
      const jobId = randomUUID();
      const now = new Date().toISOString();
      const insert = database.transaction(() => {
        database.prepare(`
          INSERT INTO generation_runs (id, project_id, status, created_at, updated_at)
          VALUES (?, ?, 'RUNNING', ?, ?)
        `).run(generationRunId, project.id, now, now);
        database.prepare(`
          INSERT INTO jobs (id, generation_run_id, kind, status, progress, created_at, updated_at)
          VALUES (?, ?, 'CODEX_EXECUTION', 'RUNNING', 0.5, ?, ?)
        `).run(jobId, generationRunId, now, now);
        database.prepare(`
          INSERT INTO codex_runs (id, generation_run_id, project_id, workspace_path, status, cli_version,
            created_at, started_at, updated_at)
          VALUES (?, ?, ?, ?, 'RUNNING', ?, ?, ?, ?)
        `).run(id, generationRunId, project.id, resolve(input.workspacePath), input.cliVersion, now, now, now);
      });
      insert.immediate();
      return mapCodexRun(codexRunSelect.get(id) as Record<string, unknown> | undefined)!;
    },
    getCodexRun(projectId, id) {
      if (!z.uuid().safeParse(projectId).success || !z.uuid().safeParse(id).success) return null;
      const row = database.prepare("SELECT * FROM codex_runs WHERE project_id = ? AND id = ?")
        .get(projectId, id) as Record<string, unknown> | undefined;
      return mapCodexRun(row);
    },
    listCodexRuns(projectId) {
      if (!z.uuid().safeParse(projectId).success) return [];
      const rows = database.prepare("SELECT * FROM codex_runs WHERE project_id = ? ORDER BY created_at DESC LIMIT 100")
        .all(projectId) as Record<string, unknown>[];
      return rows.map((row) => mapCodexRun(row)).filter((run): run is CodexRunRecord => run !== null);
    },
    updateCodexRun(id, update) {
      if (!z.uuid().safeParse(id).success) return null;
      const current = mapCodexRun(codexRunSelect.get(id) as Record<string, unknown> | undefined);
      if (!current) return null;
      const nextStatus = update.status ?? current.status;
      const timestamp = new Date().toISOString();
      const patch = {
        ...current,
        ...update,
        updatedAt: timestamp,
      };
      const generic = genericRunStatus(nextStatus);
      const transaction = database.transaction(() => {
        database.prepare(`
          UPDATE codex_runs SET status = ?, exit_code = ?, retry_class = ?, error_code = ?, stdout_log = ?,
            stderr_log = ?, result_json = ?, result_path = ?, finished_at = ?, updated_at = ? WHERE id = ?
        `).run(patch.status, patch.exitCode, patch.retryClass, patch.errorCode, patch.stdoutLog, patch.stderrLog,
          patch.resultJson, patch.resultPath, patch.finishedAt, timestamp, id);
        database.prepare("UPDATE generation_runs SET status = ?, updated_at = ? WHERE id = ?")
          .run(generic.run, timestamp, current.generationRunId);
        database.prepare("UPDATE jobs SET status = ?, progress = ?, updated_at = ? WHERE generation_run_id = ?")
          .run(generic.job, generic.progress, timestamp, current.generationRunId);
      });
      transaction.immediate();
      return mapCodexRun(codexRunSelect.get(id) as Record<string, unknown> | undefined);
    },
  };
}
