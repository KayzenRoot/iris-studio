import { describe, expect, it } from "vitest";

import { hasSameOriginLoopbackRequest, readCodexStartPayload } from "../../src/server/codex/http";

describe("local Codex HTTP boundary", () => {
  it("requires a same-origin loopback source for mutating requests", () => {
    const trusted = new Request("http://127.0.0.1:3000/api/projects/x/codex-runs", {
      method: "POST",
      headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" },
      body: "{}",
    });
    const remote = new Request("http://127.0.0.1:3000/api/projects/x/codex-runs", {
      method: "POST",
      headers: { host: "127.0.0.1:3000", origin: "https://attacker.invalid" },
      body: "{}",
    });
    const absent = new Request("http://127.0.0.1:3000/api/projects/x/codex-runs", { method: "POST", body: "{}" });
    const normalizedByFramework = new Request("http://localhost:3000/api/projects/x/codex-runs", {
      method: "POST",
      headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" },
      body: "{}",
    });
    expect(hasSameOriginLoopbackRequest(trusted)).toBe(true);
    expect(hasSameOriginLoopbackRequest(normalizedByFramework)).toBe(true);
    expect(hasSameOriginLoopbackRequest(remote)).toBe(false);
    expect(hasSameOriginLoopbackRequest(absent)).toBe(false);
  });

  it("accepts only a bounded prompt field and never allows API key properties", async () => {
    const valid = await readCodexStartPayload(new Request("http://127.0.0.1:3000", {
      method: "POST", body: JSON.stringify({ prompt: "tarefa local" }),
    }));
    expect("payload" in valid && valid.payload?.prompt).toBe("tarefa local");

    const key = await readCodexStartPayload(new Request("http://127.0.0.1:3000", {
      method: "POST", body: JSON.stringify({ prompt: "tarefa local", apiKey: "sk-do-not-accept" }),
    }));
    expect("error" in key && key.error?.status).toBe(400);
    expect(JSON.stringify(key)).not.toContain("sk-do-not-accept");
  });

  it("stops reading a streamed body after 16 KiB", async () => {
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(16 * 1024 + 1));
      },
      cancel() { cancelled = true; },
    });
    const request = new Request("http://127.0.0.1:3000", { method: "POST", body, duplex: "half" } as RequestInit);
    const parsed = await readCodexStartPayload(request);
    expect("error" in parsed && parsed.error?.status).toBe(413);
    expect(cancelled).toBe(true);
  });
});
