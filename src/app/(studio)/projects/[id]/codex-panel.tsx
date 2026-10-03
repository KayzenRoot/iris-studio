"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";

interface CodexRun {
  id: string;
  status: "RUNNING" | "CANCELLING" | "SUCCEEDED" | "FAILED" | "CANCELLED" | "TIMED_OUT" | "INTERRUPTED";
  cliVersion: string;
  exitCode: number | null;
  retryClass: string;
  errorCode: string | null;
  stdout: string;
  stderr: string;
  result: { elapsedMs?: number; completedAt?: string } | null;
  createdAt: string;
  finishedAt: string | null;
}

const activeStatuses = new Set(["RUNNING", "CANCELLING"]);
const statusLabels: Record<CodexRun["status"], string> = {
  RUNNING: "EM EXECUÇÃO",
  CANCELLING: "CANCELANDO",
  SUCCEEDED: "CONCLUÍDA",
  FAILED: "FALHOU",
  CANCELLED: "CANCELADA",
  TIMED_OUT: "TEMPO ESGOTADO",
  INTERRUPTED: "INTERROMPIDA",
};

export function CodexPanel({ projectId }: { projectId: string }) {
  const [runs, setRuns] = useState<CodexRun[]>([]);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const active = runs.find((run) => activeStatuses.has(run.status));

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/codex-runs`, { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json() as { runs: CodexRun[] };
      setRuns(data.runs);
    } catch {
      setError("Não foi possível atualizar o estado das execuções.");
    }
  }, [projectId]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => { void refresh(); }, 1200);
    return () => window.clearInterval(timer);
  }, [active, refresh]);

  async function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/projects/${projectId}/codex-runs`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json() as { run?: CodexRun; error?: string };
      if (!response.ok || !data.run) throw new Error(data.error ?? "Não foi possível iniciar o Codex.");
      setPrompt("");
      setRuns((current) => [data.run!, ...current.filter((run) => run.id !== data.run!.id)]);
      void refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível iniciar o Codex.");
    } finally {
      setBusy(false);
    }
  }

  async function cancel(runId: string) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/projects/${projectId}/codex-runs/${runId}`, { method: "DELETE" });
      const data = await response.json() as { run?: CodexRun; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Não foi possível cancelar a execução.");
      if (data.run) setRuns((current) => current.map((run) => run.id === runId ? data.run! : run));
      void refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível cancelar a execução.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="codex-panel" aria-labelledby="codex-panel-title">
      <div className="codex-panel-heading">
        <div><p className="eyebrow">M02 · EXECUÇÃO LOCAL</p><h2 id="codex-panel-title">Codex Bridge</h2><p>Envie uma tarefa ao Codex CLI autenticado neste dispositivo. A execução fica limitada ao workspace deste projeto.</p></div>
        <span className="codex-local-badge"><span /> SOMENTE LOCAL</span>
      </div>
      <form className="codex-task-form" onSubmit={start}>
        <label className="field"><span>Tarefa para o Codex <small>· até 8 KiB</small></span><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={8192} rows={4} placeholder="Descreva uma tarefa delimitada para este workspace…" disabled={busy || Boolean(active)} required /></label>
        <div className="codex-form-footer"><p>A tarefa não é salva no histórico. O CLI usa a sessão ChatGPT já configurada e grava apenas dentro deste projeto.</p><button className="button button-primary" disabled={busy || Boolean(active) || !prompt.trim()} type="submit">{busy ? "Iniciando…" : "Executar tarefa"}<span aria-hidden="true">↗</span></button></div>
      </form>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="codex-runs-heading"><div><p className="eyebrow">HISTÓRICO LOCAL</p><h3>Execuções recentes</h3></div><button className="codex-refresh" onClick={() => void refresh()} type="button">Atualizar</button></div>
      {runs.length === 0 ? <p className="codex-empty">Nenhuma tarefa foi executada neste projeto.</p> : <div className="codex-run-list">
        {runs.map((run) => <article className="codex-run-card" key={run.id}>
          <div className="codex-run-top"><div><span className={`health-status ${run.status.toLowerCase()}`}><span />{statusLabels[run.status]}</span><small>Codex {run.cliVersion} · {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(run.createdAt))}</small></div>
            {activeStatuses.has(run.status) && <button className="button button-secondary codex-cancel" disabled={busy || run.status === "CANCELLING"} onClick={() => void cancel(run.id)} type="button">{run.status === "CANCELLING" ? "Cancelando…" : "Cancelar"}</button>}
          </div>
          {run.errorCode && <p className="codex-run-error">Código: {run.errorCode}</p>}
          {(run.stdout || run.stderr) && <details className="codex-run-logs" open={activeStatuses.has(run.status)}><summary>Saída sanitizada · código de saída {run.exitCode ?? "pendente"}</summary>{run.stdout && <pre>{run.stdout}</pre>}{run.stderr && <pre>{run.stderr}</pre>}</details>}
        </article>)}
      </div>}
    </section>
  );
}
