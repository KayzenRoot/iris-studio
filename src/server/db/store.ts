import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmdirSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { z } from "zod";

import { assertOutsideSourceRepository, resolveProjectWorkspacePath } from "../workspaces/paths";

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
  };
}
