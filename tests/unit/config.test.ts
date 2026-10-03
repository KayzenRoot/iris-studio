import { afterEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { parseAppConfig } from "../../src/server/config";

const temporaryDirectories: string[] = [];

function makeTemporaryDirectory() {
  const directory = mkdtempSync(join(tmpdir(), "iris-config-test-"));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("parseAppConfig", () => {
  it("places local data outside the source repository by default", () => {
    const home = makeTemporaryDirectory();
    const repositoryRoot = join(home, "source");
    const config = parseAppConfig({ NODE_ENV: "test" }, { homeDirectory: home, repositoryRoot });

    expect(config.databasePath).toBe(join(config.dataDirectory, "iris-studio.sqlite"));
    expect(config.projectsDirectory).toBe(join(config.dataDirectory, "projects"));
    expect(config.dataDirectory.startsWith(repositoryRoot)).toBe(false);
  });

  it("rejects invalid ports instead of silently accepting a bad runtime configuration", () => {
    expect(() => parseAppConfig({ NODE_ENV: "test", PORT: "70000" })).toThrow(/PORT/);
    expect(() => parseAppConfig({ NODE_ENV: "test", PORT: "not-a-port" })).toThrow(/PORT/);
  });

  it("rejects an explicitly configured data directory inside the source repository", () => {
    const repositoryRoot = makeTemporaryDirectory();

    expect(() =>
      parseAppConfig(
        { NODE_ENV: "test", IRIS_DATA_DIR: join(repositoryRoot, "generated-data") },
        { repositoryRoot },
      ),
    ).toThrow(/fora do source repository/i);
  });

  it("rejects data directories whose symlink resolves into the source repository", () => {
    const root = makeTemporaryDirectory();
    const repositoryRoot = join(root, "source");
    const alias = join(root, "source-alias");
    mkdirSync(repositoryRoot);
    symlinkSync(repositoryRoot, alias, process.platform === "win32" ? "junction" : "dir");

    expect(() =>
      parseAppConfig(
        { NODE_ENV: "test", IRIS_DATA_DIR: join(alias, "generated-data") },
        { repositoryRoot },
      ),
    ).toThrow(/fora do source repository/i);
  });
});
