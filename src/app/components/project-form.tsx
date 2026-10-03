"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

function splitLines(value: string) {
  return value.split(/[\r\n,]+/).map((entry) => entry.trim()).filter(Boolean);
}

function parseRequiredSections(value: string) {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const separator = line.indexOf(":");
    return {
      page: separator >= 0 ? line.slice(0, separator).trim() : line,
      sections: separator >= 0 ? splitLines(line.slice(separator + 1)) : [],
    };
  });
}

export function ProjectForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submitProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const input = {
      name: String(form.get("name") ?? ""),
      brief: {
        siteType: String(form.get("siteType") ?? "portfolio"),
        description: String(form.get("description") ?? ""),
        goal: String(form.get("goal") ?? ""),
        audience: String(form.get("audience") ?? ""),
        pages: splitLines(String(form.get("pages") ?? "")),
        requiredSections: parseRequiredSections(String(form.get("requiredSections") ?? "")),
        references: splitLines(String(form.get("references") ?? "")),
        tone: String(form.get("tone") ?? ""),
        colors: splitLines(String(form.get("colors") ?? "")),
        mediaDirection: String(form.get("mediaDirection") ?? ""),
        mediaPreference: String(form.get("mediaPreference") ?? "DIRECTOR_CHOICE"),
        motionDirection: String(form.get("motionDirection") ?? ""),
        qualityMode: String(form.get("qualityMode") ?? "STANDARD"),
      },
    };

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      const result = await response.json() as { project?: { id: string }; error?: string };
      if (!response.ok || !result.project) {
        setError(result.error ?? "Não foi possível criar o projeto. Revise o briefing e tente novamente.");
        return;
      }
      router.push(`/projects/${result.project.id}`);
      router.refresh();
    } catch {
      setError("Não foi possível salvar localmente agora. Verifique o aplicativo e tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="project-form" onSubmit={submitProject}>
      <section className="form-section">
        <div className="form-section-heading"><span className="form-step">01</span><div><h2>O projeto</h2><p>Comece com o contexto essencial.</p></div></div>
        <label className="field"><span>Nome do projeto</span><input name="name" required minLength={2} maxLength={80} placeholder="Ex.: Casa Aurora" autoComplete="off" /></label>
        <div className="field-row">
          <label className="field"><span>Tipo de site</span><select name="siteType" defaultValue="portfolio"><option value="marketing">Marketing</option><option value="portfolio">Portfólio</option><option value="institutional">Institucional</option><option value="product-presentation">Apresentação de produto</option></select></label>
          <label className="field"><span>Modo de qualidade</span><select name="qualityMode" defaultValue="STANDARD"><option value="STANDARD">Standard</option><option value="PREMIUM">Premium</option><option value="ABSURD">Absurd</option></select></label>
        </div>
        <label className="field"><span>Resumo do projeto</span><textarea name="description" required minLength={10} maxLength={2000} rows={3} placeholder="Contexto da marca, produto ou instituição." /></label>
        <div className="field-row">
          <label className="field"><span>Objetivo principal</span><textarea name="goal" required minLength={10} maxLength={500} rows={2} placeholder="O que a pessoa deve entender ou fazer?" /></label>
          <label className="field"><span>Público principal</span><textarea name="audience" required minLength={10} maxLength={500} rows={2} placeholder="Para quem a experiência é feita?" /></label>
        </div>
        <label className="field"><span>Páginas desejadas</span><input name="pages" required placeholder="Início, Sobre, Contato" /><small>Liste de 1 a 8 páginas, separadas por vírgulas.</small></label>
      </section>

      <section className="form-section">
        <div className="form-section-heading"><span className="form-step">02</span><div><h2>Sinais de direção</h2><p>Oriente as decisões visuais sem transformar referências em modelos para copiar.</p></div></div>
        <label className="field"><span>Seções que precisam aparecer <small>· opcional</small></span><textarea name="requiredSections" rows={3} placeholder={"Início: Apresentação, Manifesto, Projetos\nContato: Formulário, Localização"} /><small>Uma página por linha, com o nome exato e seções separadas por vírgula.</small></label>
        <label className="field"><span>Referências</span><textarea name="references" rows={2} placeholder="URLs, marcas ou trabalhos de referência" /></label>
        <div className="field-row">
          <label className="field"><span>Tom de voz</span><input name="tone" required minLength={2} placeholder="Ex.: editorial e acolhedor" /></label>
          <label className="field"><span>Paleta de cores</span><input name="colors" required placeholder="#10231e, #e8e3d9" /><small>Use cores HEX separadas por vírgula.</small></label>
        </div>
        <label className="field"><span>Direção visual</span><textarea name="mediaDirection" required minLength={2} rows={2} placeholder="Ex.: fotografia de arquitetura com luz natural" /></label>
        <label className="field"><span>Uso de 2D e 3D</span><select name="mediaPreference" defaultValue="DIRECTOR_CHOICE"><option value="DIRECTOR_CHOICE">O diretor de arte decide pelo impacto e custo</option><option value="2D_ONLY">Somente soluções 2D</option><option value="2D_AND_3D_ALLOWED">3D pode ser considerado quando necessário</option></select><small>Permitir 3D não significa que ele será recomendado.</small></label>
        <label className="field"><span>Direção de movimento</span><input name="motionDirection" required minLength={2} placeholder="Ex.: transições discretas" /></label>
      </section>

      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions"><p>Seu briefing e os arquivos do projeto permanecem neste dispositivo.</p><button className="button button-primary" type="submit" disabled={saving}>{saving ? "Salvando…" : "Criar projeto"}<span aria-hidden="true">↗</span></button></div>
    </form>
  );
}
