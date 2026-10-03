import { NextResponse } from "next/server";
import { z } from "zod";

import { ArtDirectorServiceError } from "./service";

const MAX_REQUEST_BYTES = 8 * 1024;
const revisionRequestSchema = z.object({
  parentRevisionId: z.uuid().optional(),
  revisionRequest: z.string().trim().min(10).max(1200).optional(),
}).strict().superRefine((value, context) => {
  if (value.parentRevisionId && !value.revisionRequest) {
    context.addIssue({ code: "custom", path: ["revisionRequest"], message: "Descreva a mudança desejada." });
  }
  if (!value.parentRevisionId && value.revisionRequest) {
    context.addIssue({ code: "custom", path: ["parentRevisionId"], message: "Uma revisão precisa apontar para uma versão de origem." });
  }
});

const approvalRequestSchema = z.object({
  confirmImmutableApproval: z.literal(true),
}).strict();

async function readJson(request: Request) {
  const contentLength = request.headers.get("content-length");
  if (contentLength && (!/^\d+$/.test(contentLength) || Number(contentLength) > MAX_REQUEST_BYTES)) {
    return { error: NextResponse.json({ error: "A solicitação excede 8 KiB." }, { status: 413 }) };
  }
  const reader = request.body?.getReader();
  if (!reader) return { error: NextResponse.json({ error: "Envie um objeto JSON." }, { status: 400 }) };
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_REQUEST_BYTES) {
        await reader.cancel();
        return { error: NextResponse.json({ error: "A solicitação excede 8 KiB." }, { status: 413 }) };
      }
      chunks.push(value);
    }
  } catch {
    return { error: NextResponse.json({ error: "Não foi possível ler a solicitação local." }, { status: 400 }) };
  }
  try {
    return { payload: JSON.parse(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf8")) as unknown };
  } catch {
    return { error: NextResponse.json({ error: "Envie JSON válido." }, { status: 400 }) };
  }
}

export async function readRevisionRequest(request: Request): Promise<
  { error: NextResponse } | { payload: z.infer<typeof revisionRequestSchema> }
> {
  const body = await readJson(request);
  if (body.error) return { error: body.error };
  const parsed = revisionRequestSchema.safeParse(body.payload);
  if (!parsed.success) {
    return { error: NextResponse.json({ error: "A solicitação de revisão não corresponde ao formato permitido." }, { status: 400 }) };
  }
  return { payload: parsed.data };
}

export async function readApprovalRequest(request: Request): Promise<
  { error: NextResponse } | { payload: z.infer<typeof approvalRequestSchema> }
> {
  const body = await readJson(request);
  if (body.error) return { error: body.error };
  const parsed = approvalRequestSchema.safeParse(body.payload);
  if (!parsed.success) {
    return { error: NextResponse.json({ error: "Confirme a aprovação imutável da revisão." }, { status: 400 }) };
  }
  return { payload: parsed.data };
}

export function artDirectorErrorResponse(error: unknown) {
  if (error instanceof ArtDirectorServiceError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
  }
  return NextResponse.json({ error: "Não foi possível concluir a direção de arte local." }, { status: 500 });
}
