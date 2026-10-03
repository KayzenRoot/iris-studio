import { existsSync, lstatSync, realpathSync, readdirSync } from "node:fs";
import { basename, dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { z } from "zod";

const projectIdSchema = z.uuid();

export function isPathInside(parent: string, candidate: string) {
  const root = canonicalize(parent);
  const target = canonicalize(candidate);
  const pathFromRoot = relative(root, target);
  return pathFromRoot === "" || (pathFromRoot !== ".." && !pathFromRoot.startsWith(`..${sep}`) && !isAbsolute(pathFromRoot));
}

export function samePath(left: string, right: string) {
  const normalizedLeft = resolve(left);
  const normalizedRight = resolve(right);
  return process.platform === "win32"
    ? normalizedLeft.toLowerCase() === normalizedRight.toLowerCase()
    : normalizedLeft === normalizedRight;
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
  rejectLink(resolve(projectsDirectory), "diretório de projetos");
  rejectLink(workspacePath, "workspace do projeto");
  return workspacePath;
}

function rejectLink(path: string, description: string) {
  try {
    if (lstatSync(path).isSymbolicLink()) {
      throw new Error(`O ${description} não pode ser symlink ou junction.`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("não pode ser symlink")) throw error;
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

export function assertWorkspaceTreeSafe(workspacePath: string, repositoryRoot: string) {
  const canonicalWorkspace = realpathSync.native(workspacePath);
  const canonicalRepository = realpathSync.native(repositoryRoot);
  if (!samePath(canonicalWorkspace, workspacePath)) throw new Error("WORKSPACE_NONCANONICAL");
  if (isPathInside(canonicalRepository, canonicalWorkspace)) throw new Error("WORKSPACE_IN_REPOSITORY");

  const pending = [canonicalWorkspace];
  let visited = 0;
  while (pending.length) {
    const directory = pending.pop()!;
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      visited += 1;
      if (visited > 10000) throw new Error("O workspace excede o limite de inspeção segura.");
      const child = resolve(directory, entry.name);
      if (!isPathInside(canonicalWorkspace, child) || child === canonicalWorkspace) {
        throw new Error("WORKSPACE_ENTRY_ESCAPE");
      }
      const metadata = lstatSync(child);
      if (metadata.isSymbolicLink()) throw new Error("WORKSPACE_LINK");
      if (metadata.isDirectory()) pending.push(child);
    }
  }
}
