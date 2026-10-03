import { NextResponse } from "next/server";

import { artDirectorErrorResponse, readRevisionRequest } from "@/server/art-director/http";
import { getArtDirectorService } from "@/server/runtime";
import { hasSameOriginLoopbackRequest } from "@/server/codex/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    return NextResponse.json(getArtDirectorService().list(id));
  } catch (error) {
    return artDirectorErrorResponse(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSameOriginLoopbackRequest(request)) {
    return NextResponse.json({ error: "A operação exige origem local e da mesma origem." }, { status: 403 });
  }
  const body = await readRevisionRequest(request);
  if ("error" in body) return body.error;
  const { id } = await params;
  try {
    const revision = await getArtDirectorService().generate(id, body.payload);
    return NextResponse.json({ revision }, { status: 202 });
  } catch (error) {
    return artDirectorErrorResponse(error);
  }
}
