import { NextResponse } from "next/server";

import { codexErrorResponse, hasSameOriginLoopbackRequest, readCodexStartPayload } from "@/server/codex/http";
import { getCodexService } from "@/server/runtime";
import { logEvent } from "@/server/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    return NextResponse.json({ runs: getCodexService().list(id) });
  } catch (error) {
    return codexErrorResponse(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSameOriginLoopbackRequest(request)) {
    return NextResponse.json({ error: "A operação exige origem local e da mesma origem." }, { status: 403 });
  }
  const body = await readCodexStartPayload(request);
  if ("error" in body) return body.error;
  const { id } = await params;
  try {
    const run = await getCodexService().start(id, body.payload.prompt);
    logEvent("info", "codex_run_started", { runId: run.id, projectId: id });
    return NextResponse.json({ run }, { status: 202 });
  } catch (error) {
    const statusCode = error && typeof error === "object" && "statusCode" in error ? Number(error.statusCode) : 500;
    if (statusCode >= 500) logEvent("error", "codex_run_start_failed", { projectId: id });
    return codexErrorResponse(error);
  }
}
