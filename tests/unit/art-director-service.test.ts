import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";

import type { CodexExecutionService } from "../../src/server/codex/service";
import { ArtDirectorService, ArtDirectorServiceError } from "../../src/server/art-director/service";
import { openIrisStore, type IrisStore, type ProjectBrief } from "../../src/server/db/store";
import { artDirectorGoldenCases } from "../fixtures/art-director/golden-cases";
import { makeGoldenArtDirection } from "../fixtures/art-director/output";

type PublicRun = ReturnType<CodexExecutionService["get"]>;
type PublicStart = Awaited<ReturnType<CodexExecutionService["start"]>>;

const roots: string[] = [];
const stores: ReturnType<typeof openIrisStore>[] = [];

function publicRun(id: string, generationRunId: string, status: PublicRun["status"]): PublicRun {
  const active = status === "RUNNING" || status === "CANCELLING";
  return {
    id,
    generationRunId,
    schemaVersion: 1,
    status,
    cliVersion: "0.160.0",
    exitCode: active ? null : status === "SUCCEEDED" ? 0 : 1,
    retryClass: status === "SUCCEEDED" ? "NONE" : active ? "NONE" : "MANUAL_REVIEW",
    errorCode: null,
    stdout: "",
    stderr: "",
    result: null,
    createdAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
    finishedAt: active ? null : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

class FakeApprovedBridge implements Pick<CodexExecutionService, "start" | "get"> {
  readonly prompts: string[] = [];
  private readonly outputs: Array<unknown | string>;
  private readonly runs = new Map<string, PublicRun>();
  private readonly workspaces = new Map<string, string>();
  private readonly store: IrisStore;

  constructor(store: IrisStore, outputs: Array<unknown | string>) {
    this.store = store;
    this.outputs = [...outputs];
  }

  registerWorkspace(projectId: string, workspace: string) {
    this.workspaces.set(projectId, workspace);
  }

  async start(projectId: string, prompt: string): Promise<PublicStart> {
    this.prompts.push(prompt);
    const match = /Crie exatamente o arquivo ([A-Za-z0-9.-]+) diretamente na raiz do workspace atual/.exec(prompt);
    const workspace = this.workspaces.get(projectId);
    if (!match || !workspace) throw new Error("Fixture não recebeu uma tarefa válida do Codex Bridge.");
    const output = this.outputs.shift();
    if (output === undefined) throw new Error("Fixture não possui saída para esta tentativa.");
    writeFileSync(join(workspace, match[1]!), typeof output === "string" ? output : JSON.stringify(output), { flag: "wx", mode: 0o600 });
    const record = this.store.createCodexRun({ projectId, workspacePath: workspace, cliVersion: "0.160.0" });
    const run = publicRun(record.id, record.generationRunId, "RUNNING");
    this.runs.set(run.id, run);
    return run;
  }

  get(_projectId: string, runId: string): PublicRun {
    const run = this.runs.get(runId);
    if (!run) throw new Error("Execução não encontrada.");
    return run;
  }

  completeAll() {
    for (const [id, run] of this.runs) {
      this.store.updateCodexRun(id, {
        status: "SUCCEEDED",
        exitCode: 0,
        retryClass: "NONE",
        resultJson: JSON.stringify({ schemaVersion: 1, status: "SUCCEEDED", exitCode: 0 }),
        finishedAt: new Date().toISOString(),
      });
      this.runs.set(id, publicRun(id, run.generationRunId, "SUCCEEDED"));
    }
  }

  get runCount() {
    return this.runs.size;
  }
}

function setup(outputs: Array<unknown | string>, brief: ProjectBrief = artDirectorGoldenCases[1]!.brief) {
  const root = mkdtempSync(join(tmpdir(), "iris-art-director-service-"));
  roots.push(root);
  const dataDirectory = join(root, "data");
  const projectsDirectory = join(dataDirectory, "projects");
  const options = {
    databasePath: join(dataDirectory, "iris-studio.sqlite"),
    projectsDirectory,
    repositoryRoot: process.cwd(),
  };
  const store = openIrisStore(options);
  stores.push(store);
  const project = store.createProject({ name: "Art Director test", brief });
  const bridge = new FakeApprovedBridge(store, outputs);
  bridge.registerWorkspace(project.id, project.workspacePath);
  const service = new ArtDirectorService({
    store,
    codex: bridge,
    projectsDirectory,
    repositoryRoot: process.cwd(),
  });
  return { root, options, store, project, bridge, service };
}

afterEach(() => {
  for (const store of stores.splice(0)) store.close();
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("M03 revision flow through the approved Codex Bridge port", () => {
  it("creates a machine-valid DRAFT, passes only file references to the Bridge and removes temporary files", async () => {
    const example = artDirectorGoldenCases[1]!;
    const { project, bridge, service } = setup([makeGoldenArtDirection(example.brief)], example.brief);
    const revision = await service.generate(project.id);
    expect(revision.status).toBe("GENERATING");
    expect(bridge.prompts).toHaveLength(1);
    expect(bridge.prompts[0]).toContain("iris-art-director-");
    expect(bridge.prompts[0]).not.toContain(example.brief.references[0]!);
    expect(bridge.prompts[0]).not.toContain("plataforma");
    const contractName = readdirSync(project.workspacePath).find((name) => name.endsWith("-contract.json"));
    expect(contractName).toBeDefined();
    const contract = readFileSync(join(project.workspacePath, contractName!), "utf8");
    expect(contract).toContain('"minItems": 3');
    expect(contract).toContain('"minimum": 1');
    expect(contract).toContain('"maxItems": 12');
    expect(contract).toContain('"maximum": 4');

    const stillRunning = await service.advance(project.id, revision.id);
    expect(stillRunning.status).toBe("GENERATING");
    bridge.completeAll();
    const draft = await service.advance(project.id, revision.id);
    expect(draft.status).toBe("DRAFT");
    expect(draft.output).toMatchObject({
      visualDNA: { qualityMode: "PREMIUM", concept: { title: "Cartografia de gestos materiais" } },
      siteBlueprint: { pages: [{ name: "Atelier" }, { name: "Obras" }, { name: "Caderno" }] },
    });
    expect(readdirSync(project.workspacePath)).toEqual([]);
  });

  it("allows one diagnostic retry for invalid schema output and fails visibly after the second invalid result", async () => {
    const brief = artDirectorGoldenCases[0]!.brief;
    const { project, bridge, service } = setup(["not json", makeGoldenArtDirection(brief)], brief);
    const revision = await service.generate(project.id);
    bridge.completeAll();
    const retry = await service.advance(project.id, revision.id);
    expect(retry.status, JSON.stringify(retry)).toBe("GENERATING");
    expect(retry.attemptsUsed).toBe(2);
    expect(bridge.runCount).toBe(2);
    expect(bridge.prompts[1]).toContain("tentativa anterior falhou");
    expect(bridge.prompts[1]).not.toContain("Ignore all");
    bridge.completeAll();
    const draft = await service.advance(project.id, revision.id);
    expect(draft.status).toBe("DRAFT");
    expect(draft.attemptsUsed).toBe(2);
    expect(readdirSync(project.workspacePath)).toEqual([]);

    const second = setup(["not json", "still not json"], brief);
    const secondRevision = await second.service.generate(second.project.id);
    second.bridge.completeAll();
    await second.service.advance(second.project.id, secondRevision.id);
    second.bridge.completeAll();
    const failed = await second.service.advance(second.project.id, secondRevision.id);
    expect(failed.status).toBe("FAILED");
    expect(failed.errorCode).toBe("INVALID_OUTPUT_AFTER_DIAGNOSTIC_RETRY");
    expect(second.bridge.runCount).toBe(2);
    expect(readdirSync(second.project.workspacePath)).toEqual([]);
  });

  it("stores an explicit approval as an immutable reference and reopens the exact canonical snapshot", async () => {
    const brief = artDirectorGoldenCases[2]!.brief;
    const context = setup([makeGoldenArtDirection(brief)], brief);
    const revision = await context.service.generate(context.project.id);
    context.bridge.completeAll();
    const draft = await context.service.advance(context.project.id, revision.id);
    expect(draft.status).toBe("DRAFT");
    const canonicalSnapshot = draft.canonicalSnapshot;
    expect(canonicalSnapshot).toBeTruthy();

    expect(() => context.service.approve(context.project.id, revision.id, false))
      .toThrowError(ArtDirectorServiceError);
    const approval = context.service.approve(context.project.id, revision.id, true);
    expect(approval.canonicalSnapshot).toBe(canonicalSnapshot);
    expect(context.store.getArtDirectionRevision(context.project.id, revision.id)?.status).toBe("APPROVED");

    const database = new Database(context.options.databasePath);
    try {
      expect(() => database.prepare("UPDATE art_direction_revisions SET snapshot_json = '{}' WHERE id = ?").run(revision.id))
        .toThrow(/immutable/i);
      expect(() => database.prepare(
        "INSERT INTO art_direction_approvals (id, project_id, revision_id, snapshot_json, approved_at) VALUES (?, ?, ?, ?, ?)",
      ).run("00000000-0000-4000-8000-000000000020", context.project.id, revision.id, "{}", approval.approvedAt))
        .toThrow(/exact approved revision snapshot/i);
      expect(() => database.prepare("DELETE FROM art_direction_approvals WHERE revision_id = ?").run(revision.id))
        .toThrow(/append-only/i);
    } finally {
      database.close();
    }

    context.store.close();
    const reopenedStore = openIrisStore(context.options);
    stores.push(reopenedStore);
    const reopenedService = new ArtDirectorService({
      store: reopenedStore,
      codex: context.bridge,
      projectsDirectory: context.options.projectsDirectory,
      repositoryRoot: process.cwd(),
    });
    const reopened = reopenedService.list(context.project.id);
    expect(reopened.approval?.canonicalSnapshot).toBe(canonicalSnapshot);
    expect(reopened.revisions[0]?.canonicalSnapshot).toBe(canonicalSnapshot);
    expect(existsSync(context.project.workspacePath)).toBe(true);
  });

  it("creates a new revision after approval without changing the approved snapshot", async () => {
    const brief = artDirectorGoldenCases[1]!.brief;
    const firstOutput = makeGoldenArtDirection(brief);
    const secondOutput = makeGoldenArtDirection(brief);
    secondOutput.visualDNA.concept.title = "Cartografia por camadas";
    const { project, bridge, service, store } = setup([firstOutput, secondOutput], brief);
    const first = await service.generate(project.id);
    bridge.completeAll();
    await service.advance(project.id, first.id);
    const approved = service.approve(project.id, first.id, true);
    const newRevision = await service.generate(project.id, {
      parentRevisionId: first.id,
      revisionRequest: "Aprofunde a relação entre material, escala e evidência.",
    });
    bridge.completeAll();
    const secondDraft = await service.advance(project.id, newRevision.id);
    expect(secondDraft.revision).toBe(2);
    expect(secondDraft.parentRevisionId).toBe(first.id);
    expect(store.getArtDirectionRevision(project.id, first.id)?.snapshotJson).toBe(approved.canonicalSnapshot);
    expect(store.getArtDirectionRevision(project.id, first.id)?.status).toBe("APPROVED");
    expect(bridge.prompts).toHaveLength(2);
    expect(bridge.prompts[1]).not.toContain("Aprofunde a relação");
  });
});
