import { existsSync, realpathSync } from "node:fs";
import { basename, dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { z } from "zod";

const projectIdSchema = z.uuid();

export function isPathInside(parent: string, candidate: string) {
  const root = canonicalize(parent);
  const target = canonicalize(candidate);
  const pathFromRoot = relative(root, target);
  return pathFromRoot === "" || (pathFromRoot !== ".." && !pathFromRoot.startsWith(`..${sep}`) && !isAbsolute(pathFromRoot));
}

function canonicalize(candidate: string) {
  let existingAncestor = resolve(candidate);
  const remainder: string[] = [];
  while (!existsSync(existingAncestor)) {
    const parent = dirname(existingAncestor);
    if (parent === existingAncestor) return resolve(candidate);
    remainder.unshift(basename(existingAncestor));
    existingAncestor = parent;
  }
  return resolve(realpathSync.native(existingAncestor), ...remainder);
}

export function assertOutsideSourceRepository(candidate: string, repositoryRoot: string) {
  if (!isAbsolute(candidate) || !isAbsolute(repositoryRoot)) {
    throw new Error("Os caminhos de dados e do source repository devem ser absolutos.");
  }
  if (isPathInside(repositoryRoot, candidate)) {
    throw new Error("Dados e workspaces devem ficar fora do source repository.");
  }
}

export function resolveProjectWorkspacePath(projectsDirectory: string, projectId: string) {
  if (!projectIdSchema.safeParse(projectId).success) {
    throw new Error("Workspace identifier deve ser um UUID válido.");
  }

  const workspacePath = resolve(projectsDirectory, projectId);
  if (!isPathInside(projectsDirectory, workspacePath) || workspacePath === resolve(projectsDirectory)) {
    throw new Error("Workspace identifier escaparia do diretório de projetos.");
  }
  return workspacePath;
}
