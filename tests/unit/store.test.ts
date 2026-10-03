import { afterEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { openIrisStore } from "../../src/server/db/store";
import { assertWorkspaceTreeSafe, resolveProjectWorkspacePath } from "../../src/server/workspaces/paths";

const temporaryDirectories: string[] = [];

function makeTemporaryDirectory() {
  const directory = mkdtempSync(join(tmpdir(), "iris-store-test-"));
  temporaryDirectories.push(directory);
  return directory;
}

function removeTemporaryDirectory(directory: string) {
  if (!existsSync(directory)) return;
  for (const entry of readdirSync(directory)) {
    const child = join(directory, entry);
    if (lstatSync(child).isSymbolicLink()) unlinkSync(child);
  }
  rmSync(directory, { recursive: true, force: true });
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    removeTemporaryDirectory(directory);
  }
});

describe("local project persistence", () => {
  it("creates a project workspace and reopens its project brief after the database is reopened", () => {
    const root = makeTemporaryDirectory();
    const repositoryRoot = process.cwd();
    const databasePath = join(root, "user-data", "iris-studio.sqlite");
    const projectsDirectory = join(root, "user-data", "projects");
    const options = { databasePath, projectsDirectory, repositoryRoot };
    const store = openIrisStore(options);
    const created = store.createProject({
      name: "Aurora Studio",
      brief: {
        siteType: "portfolio",
        description: "Um portfólio editorial para um estúdio de arquitetura.",
        pages: ["Início", "Projetos", "Contato"],
        references: ["https://example.com/inspiration"],
        tone: "editorial, preciso e acolhedor",
        colors: ["#10231e", "#e8e3d9"],
        mediaDirection: "fotografia de arquitetura",
        motionDirection: "transições discretas",
        qualityMode: "PREMIUM",
      },
    });

    expect(existsSync(created.workspacePath)).toBe(true);
    store.close();

    const reopenedStore = openIrisStore(options);
    const reopened = reopenedStore.getProject(created.id);

    expect(reopened).toMatchObject({
      id: created.id,
      name: "Aurora Studio",
      status: "DRAFT",
      brief: {
        pages: ["Início", "Projetos", "Contato"],
        references: ["https://example.com/inspiration"],
        colors: ["#10231e", "#e8e3d9"],
        qualityMode: "PREMIUM",
      },
    });
    expect(reopenedStore.listProjects()).toHaveLength(1);
    reopenedStore.close();
  });

  it("rejects projects with more than eight requested pages", () => {
    const root = makeTemporaryDirectory();
    const store = openIrisStore({
      databasePath: join(root, "data", "iris-studio.sqlite"),
      projectsDirectory: join(root, "data", "projects"),
      repositoryRoot: process.cwd(),
    });
    const pages = ["Home", "About", "Services", "Work", "Journal", "Team", "Contact", "Legal", "Press"];

    expect(() =>
      store.createProject({
        name: "Many pages",
        brief: {
          siteType: "institutional",
          description: "Uma descrição válida para o projeto.",
          pages,
          references: [],
          tone: "claro",
          colors: ["#ffffff"],
          mediaDirection: "fotografia",
          motionDirection: "sem animações",
          qualityMode: "STANDARD",
        },
      }),
    ).toThrow(/8/);

    store.close();
  });

  it("rejects workspace identifiers that escape the projects directory", () => {
    const projectsDirectory = makeTemporaryDirectory();

    expect(() => resolveProjectWorkspacePath(projectsDirectory, "../../outside"))
      .toThrow(/workspace identifier/i);
  });

  it("refuses to create the data or project roots inside the IRIS source repository", () => {
    const root = makeTemporaryDirectory();
    const repositoryRoot = process.cwd();

    expect(() =>
      openIrisStore({
        databasePath: join(repositoryRoot, ".local", "iris-studio.sqlite"),
        projectsDirectory: join(root, "external-projects"),
        repositoryRoot,
      }),
    ).toThrow(/fora do source repository/i);
  });

  it("rejects a project workspace that is a symlink or junction inside the projects root", () => {
    const root = makeTemporaryDirectory();
    const projectsDirectory = join(root, "projects");
    const projectId = "f1f15a5c-03bb-426e-88da-f0e536b9d598";
    const targetDirectory = join(projectsDirectory, "other-project");
    mkdirSync(targetDirectory, { recursive: true });
    symlinkSync(targetDirectory, join(projectsDirectory, projectId), process.platform === "win32" ? "junction" : "dir");

    expect(() => resolveProjectWorkspacePath(projectsDirectory, projectId)).toThrow(/symlink|junction/i);
  });

  it("rejects links anywhere below a canonical project workspace", () => {
    const root = makeTemporaryDirectory();
    const repositoryRoot = process.cwd();
    const workspace = join(root, "projects", "project");
    const outside = join(root, "outside");
    mkdirSync(workspace, { recursive: true });
    mkdirSync(outside);
    symlinkSync(outside, join(workspace, "linked"), process.platform === "win32" ? "junction" : "dir");

    expect(() => assertWorkspaceTreeSafe(workspace, repositoryRoot)).toThrow(/symlink|junction|escapa|WORKSPACE_ENTRY_ESCAPE/i);
  });

  it("creates the versioned Codex run table during the next ordered migration", () => {
    const root = makeTemporaryDirectory();
    const databasePath = join(root, "user-data", "iris-studio.sqlite");
    const store = openIrisStore({
      databasePath,
      projectsDirectory: join(root, "user-data", "projects"),
      repositoryRoot: process.cwd(),
    });
    const database = new Database(databasePath);
    try {
      const table = database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'codex_runs'").get();
      expect(table).toBeDefined();
    } finally {
      database.close();
      store.close();
    }
  });
});
