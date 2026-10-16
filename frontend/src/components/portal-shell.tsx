import Link from "next/link";
import type { ReactNode } from "react";

type PortalShellProps = {
  audience: "Passport Worker" | "Torchlight Admin";
  links: { href: string; label: string }[];
  children: ReactNode;
};

export function PortalShell({ audience, links, children }: PortalShellProps) {
  const portalClass = audience === "Torchlight Admin"
    ? "portal-shell portal-shell-admin"
    : "portal-shell portal-shell-worker";

  return (
    <div className={portalClass}>
      <aside className="sidebar">
        <Link className="brand" href="/">
          <span className="brand-mark">T</span>
          <span>Torchlight<span className="brand-subtitle">Passport workspace</span></span>
        </Link>
        <p className="nav-label">{audience}</p>
        <nav aria-label={`${audience} navigation`} className="side-nav">
          {links.map((link) => (
            <Link href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-note">Scaffold preview<br />Sample data only</div>
      </aside>
      <main className="portal-main">
        <header className="topbar">
          <span>{audience} portal</span>
          <span className="environment-tag">Prototype · no real participant data</span>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
