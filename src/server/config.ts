import { homedir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";
import { z } from "zod";

import { isPathInside } from "./workspaces/paths";

export interface AppConfig {
  dataDirectory: string;
  databasePath: string;
  projectsDirectory: string;
  port: number;
  host: "127.0.0.1";
}

interface ConfigContext {
  homeDirectory?: string;
  repositoryRoot?: string;
  platform?: NodeJS.Platform;
}

const environmentSchema = z.object({
  IRIS_DATA_DIR: z.string().trim().min(1).optional(),
  PORT: z.string().regex(/^\d+$/, "PORT deve conter apenas números.").optional(),
});

export function parseAppConfig(
  environment: NodeJS.ProcessEnv,
  context: ConfigContext = {},
): AppConfig {
  const parsed = environmentSchema.safeParse(environment);
  if (!parsed.success) {
    const variables = [...new Set(parsed.error.issues.map((issue) => issue.path[0]))];
    throw new Error(`Configuração inválida em ${variables.join(", ")}: ${parsed.error.issues[0]?.message}`);
  }

  const platform = context.platform ?? process.platform;
  const homeDirectory = context.homeDirectory ?? homedir();
  const repositoryRoot = resolve(/*turbopackIgnore: true*/ context.repositoryRoot ?? process.cwd());
  const defaultDataDirectory =
    platform === "win32"
      ? join(environment.LOCALAPPDATA || join(homeDirectory, "AppData", "Local"), "IRIS Studio")
      : join(environment.XDG_DATA_HOME || join(homeDirectory, ".local", "share"), "iris-studio");
  const configuredDataDirectory = parsed.data.IRIS_DATA_DIR ?? defaultDataDirectory;

  if (!isAbsolute(configuredDataDirectory)) {
    throw new Error("Configuração inválida em IRIS_DATA_DIR: informe um caminho absoluto.");
  }

  const dataDirectory = resolve(configuredDataDirectory);
  if (isPathInside(repositoryRoot, dataDirectory)) {
    throw new Error("IRIS_DATA_DIR deve ficar fora do source repository para manter dados e projetos locais isolados.");
  }

  const port = parsed.data.PORT === undefined ? 3000 : Number(parsed.data.PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("Configuração inválida em PORT: use um número inteiro entre 1 e 65535.");
  }

  return {
    dataDirectory,
    databasePath: join(dataDirectory, "iris-studio.sqlite"),
    projectsDirectory: join(dataDirectory, "projects"),
    port,
    host: "127.0.0.1",
  };
}

export function getAppConfig(environment: NodeJS.ProcessEnv = process.env) {
  return parseAppConfig(environment);
}
