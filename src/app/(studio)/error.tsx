"use client";

export default function StudioError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="error-state"><span className="error-symbol">!</span><p className="eyebrow">ALGO SAIU DO ESPERADO</p><h1>Vamos tentar de novo.</h1><p>O IRIS não conseguiu carregar esta tela agora. Seus dados locais continuam preservados.</p><button className="button button-primary" onClick={retry}>Tentar novamente <span aria-hidden="true">↻</span></button></div>
  );
}
