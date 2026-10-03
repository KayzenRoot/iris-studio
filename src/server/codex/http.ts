import { NextResponse } from "next/server";
import { z } from "zod";

import { CodexServiceError } from "./service";

const MAX_REQUEST_BYTES = 16 * 1024;
const startSchema = z.object({ prompt: z.string().min(1).max(MAX_REQUEST_BYTES) }).strict();

export function hasSameOriginLoopbackRequest(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    const loopbackHosts = new Set(["127.0.0.1", "localhost", "[::1]"]);
    return !originUrl.username
      && !originUrl.password
      && originUrl.protocol === requestUrl.protocol
      && originUrl.host.toLowerCase() === host.toLowerCase()
      && loopbackHosts.has(originUrl.hostname.toLowerCase())
      && loopbackHosts.has(requestUrl.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export async function readCodexStartPayload(request: Request) {
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > MAX_REQUEST_BYTES)) {
    return { error: NextResponse.json({ error: "O corpo da solicitação excede 16 KiB." }, { status: 413 }) };
  }
  const reader = request.body?.getReader();
  if (!reader) return { error: NextResponse.json({ error: "Envie a tarefa em JSON." }, { status: 400 }) };
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_REQUEST_BYTES) {
        await reader.cancel();
        return { error: NextResponse.json({ error: "O corpo da solicitação excede 16 KiB." }, { status: 413 }) };
      }
      chunks.push(value);
    }
  } catch {
    return { error: NextResponse.json({ error: "Não foi possível ler a tarefa enviada." }, { status: 400 }) };
  }
  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf8"));
  } catch {
    return { error: NextResponse.json({ error: "Envie a tarefa em JSON válido." }, { status: 400 }) };
  }
  const parsed = startSchema.safeParse(payload);
  if (!parsed.success) return { error: NextResponse.json({ error: "Envie somente o campo prompt, com até 8 KiB de texto." }, { status: 400 }) };
  return { payload: parsed.data };
}

export function codexErrorResponse(error: unknown) {
  if (error instanceof CodexServiceError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
  }
  return NextResponse.json({ error: "Não foi possível concluir a operação Codex." }, { status: 500 });
}
