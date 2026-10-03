import type { ProjectRecord } from "./db/store";

export function toPublicProject(project: ProjectRecord) {
  return {
    id: project.id,
    name: project.name,
    status: project.status,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    brief: project.brief,
  };
}
