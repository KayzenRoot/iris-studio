import Link from "next/link";

import { PageHeading } from "../../../components/page-heading";
import { ProjectForm } from "../../../components/project-form";

export default function NewProjectPage() {
  return (
    <>
      <PageHeading eyebrow="NOVO PROJETO · BRIEFING" title="Toda boa história começa com contexto." description="Descreva a intenção. Este espaço guarda a direção inicial para as próximas etapas." action={<Link className="back-link" href="/projects">← Voltar aos projetos</Link>} />
      <div className="form-layout"><div className="form-intro"><span className="form-intro-symbol">✳</span><h2>Primeiro, a intenção.</h2><p>Um briefing claro ajuda a transformar referências soltas em uma direção visual consistente.</p><div className="form-intro-note"><span>01</span><p>Seu projeto e os arquivos do workspace ficam armazenados localmente.</p></div><div className="form-intro-note"><span>02</span><p>Nenhuma geração externa acontece nesta etapa do M01.</p></div></div><ProjectForm /></div>
    </>
  );
}
