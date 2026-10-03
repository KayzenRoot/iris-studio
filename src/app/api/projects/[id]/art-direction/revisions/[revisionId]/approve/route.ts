import { NextResponse } from "next/server";

import { artDirectorErrorResponse, readApprovalRequest } from "@/server/art-director/http";
import { hasSameOriginLoopbackRequest } from "@/server/codex/http";
import { getArtDirectorService } from "@/server/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string; revisionId: string }> }) {
  if (!hasSameOriginLoopbackRequest(request)) {
    return NextResponse.json({ error: "A operação exige origem local e da mesma origem." }, { status: 403 });
  }
  const body = await readApprovalRequest(request);
  if ("error" in body) return body.error;
  const { id, revisionId } = await params;
  try {
    const service = getArtDirectorService();
    const approval = service.approve(id, revisionId, body.payload.confirmImmutableApproval);
    return NextResponse.json({ approval, revision: service.get(id, revisionId) });
  } catch (error) {
    return artDirectorErrorResponse(error);
  }
}
