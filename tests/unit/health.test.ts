import { describe, expect, it } from "vitest";

import { checkIntegrations } from "../../src/server/health";

describe("integration health detection", () => {
  it("reports authenticated Codex readiness without exposing probe output", async () => {
    const checkedUrls: string[] = [];
    const health = await checkIntegrations({
      findExecutable: (name) => (name === "codex" ? "C:/tools/codex.cmd" : null),
      codexProbe: async () => ({ status: "READY", version: "1.2.3", detail: "Codex CLI pronto com autenticação ChatGPT local." }),
      fetcher: async (input) => {
        checkedUrls.push(String(input));
        return new Response("{}", { status: 200 });
      },
    });

    expect(health.codex).toMatchObject({
      status: "READY",
      version: "1.2.3",
      detail: expect.stringMatching(/autenticação ChatGPT/i),
    });
    expect(health.comfyui.status).toBe("AVAILABLE");
    expect(health.blender.status).toBe("UNAVAILABLE");
    expect(checkedUrls).toHaveLength(1);
    expect(new URL(checkedUrls[0]).hostname).toBe("127.0.0.1");
  });

  it("turns an offline local service into UNAVAILABLE without crashing the health surface", async () => {
    const health = await checkIntegrations({
      codexProbe: async () => ({ status: "UNAVAILABLE", detail: "Codex CLI nativo não encontrado no PATH." }),
      fetcher: async () => {
        throw new Error("ECONNREFUSED");
      },
    });

    expect(health.codex.status).toBe("UNAVAILABLE");
    expect(health.comfyui.status).toBe("UNAVAILABLE");
    expect(health.blender.status).toBe("UNAVAILABLE");
  });

  it("reports probe failures and unhealthy responses as MISCONFIGURED", async () => {
    const health = await checkIntegrations({
      findExecutable: () => { throw new Error("PATH cannot be inspected"); },
      codexProbe: async () => {
        throw new Error("PATH cannot be inspected");
      },
      fetcher: async () => new Response("", { status: 500 }),
    });

    expect(health.codex.status).toBe("MISCONFIGURED");
    expect(health.comfyui).toMatchObject({
      status: "MISCONFIGURED",
      detail: expect.stringContaining("HTTP 500"),
    });
    expect(health.blender.status).toBe("MISCONFIGURED");
  });
});
