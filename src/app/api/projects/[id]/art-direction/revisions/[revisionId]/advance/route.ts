import { NextResponse } from "next/server";

import { artDirectorErrorResponse } from "@/server/art-director/http";
import { hasSameOriginLoopbackRequest } from "@/server/codex/http";
import { getArtDirectorService } from "@/server/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string; revisionId: string }> }) {
  if (!hasSameOriginLoopbackRequest(request)) {
    return NextResponse.json({ error: "A operação exige origem local e da mesma origem." }, { status: 403 });
  }
  const { id, revisionId } = await params;
  try {
    const revision = await getArtDirectorService().advance(id, revisionId);
    return NextResponse.json({ revision });
  } catch (error) {
    return artDirectorErrorResponse(error);
  }
}
