import { PageHeading } from "../../components/page-heading";
import type { HealthStatus, IntegrationHealth } from "@/server/health";
import { getSystemHealth } from "@/server/runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function HealthCard({ title, description, health, note }: { title: string; description: string; health: IntegrationHealth; note?: string }) {
  const statusClass = health.status.toLowerCase();
  return (
    <article className="health-card"><div className="health-card-top"><div className="health-symbol" aria-hidden="true">✳</div><span className={`health-status ${statusClass}`}><span />{health.status}</span></div><h2>{title}</h2><p className="health-description">{description}</p><div className="health-result"><span className="eyebrow">LEITURA LOCAL</span><strong>{health.detail}</strong>{note && <small>{note}</small>}</div></article>
  );
}

export default async function SystemHealthPage() {
  const health = await getSystemHealth();
  const overallStatus: HealthStatus = health.database.status === "AVAILABLE" ? "AVAILABLE" : "MISCONFIGURED";

  return (
    <>
      <PageHeading eyebrow="SISTEMA · DIAGNÓSTICO LOCAL" title="Tudo às claras." description="Veja o que está respondendo neste dispositivo e o que ainda não está disponível." action={<span className={`health-status ${overallStatus.toLowerCase()}`}><span />{overallStatus}</span>} />
      <section className="health-summary"><div className="health-summary-icon">✳</div><div><p className="eyebrow">VERIFICAÇÃO MAIS RECENTE</p><h2>Um retrato honesto do ambiente.</h2><p>A sessão é classificada pela interface suportada do Codex. A saída é descartada e tokens não são lidos pelo IRIS.</p></div><time dateTime={health.checkedAt}>{new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(health.checkedAt))}</time></section>
      <div className="health-grid">
        <HealthCard title="IRIS Studio" description="Dashboard e serviços locais do aplicativo." health={health.application} />
        <HealthCard title="SQLite" description="Persistência local, migrações e acesso ao banco." health={health.database} />
        <HealthCard title="Codex CLI" description="Executável local e sessão ChatGPT verificados pelo próprio CLI." health={health.integrations.codex} note={health.integrations.codex.version ? `Versão ${health.integrations.codex.version}. A resposta completa não é exibida nem persistida.` : "A resposta completa do CLI não é exibida nem persistida."} />
        <HealthCard title="ComfyUI" description="Resposta do endpoint local padrão." health={health.integrations.comfyui} note="Nenhum workflow ou modelo foi executado." />
        <HealthCard title="Blender" description="Verificação de presença do executável local." health={health.integrations.blender} note="MCP e automação não são executados no M01." />
      </div>
      <p className="health-footnote"><span>i</span> O IRIS não abre arquivos de credenciais nem copia tokens; a autenticação é delegada ao Codex CLI local.</p>
    </>
  );
}
