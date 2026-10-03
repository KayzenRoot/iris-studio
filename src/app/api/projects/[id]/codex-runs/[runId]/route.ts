import { NextResponse } from "next/server";

import { codexErrorResponse, hasSameOriginLoopbackRequest } from "@/server/codex/http";
import { getCodexService } from "@/server/runtime";
import { logEvent } from "@/server/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; runId: string }> }) {
  const { id, runId } = await params;
  try {
    return NextResponse.json({ run: getCodexService().get(id, runId) });
  } catch (error) {
    return codexErrorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; runId: string }> }) {
  if (!hasSameOriginLoopbackRequest(request)) {
    return NextResponse.json({ error: "A operação exige origem local e da mesma origem." }, { status: 403 });
  }
  const { id, runId } = await params;
  try {
    const run = await getCodexService().cancel(id, runId);
    logEvent("info", "codex_run_cancelled", { runId, projectId: id });
    return NextResponse.json({ run });
  } catch (error) {
    logEvent("warn", "codex_run_cancel_failed", { runId, projectId: id });
    return codexErrorResponse(error);
  }
}
