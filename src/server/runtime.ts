import { getAppConfig } from "./config";
import { checkIntegrations, type IntegrationHealth } from "./health";
import { logEvent } from "./logger";
import { openIrisStore, type IrisStore } from "./db/store";

const irisGlobal = globalThis as typeof globalThis & { __irisStore?: IrisStore };

export function getAppStore() {
  if (!irisGlobal.__irisStore) {
    const config = getAppConfig();
    irisGlobal.__irisStore = openIrisStore({
      databasePath: config.databasePath,
      projectsDirectory: config.projectsDirectory,
      repositoryRoot: process.cwd(),
    });
    logEvent("info", "local_store_ready");
  }
  return irisGlobal.__irisStore;
}

export interface SystemHealth {
  application: IntegrationHealth;
  database: IntegrationHealth;
  integrations: Awaited<ReturnType<typeof checkIntegrations>>;
  checkedAt: string;
}

export async function getSystemHealth(): Promise<SystemHealth> {
  let database: IntegrationHealth;
  try {
    getAppStore();
    database = { status: "AVAILABLE", detail: "SQLite local e migrações estão disponíveis." };
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    logEvent("error", "local_store_unavailable", { errorName });
    database = { status: "MISCONFIGURED", detail: "Não foi possível abrir o armazenamento local. Confira a configuração e a pasta de dados." };
  }

  const integrations = await checkIntegrations();
  return {
    application: { status: "AVAILABLE", detail: "Dashboard local em execução neste dispositivo." },
    database,
    integrations,
    checkedAt: new Date().toISOString(),
  };
}
