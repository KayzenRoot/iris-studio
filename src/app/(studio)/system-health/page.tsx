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
      <section className="health-summary"><div className="health-summary-icon">✳</div><div><p className="eyebrow">VERIFICAÇÃO MAIS RECENTE</p><h2>Um retrato honesto do ambiente.</h2><p>Disponibilidade significa apenas o que foi verificado. O M01 não executa integrações nem inspeciona credenciais.</p></div><time dateTime={health.checkedAt}>{new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(health.checkedAt))}</time></section>
      <div className="health-grid">
        <HealthCard title="IRIS Studio" description="Dashboard e serviços locais do aplicativo." health={health.application} />
        <HealthCard title="SQLite" description="Persistência local, migrações e acesso ao banco." health={health.database} />
        <HealthCard title="Codex CLI" description="Verificação de presença do executável local." health={health.integrations.codex} note="O estado de autenticação não é verificado." />
        <HealthCard title="ComfyUI" description="Resposta do endpoint local padrão." health={health.integrations.comfyui} note="Nenhum workflow ou modelo foi executado." />
        <HealthCard title="Blender" description="Verificação de presença do executável local." health={health.integrations.blender} note="MCP e automação não são executados no M01." />
      </div>
      <p className="health-footnote"><span>i</span> O IRIS não acessa tokens, não inicia ferramentas externas e não envia dados durante este diagnóstico.</p>
    </>
  );
}
