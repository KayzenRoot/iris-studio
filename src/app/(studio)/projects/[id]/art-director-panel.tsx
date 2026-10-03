"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";

import type { ArtDirectionOutput } from "@/server/art-director/schemas";
import type { PublicArtDirectionApproval, PublicArtDirectionRevision } from "@/server/art-director/service";

interface ArtDirectionState {
  revisions: PublicArtDirectionRevision[];
  approval: PublicArtDirectionApproval | null;
}

const modeLabels = { STANDARD: "STANDARD", PREMIUM: "PREMIUM", ABSURD: "ABSURD" } as const;
const strategyLabels: Record<string, string> = {
  HTML_CSS: "HTML / CSS",
  STILL_IMAGE: "Imagem estática",
  SHORT_LOOP: "Loop curto",
  SHADER_CANVAS: "Shader / canvas",
  REALTIME_3D: "3D em tempo real",
};
const statusLabels: Record<PublicArtDirectionRevision["status"], string> = {
  GENERATING: "EM DIREÇÃO",
  DRAFT: "EM REVISÃO",
  APPROVED: "APROVADA · IMUTÁVEL",
  FAILED: "FALHOU",
};

function outputOf(revision: PublicArtDirectionRevision): ArtDirectionOutput | null {
  return revision.output as ArtDirectionOutput | null;
}

