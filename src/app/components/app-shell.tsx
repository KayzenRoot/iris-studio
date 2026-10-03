"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navigation = [
  { href: "/", label: "Visão geral", icon: "overview" },
  { href: "/projects", label: "Projetos", icon: "projects" },
  { href: "/system-health", label: "System Health", icon: "health" },
] as const;

function NavigationIcon({ name }: { name: (typeof navigation)[number]["icon"] }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "projects") {
    return <svg viewBox="0 0 24 24" aria-hidden="true" {...common}><rect x="3.5" y="4" width="17" height="16" rx="3" /><path d="M8 8h8M8 12h8M8 16h4" /></svg>;
  }
  if (name === "health") {
    return <svg viewBox="0 0 24 24" aria-hidden="true" {...common}><path d="M12 3.5 19 6v5.4c0 4.1-2.7 7.5-7 9.1-4.3-1.6-7-5-7-9.1V6l7-2.5Z" /><path d="m8.7 12 2.1 2.1 4.7-4.7" /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true" {...common}><path d="m4 12 8-8 8 8" /><path d="M6.5 10v9.5h11V10M9.5 19.5v-6h5v6" /></svg>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="studio-shell">
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="IRIS Studio, início">
          <span className="brand-mark"><span /></span>
          <span className="brand-copy"><strong>IRIS</strong><small>STUDIO</small></span>
        </Link>
        <div className="workspace-switcher">
          <span className="workspace-avatar">IS</span>
          <span className="workspace-name"><strong>Meu estúdio</strong><small>Workspace local</small></span>
          <span className="switcher-chevron" aria-hidden="true">⌄</span>
        </div>
        <p className="nav-caption">ESPAÇO DE TRABALHO</p>
        <nav className="primary-nav" aria-label="Navegação principal">
          {navigation.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link className={`nav-link${active ? " active" : ""}`} href={item.href} key={item.href} aria-current={active ? "page" : undefined}>
                <NavigationIcon name={item.icon} />
                <span>{item.label}</span>
                {item.href === "/projects" && <span className="nav-dot" aria-hidden="true" />}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-card"><span className="local-pulse" /><div><strong>Ambiente local</strong><small>Seus dados ficam aqui</small></div></div>
          <div className="sidebar-foot"><span className="mini-iris">✳</span><span>M01 · Local Core</span><span className="version-tag">0.1</span></div>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="topbar-context"><span className="topbar-kicker">IRIS STUDIO</span><span className="topbar-divider">/</span><span>Seu espaço de criação</span></div>
          <div className="topbar-right"><span className="privacy-badge"><span /> PRIVADO · NESTE DISPOSITIVO</span><span className="operator-avatar" aria-label="Operador local">CS</span></div>
        </header>
        <main className="page-content">{children}</main>
        <footer className="app-footer"><span>IRIS Studio</span><span>Construído para criar com intenção.</span><span className="footer-local"><span /> LOCAL FIRST</span></footer>
      </div>
    </div>
  );
}
