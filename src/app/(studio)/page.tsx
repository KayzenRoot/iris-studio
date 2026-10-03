import Link from "next/link";

import { ProjectCard } from "../components/project-card";
import { PageHeading } from "../components/page-heading";
import { getAppStore } from "@/server/runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function DashboardPage() {
  const projects = getAppStore().listProjects();
  const recentProjects = projects.slice(0, 3);
  const drafts = projects.filter((project) => project.status === "DRAFT").length;

  return (
    <>
      <PageHeading eyebrow="VISÃO GERAL · SEU ESTÚDIO" title="Ideias que ganham forma." description="Um espaço local para conduzir cada site do primeiro briefing até a entrega." action={<Link className="button button-primary" href="/projects/new">Novo projeto <span aria-hidden="true">↗</span></Link>} />

      <section className="welcome-panel">
        <div className="welcome-copy"><span className="welcome-tag"><span /> SEU ESTÚDIO, NO SEU RITMO</span><h2>Comece com uma boa ideia.<br /><em>O resto, construímos juntos.</em></h2><p>Organize o briefing, reúna as referências e deixe seu processo criativo pronto para o próximo passo.</p><Link href="/projects/new" className="text-link">Criar meu primeiro projeto <span aria-hidden="true">→</span></Link></div>
        <div className="welcome-art" aria-hidden="true"><div className="art-frame"><span className="sun-shape" /><span className="landscape-shape" /><span className="landscape-shadow" /><span className="art-caption">FIG. 01 <i>—</i> FORM IN MOTION</span></div><span className="art-sparkle sparkle-one">✳</span><span className="art-sparkle sparkle-two">✳</span><span className="art-coordinate">23°33′ S<br />46°38′ W</span></div>
      </section>

      <section className="overview-stats" aria-label="Resumo do workspace">
        <article className="stat-card"><span className="stat-icon stat-icon-green">◈</span><div><p>Projetos no estúdio</p><strong>{projects.length.toString().padStart(2, "0")}</strong></div><span className="stat-note">NO SEU WORKSPACE</span></article>
        <article className="stat-card"><span className="stat-icon stat-icon-sand">◌</span><div><p>Em rascunho</p><strong>{drafts.toString().padStart(2, "0")}</strong></div><span className="stat-note">PRONTOS PARA EVOLUIR</span></article>
        <article className="stat-card local-stat"><span className="stat-icon stat-icon-dark">⌂</span><div><p>Ambiente</p><strong>Local</strong></div><span className="stat-note"><span className="local-pulse" /> DADOS NESTE DISPOSITIVO</span></article>
      </section>

      <section className="section-block">
        <div className="section-heading"><div><p className="eyebrow">EM MOVIMENTO</p><h2>Projetos recentes</h2></div><Link href="/projects" className="subtle-link">Ver todos <span aria-hidden="true">→</span></Link></div>
        {recentProjects.length > 0 ? <div className="project-grid">{recentProjects.map((project) => <ProjectCard key={project.id} project={project} />)}</div> : (
          <div className="empty-state"><div className="empty-art" aria-hidden="true"><span /><span /><span /></div><div><h3>Seu próximo projeto começa aqui.</h3><p>Crie um briefing local e dê o primeiro passo na direção do site que você imaginou.</p></div><Link className="button button-secondary" href="/projects/new">Criar projeto <span aria-hidden="true">↗</span></Link></div>
        )}
      </section>

      <section className="next-step-panel"><div className="next-step-icon" aria-hidden="true">✳</div><div><p className="eyebrow">PRÓXIMO PASSO</p><h2>Primeiro, uma direção clara.</h2><p>O IRIS guarda o briefing e o workspace do seu projeto. As integrações criativas serão habilitadas em módulos futuros, com transparência sobre o que está disponível.</p></div><Link className="subtle-link" href="/system-health">Ver saúde do sistema <span aria-hidden="true">→</span></Link></section>
    </>
  );
}
