import { NextResponse } from "next/server";

import { getAppStore } from "@/server/runtime";
import { toPublicProject } from "@/server/project-view";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const project = getAppStore().getProject(id);
    if (!project) return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });
    return NextResponse.json({ project: toPublicProject(project) });
  } catch {
    return NextResponse.json({ error: "O armazenamento local não está disponível." }, { status: 500 });
  }
}
