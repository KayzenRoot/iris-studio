import { describe, expect, it } from "vitest";

import { readApprovalRequest, readRevisionRequest } from "../../src/server/art-director/http";

describe("M03 local HTTP request boundary", () => {
  it("accepts only the empty generation request or a bounded revision linked to a parent", async () => {
    const generation = await readRevisionRequest(new Request("http://127.0.0.1:3000", {
      method: "POST",
      body: "{}",
    }));
    expect("payload" in generation && generation.payload).toEqual({});

    const revision = await readRevisionRequest(new Request("http://127.0.0.1:3000", {
      method: "POST",
      body: JSON.stringify({
        parentRevisionId: "00000000-0000-4000-8000-000000000001",
        revisionRequest: "Aumente a clareza da hierarquia e o vínculo entre material e conteúdo.",
      }),
    }));
    expect("payload" in revision && revision.payload.parentRevisionId)
      .toBe("00000000-0000-4000-8000-000000000001");

    const unlinked = await readRevisionRequest(new Request("http://127.0.0.1:3000", {
      method: "POST",
      body: JSON.stringify({ revisionRequest: "Uma revisão sem revisão de origem." }),
    }));
    expect("error" in unlinked && unlinked.error.status).toBe(400);
  });

  it("rejects unknown credential fields and requires explicit immutable-approval confirmation", async () => {
    const credential = await readRevisionRequest(new Request("http://127.0.0.1:3000", {
      method: "POST",
      body: JSON.stringify({ apiKey: "sk-never-accept-this" }),
    }));
    expect("error" in credential && credential.error.status).toBe(400);
    expect(JSON.stringify(credential)).not.toContain("sk-never-accept-this");

    const absent = await readApprovalRequest(new Request("http://127.0.0.1:3000", {
      method: "POST",
      body: JSON.stringify({}),
    }));
    expect("error" in absent && absent.error.status).toBe(400);
    const falseConfirmation = await readApprovalRequest(new Request("http://127.0.0.1:3000", {
      method: "POST",
      body: JSON.stringify({ confirmImmutableApproval: false }),
    }));
    expect("error" in falseConfirmation && falseConfirmation.error.status).toBe(400);
    const explicit = await readApprovalRequest(new Request("http://127.0.0.1:3000", {
      method: "POST",
      body: JSON.stringify({ confirmImmutableApproval: true }),
    }));
    expect("payload" in explicit && explicit.payload.confirmImmutableApproval).toBe(true);
  });

  it("bounds streamed bodies even when Content-Length is absent", async () => {
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      start(controller) { controller.enqueue(new Uint8Array(8 * 1024 + 1)); },
      cancel() { cancelled = true; },
    });
    const request = new Request("http://127.0.0.1:3000", {
      method: "POST",
      body,
      duplex: "half",
    } as RequestInit);
    const parsed = await readRevisionRequest(request);
    expect("error" in parsed && parsed.error.status).toBe(413);
    expect(cancelled).toBe(true);
  });
});
