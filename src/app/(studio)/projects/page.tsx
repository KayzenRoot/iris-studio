import Link from "next/link";

import { PageHeading } from "../../components/page-heading";
import { ProjectCard } from "../../components/project-card";
import { getAppStore } from "@/server/runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function ProjectsPage() {
  const projects = getAppStore().listProjects();

  return (
    <>
      <PageHeading eyebrow="WORKSPACE · PROJETOS" title="Uma ideia por vez." description="Briefings, referências e próximos passos de tudo o que você está criando." action={<Link className="button button-primary" href="/projects/new">Novo projeto <span aria-hidden="true">↗</span></Link>} />
      <div className="list-toolbar"><div><span className="toolbar-count">{projects.length.toString().padStart(2, "0")}</span><span>{projects.length === 1 ? "projeto no seu estúdio" : "projetos no seu estúdio"}</span></div><span className="toolbar-filter">TODOS OS PROJETOS <span aria-hidden="true">⌄</span></span></div>
      {projects.length > 0 ? <div className="project-grid project-grid-list">{projects.map((project) => <ProjectCard key={project.id} project={project} />)}</div> : (
        <div className="empty-state projects-empty"><div className="empty-art" aria-hidden="true"><span /><span /><span /></div><div><h3>Nenhum projeto por enquanto.</h3><p>Quando uma ideia chegar, crie o briefing para começar a dar forma a ela.</p></div><Link className="button button-secondary" href="/projects/new">Criar primeiro projeto <span aria-hidden="true">↗</span></Link></div>
      )}
    </>
  );
}