export function ArtDirectorPanel({ projectId, initial }: { projectId: string; initial: ArtDirectionState }) {
  const [state, setState] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [revisionTarget, setRevisionTarget] = useState<string | null>(null);
  const [revisionRequest, setRevisionRequest] = useState("");
  const [approvalConfirm, setApprovalConfirm] = useState<string | null>(null);
  const activeRevision = state.revisions.find((revision) => revision.status === "GENERATING");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/projects/" + projectId + "/art-direction/revisions", { cache: "no-store" });
      if (!response.ok) return;
      setState(await response.json() as ArtDirectionState);
    } catch {
      setError("Não foi possível atualizar as revisões salvas neste dispositivo.");
    }
  }, [projectId]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  useEffect(() => {
    if (!activeRevision) return;
    const timer = window.setTimeout(() => {
      void fetch("/api/projects/" + projectId + "/art-direction/revisions/" + activeRevision.id + "/advance", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      }).then(async (response) => {
        const data = await response.json() as { revision?: PublicArtDirectionRevision; error?: string };
        if (!response.ok || !data.revision) {
          setError(data.error ?? "Não foi possível atualizar a direção em andamento.");
          return;
        }
        setState((current) => ({
          ...current,
          revisions: current.revisions.map((revision) => revision.id === data.revision!.id ? data.revision! : revision),
        }));
      }).catch(() => setError("Não foi possível atualizar a direção em andamento."));
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [activeRevision, projectId]);

  async function generate() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/projects/" + projectId + "/art-direction/revisions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      const data = await response.json() as { revision?: PublicArtDirectionRevision; error?: string };
      if (!response.ok || !data.revision) throw new Error(data.error ?? "Não foi possível iniciar a direção de arte.");
      setState((current) => ({ ...current, revisions: [data.revision!, ...current.revisions] }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível iniciar a direção de arte.");
    } finally {
      setBusy(false);
    }
  }

  async function requestRevision(event: FormEvent<HTMLFormElement>, parentRevisionId: string) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/projects/" + projectId + "/art-direction/revisions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ parentRevisionId, revisionRequest }),
      });
      const data = await response.json() as { revision?: PublicArtDirectionRevision; error?: string };
      if (!response.ok || !data.revision) throw new Error(data.error ?? "Não foi possível criar uma nova revisão.");
      setState((current) => ({ ...current, revisions: [data.revision!, ...current.revisions] }));
      setRevisionTarget(null);
      setRevisionRequest("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível criar uma nova revisão.");
    } finally {
      setBusy(false);
    }
  }

  async function approve(revisionId: string) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/projects/" + projectId + "/art-direction/revisions/" + revisionId + "/approve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirmImmutableApproval: true }),
      });
      const data = await response.json() as {
        approval?: PublicArtDirectionApproval;
        revision?: PublicArtDirectionRevision;
        error?: string;
      };
      if (!response.ok || !data.approval || !data.revision) throw new Error(data.error ?? "Não foi possível aprovar esta revisão.");
      setState((current) => ({
        approval: data.approval!,
        revisions: current.revisions.map((revision) => revision.id === data.revision!.id ? data.revision! : revision),
      }));
      setApprovalConfirm(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível aprovar esta revisão.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="art-director-panel" aria-labelledby="art-director-title">
      <div className="art-director-header">
        <div>
          <p className="eyebrow">M03 · PLANEJAMENTO VISUAL</p>
          <h2 id="art-director-title">Senior Art Director</h2>
          <p>Uma tese visual conectada a cada página, seção, meio e fallback. A direção fica neste dispositivo e passa por revisão humana.</p>
        </div>
        <span className="art-director-version"><span /> VISUAL DNA · SITE BLUEPRINT</span>
      </div>
      <div className="art-director-start">
        <div><strong>Primeiro, direção. Depois, sua decisão.</strong><p>O Codex Bridge transforma o briefing em um plano estruturado. Nada de mídia final ou código de website será gerado nesta etapa.</p></div>
        <button className="button button-primary" type="button" disabled={busy || Boolean(activeRevision)} onClick={() => void generate()}>
          {busy ? "Preparando…" : activeRevision ? "Direção em andamento…" : state.revisions.length ? "Criar nova direção" : "Gerar direção visual"}
          <span aria-hidden="true">↗</span>
        </button>
      </div>

      {state.approval && <div className="art-director-approved-reference" role="status">
        <span className="art-director-approved-mark">✓</span>
        <div><strong>Versão aprovada · revisão {state.approval.revision}</strong><p>Referência imutável salva em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(state.approval.approvedAt))}.</p></div>
      </div>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {state.revisions.length === 0
        ? <p className="art-director-empty">A direção começa com uma tese própria, regras visuais e decisões explícitas para todas as páginas do briefing.</p>
        : <div className="art-director-revisions">
          {state.revisions.map((revision) => {
            const output = outputOf(revision);
            return <article className="art-direction-revision" key={revision.id}>
              <header className="art-direction-revision-heading">
                <div><p className="eyebrow">REVISÃO {String(revision.revision).padStart(2, "0")} · PROMPT {revision.promptVersion}</p><h3>{output?.visualDNA.concept.title ?? "Direção em preparação"}</h3></div>
                <span className={"art-direction-status " + revision.status.toLowerCase()}>{statusLabels[revision.status]}</span>
              </header>
              {revision.status === "GENERATING" && <div className="art-director-progress" role="status"><span className="art-director-progress-mark">✳</span><div><strong>Relacionando brief, linguagem visual e páginas</strong><p>O Codex Bridge está montando uma proposta estruturada, sem gerar mídia ou código.</p></div></div>}
              {revision.status === "FAILED" && <p className="art-direction-error" role="alert">Não foi possível validar esta direção. Código: {revision.errorCode ?? "ART_DIRECTION_FAILED"}. Uma nova tentativa começa como outra revisão.</p>}
              {output && <>
                <section className="art-dna-thesis">
                  <div><span>TESE CRIATIVA</span><p>{output.visualDNA.concept.creativeThesis}</p></div>
                  <div className="art-dna-motif"><small>MOTIVO ASSINATURA</small><strong>{output.visualDNA.concept.signatureMotif.name}</strong><p>{output.visualDNA.concept.signatureMotif.visualRule}</p></div>
                </section>
                <div className="art-dna-grid">
                  <section className="art-dna-block"><p className="eyebrow">PERSONALIDADE EM FORMA</p><ul className="art-personality-list">{output.visualDNA.brandPersonality.map((item) => <li key={item.trait}><strong>{item.trait}</strong><span>{item.visualImplication}</span></li>)}</ul></section>
                  <section className="art-dna-block"><p className="eyebrow">PALETA POR FUNÇÃO</p><ul className="art-palette-list">{output.visualDNA.palette.map((color) => <li key={color.role}><span className="art-palette-swatch" style={{ backgroundColor: color.hex }} /><span><strong>{color.role} · {color.name}</strong><small>{color.hex} — {color.usage}</small></span></li>)}</ul></section>
                  <section className="art-dna-block"><p className="eyebrow">TIPOGRAFIA E COMPOSIÇÃO</p><p><strong>Display:</strong> {output.visualDNA.typography.displayDirection}</p><p><strong>Leitura:</strong> {output.visualDNA.typography.readingDirection}</p><p><strong>Ritmo:</strong> {output.visualDNA.composition.spatialRhythm}</p></section>
                  <section className="art-dna-block"><p className="eyebrow">MATERIAL, FORMA E LUZ</p><p>{output.visualDNA.materialLanguage.map((item) => item.material + " — " + item.role).join(" ")}</p><p>{output.visualDNA.geometryLanguage.map((item) => item.form + " — " + item.meaning).join(" ")}</p><p>{output.visualDNA.lightingAndDepth.atmosphere}</p></section>
                  <section className="art-dna-block"><p className="eyebrow">ACESSIBILIDADE E PERFORMANCE</p><p>{output.visualDNA.accessibility.contrast}</p><p>{output.visualDNA.performance.posture}</p><p>{output.visualDNA.motion.reducedMotionBehavior}</p></section>
                  <section className="art-dna-block"><p className="eyebrow">REGRAS CONTRA O GENÉRICO</p><ul className="art-negative-list">{output.visualDNA.antiGenericConstraints.map((item) => <li key={item.patternId}><strong>{item.patternId}</strong><span>{item.prohibition}</span></li>)}</ul></section>
                </div>
                <section className="art-blueprint">
                  <div className="art-blueprint-heading"><div><p className="eyebrow">SITE BLUEPRINT · {output.siteBlueprint.pages.length} PÁGINAS</p><h4>{output.siteBlueprint.crossPageNarrative}</h4></div><span className="quality-chip"><span />{modeLabels[revision.qualityMode]}</span></div>
                  {output.siteBlueprint.pages.map((page, pageIndex) => <article className="art-blueprint-page" key={page.pageId}>
                    <header><span>{String(pageIndex + 1).padStart(2, "0")}</span><div><h5>{page.name}</h5><p>{page.purpose}</p></div><strong>{page.primaryUserAction}</strong></header>
                    <ol className="art-blueprint-sections">{page.sections.map((section) => <li key={section.id}>
                      <div className="art-section-title"><strong>{section.title}</strong><span>{strategyLabels[section.media.strategy]}</span></div>
                      <p>{section.contentIntent}</p><p className="art-section-role">{section.visualRole}</p>
                      <p className="art-section-budget">Carregamento {section.media.loadTiming.toLowerCase().replaceAll("_", " ")} · custo {section.media.runtimeCost.toLowerCase()} · {section.media.estimatedPayloadKB} KB estimados · sensibilidade {section.performanceSensitivity.toLowerCase()}</p>
                      <dl><div><dt>Por que este meio</dt><dd>{section.media.impactRationale}</dd></div><div><dt>Fallback mais leve</dt><dd>{strategyLabels[section.media.fallbackStrategy]} · {section.media.fallbackRationale}</dd></div><div><dt>Interação</dt><dd>{section.interactionIntent}</dd></div><div><dt>Mobile</dt><dd>{section.mobileTreatment}</dd></div><div><dt>Reduced motion</dt><dd>{section.reducedMotionTreatment}</dd></div></dl>
                      {section.downstreamAssets.length > 0 && <p className="art-section-assets"><strong>Assets downstream:</strong> {section.downstreamAssets.map((asset) => asset.kind + " — " + asset.intent).join(" · ")}</p>}
                    </li>)}</ol>
                  </article>)}
                  <p className="art-performance-summary">{output.siteBlueprint.performance.degradationRule}</p>
                </section>
                {(output.siteBlueprint.assumptions.length > 0 || output.siteBlueprint.decisionNeeds.length > 0) && <section className="art-open-decisions"><p className="eyebrow">SUPOSIÇÕES PARA SUA REVISÃO</p>{[...output.siteBlueprint.assumptions, ...output.siteBlueprint.decisionNeeds].map((item, index) => <p key={item.topic + index}><strong>{item.topic}:</strong> {item.statement} <span>{item.question}</span></p>)}</section>}
                <div className="art-direction-actions">
                  {revision.status === "DRAFT" && <>
                    <div className="art-approval-control">
                      <label><input type="checkbox" checked={approvalConfirm === revision.id} onChange={(event) => setApprovalConfirm(event.target.checked ? revision.id : null)} /> Revisei esta direção e quero salvar a revisão {revision.revision} como imutável.</label>
                      <button className="button button-primary" type="button" disabled={busy || approvalConfirm !== revision.id} onClick={() => void approve(revision.id)}>Aprovar esta revisão</button>
                    </div>
                  </>}
                  {revision.status !== "GENERATING" && <div>
                    {revisionTarget === revision.id
                      ? <form className="art-revision-request" onSubmit={(event) => void requestRevision(event, revision.id)}>
                        <label className="field"><span>O que deve mudar nesta nova versão?</span><textarea value={revisionRequest} onChange={(event) => setRevisionRequest(event.target.value)} required minLength={10} maxLength={1200} rows={3} placeholder="Descreva a decisão visual a revisar e o motivo." /></label>
                        <div><button className="button button-secondary" type="button" disabled={busy} onClick={() => { setRevisionTarget(null); setRevisionRequest(""); }}>Cancelar</button><button className="button button-primary" type="submit" disabled={busy || revisionRequest.trim().length < 10}>{busy ? "Criando revisão…" : "Criar nova revisão"}</button></div>
                      </form>
                      : <button className="button button-secondary" type="button" disabled={busy || Boolean(activeRevision)} onClick={() => setRevisionTarget(revision.id)}>Solicitar uma revisão</button>}
                  </div>}
                </div>
              </>}
            </article>;
          })}
        </div>}
      <p className="art-director-footer">Aprovar salva apenas esta direção. Nenhuma etapa M04 é iniciada automaticamente.</p>
    </section>
  );
}
