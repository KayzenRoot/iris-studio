import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { createProjectSchema } from "@/server/db/store";
import { logEvent } from "@/server/logger";
import { getAppStore } from "@/server/runtime";
import { toPublicProject } from "@/server/project-view";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  try {
    const projects = getAppStore().listProjects().map(toPublicProject);
    return NextResponse.json({ projects });
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    logEvent("error", "project_list_failed", { errorName });
    return NextResponse.json({ error: "O armazenamento local não está disponível." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Envie um briefing em JSON válido." }, { status: 400 });
  }

  const parsed = createProjectSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: validationMessage(parsed.error) }, { status: 400 });
  }

  try {
    const project = getAppStore().createProject(parsed.data);
    logEvent("info", "project_created", { projectId: project.id });
    return NextResponse.json({ project: toPublicProject(project) }, { status: 201 });
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    logEvent("error", "project_create_failed", { errorName });
    return NextResponse.json({ error: "Não foi possível criar o projeto no armazenamento local." }, { status: 500 });
  }
}

function validationMessage(error: ZodError) {
  const firstIssue = error.issues[0];
  if (!firstIssue) return "Confira os campos do briefing.";
  const field = firstIssue.path.join(".");
  if (field === "brief.pages") return "Informe entre 1 e 8 páginas para o projeto.";
  if (field === "brief.colors") return "Informe uma ou mais cores HEX no formato #RRGGBB.";
  return "Confira os campos obrigatórios e os limites do briefing.";
}
