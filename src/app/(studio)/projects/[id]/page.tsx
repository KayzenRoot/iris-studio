import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeading } from "../../../components/page-heading";
import { CodexPanel } from "./codex-panel";
import { getAppStore } from "@/server/runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const qualityLabels = { STANDARD: "Standard", PREMIUM: "Premium", ABSURD: "Absurd" } as const;

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getAppStore().getProject(id);
  if (!project) notFound();

  return (
    <>
      <div className="detail-back"><Link href="/projects">← Todos os projetos</Link><span>/</span><span>{project.name}</span></div>
      <PageHeading eyebrow="PROJETO · BRIEFING LOCAL" title={project.name} description={project.brief.description} action={<span className="project-status detail-status">{project.status === "DRAFT" ? "RASCUNHO" : project.status}</span>} />
      <div className="detail-layout">
        <section className="detail-main-card">
          <div className="detail-card-heading"><div><p className="eyebrow">DIREÇÃO INICIAL</p><h2>O briefing</h2></div><span className="quality-chip"><span />{qualityLabels[project.brief.qualityMode]}</span></div>
          <div className="brief-grid">
            <div className="brief-item"><span>Tipo de site</span><strong>{project.brief.siteType.replaceAll("-", " ")}</strong></div>
            <div className="brief-item"><span>Tom de voz</span><strong>{project.brief.tone}</strong></div>
            <div className="brief-item brief-wide"><span>Páginas desejadas</span><strong>{project.brief.pages.join(", ")}</strong></div>
            <div className="brief-item brief-wide"><span>Referências</span><strong>{project.brief.references.length ? project.brief.references.join(" · ") : "Nenhuma referência adicionada"}</strong></div>
            <div className="brief-item"><span>Direção visual</span><strong>{project.brief.mediaDirection}</strong></div>
            <div className="brief-item"><span>Direção de movimento</span><strong>{project.brief.motionDirection}</strong></div>
          </div>
          <div className="palette-row"><span>Paleta inicial</span><div className="palette-swatches">{project.brief.colors.map((color) => <span key={color} className="palette-swatch" style={{ backgroundColor: color }} title={color} />)}</div><strong>{project.brief.colors.join(" · ")}</strong></div>
        </section>
        <aside className="detail-side-card"><p className="eyebrow">WORKSPACE</p><div className="workspace-illustration" aria-hidden="true"><span className="folder-back" /><span className="folder-front" /><span className="folder-spark">✳</span></div><h2>Seu espaço está isolado.</h2><p>Tarefas Codex deste projeto usam este workspace local, com proteção contra caminhos externos e links simbólicos.</p><div className="workspace-meta"><span>CRIADO EM</span><strong>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(project.createdAt))}</strong></div><Link href="/system-health" className="subtle-link">Ver System Health <span aria-hidden="true">→</span></Link></aside>
      </div>
      <CodexPanel projectId={project.id} />
    </>
  );
}
