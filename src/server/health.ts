import { accessSync, constants, statSync } from "node:fs";
import { delimiter, join } from "node:path";

import { CodexAdapter, type CodexProbeResult } from "./codex/adapter";

export type HealthStatus = "AVAILABLE" | "READY" | "UNAUTHENTICATED" | "UNAVAILABLE" | "MISCONFIGURED";

export interface IntegrationHealth {
  status: HealthStatus;
  detail: string;
  version?: string;
}

export interface IntegrationsHealth {
  codex: IntegrationHealth;
  comfyui: IntegrationHealth;
  blender: IntegrationHealth;
}

interface IntegrationProbeOptions {
  findExecutable?: (name: string) => string | null;
  fetcher?: typeof fetch;
  codexProbe?: () => Promise<CodexProbeResult>;
}

export function findLocalExecutable(name: string) {
  const folders = (process.env.PATH ?? "").split(delimiter).filter(Boolean);
  const extensions = process.platform === "win32"
    ? (process.env.PATHEXT ?? ".COM;.EXE;.BAT;.CMD").split(";")
    : [""];
  const candidates = extensions.some((extension) => name.toLowerCase().endsWith(extension.toLowerCase()))
    ? [name]
    : extensions.map((extension) => `${name}${extension}`);

  for (const folder of folders) {
    for (const candidate of candidates) {
      const path = join(folder, candidate);
      try {
        if (statSync(path).isFile()) {
          accessSync(path, process.platform === "win32" ? constants.F_OK : constants.X_OK);
          return path;
        }
      } catch {
        // Keep searching PATH; an absent tool is normal for a local optional integration.
      }
    }
  }
  return null;
}

function executableHealth(
  name: string,
  label: string,
  detailWhenAvailable: string,
  findExecutable: (name: string) => string | null,
): IntegrationHealth {
  try {
    return findExecutable(name)
      ? { status: "AVAILABLE", detail: detailWhenAvailable }
      : { status: "UNAVAILABLE", detail: `${label} não encontrado no PATH.` };
  } catch {
    return { status: "MISCONFIGURED", detail: `Não foi possível verificar ${label} no PATH.` };
  }
}

export async function checkIntegrations(options: IntegrationProbeOptions = {}): Promise<IntegrationsHealth> {
  const findExecutable = options.findExecutable ?? findLocalExecutable;
  const fetcher = options.fetcher ?? fetch;
  let codex: IntegrationHealth;
  try {
    const probe = await (options.codexProbe ?? (() => new CodexAdapter().probe()))();
    codex = { status: probe.status, detail: probe.detail, version: probe.version };
  } catch {
    codex = { status: "MISCONFIGURED", detail: "Não foi possível verificar a instalação ou sessão local do Codex CLI." };
  }
  const blender = executableHealth(
    "blender",
    "Blender",
    "Executável Blender encontrado; MCP e automação não executados pelo M01.",
    findExecutable,
  );

  let comfyui: IntegrationHealth;
  try {
    const response = await fetcher("http://127.0.0.1:8188/system_stats", {
      method: "GET",
      signal: AbortSignal.timeout(1500),
    });
    comfyui = response.ok
      ? { status: "AVAILABLE", detail: "O endpoint local /system_stats respondeu." }
      : { status: "MISCONFIGURED", detail: `O serviço local respondeu com HTTP ${response.status}.` };
  } catch {
    comfyui = { status: "UNAVAILABLE", detail: "ComfyUI não respondeu no endereço local padrão." };
  }

  return { codex, comfyui, blender };
}
