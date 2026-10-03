import Link from "next/link";

export default function NotFound() {
  return <main className="not-found"><span className="mini-iris">✳</span><p className="eyebrow">404 · FORA DO MAPA</p><h1>Esta página ainda não existe.</h1><p>Volte ao seu estúdio e continue de onde faz sentido.</p><Link className="button button-primary" href="/">Voltar à visão geral <span aria-hidden="true">→</span></Link></main>;
}
