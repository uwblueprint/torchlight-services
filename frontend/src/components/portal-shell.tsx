import Link from "next/link";
import type { ReactNode } from "react";

type PortalAudience = "Passport Worker" | "Torchlight Admin";
type PortalLink = { href: string; label: string; group?: string };

type PortalShellProps = {
  audience: PortalAudience;
  links: PortalLink[];
  children: ReactNode;
};

export function PortalShell({ audience, links, children }: PortalShellProps) {
  const isAdmin = audience === "Torchlight Admin";
  const groupedLinks = links.reduce<Record<string, PortalLink[]>>((groups, link) => {
    const group = link.group ?? "Workspace";
    groups[group] ??= [];
    groups[group].push(link);
    return groups;
  }, {});

  return <div className={`portal-frame ${isAdmin ? "portal-frame-admin" : "portal-frame-worker"}`}>
    <aside className="portal-sidebar">
      <Link href="/" className="portal-brand"><span className="portal-brand-symbol">T</span><span><strong>Torchlight</strong><small>Passport workspace</small></span></Link>
      <div className="portal-role"><span className="portal-role-indicator" />{audience}<small>Prototype · no real records</small></div>
      <nav className="portal-nav" aria-label={`${audience} pages`}>
        {Object.entries(groupedLinks).map(([group, groupLinks]) => <div className="portal-nav-group" key={group}>
          <p>{group}</p>
          {groupLinks.map((link) => <Link className="portal-nav-link" href={link.href} key={link.href}><span className="portal-nav-icon" aria-hidden="true">{link.label.slice(0, 1)}</span>{link.label}<span className="portal-nav-arrow" aria-hidden="true">→</span></Link>)}
        </div>)}
      </nav>
      <div className="portal-sidebar-footer"><span className="portal-avatar">{isAdmin ? "A" : "W"}</span><span><strong>{isAdmin ? "Admin preview" : "Worker preview"}</strong><small>Demo workspace</small></span><span className="portal-more">···</span></div>
    </aside>
    <div className="portal-main">
      <header className="portal-topbar"><div className="portal-breadcrumb">Torchlight <span>/</span> {audience}</div><div className="portal-topbar-right"><span className="portal-environment"><i />Local prototype</span><button type="button" aria-label="Notifications" className="portal-notification">◇<span /></button><button className="portal-user-chip" type="button"><span className="portal-avatar">{isAdmin ? "A" : "W"}</span><span>{isAdmin ? "Admin" : "Worker"}</span><span aria-hidden="true">⌄</span></button></div></header>
      {children}
      <footer className="portal-footer"><span>Passport funding workspace</span><span>Prototype only · no authentication or data connections</span></footer>
    </div>
  </div>;
}
