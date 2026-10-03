import Link from "next/link";
import type { ProjectRecord } from "@/server/db/store";

const qualityLabels = {
  STANDARD: "Standard",
  PREMIUM: "Premium",
  ABSURD: "Absurd",
} as const;

export function ProjectCard({ project }: { project: ProjectRecord }) {
  return (
    <Link href={`/projects/${project.id}`} className="project-card">
      <div className="project-card-art" aria-hidden="true"><span className="art-orbit orbit-one" /><span className="art-orbit orbit-two" /><span className="art-disc" /><span className="art-line" /></div>
      <div className="project-card-body">
        <div className="project-card-heading"><div><h3>{project.name}</h3><p>{project.brief.siteType.replaceAll("-", " ")}</p></div><span className="project-status">{project.status === "DRAFT" ? "RASCUNHO" : project.status}</span></div>
        <p className="project-card-summary">{project.brief.description}</p>
        <div className="project-card-meta"><span className="quality-chip"><span />{qualityLabels[project.brief.qualityMode]}</span><span>{project.brief.pages.length} {project.brief.pages.length === 1 ? "página" : "páginas"}</span><span className="card-arrow" aria-hidden="true">↗</span></div>
      </div>
    </Link>
  );
}
