import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { PortalNav, type PortalLink } from "@/components/portal-nav";

type PortalAudience = "Passport Worker" | "Torchlight Admin";

type PortalShellProps = {
  audience: PortalAudience;
  links: PortalLink[];
  children: ReactNode;
};

export function PortalShell({ audience, links, children }: PortalShellProps) {
  const isAdmin = audience === "Torchlight Admin";

  return <div className={`portal-frame ${isAdmin ? "portal-frame-admin" : "portal-frame-worker"}`}>
    <aside className="portal-sidebar">
      <Link href="/" className="portal-brand"><Image className="portal-brand-mark" src="/brand/torchlight-mark.png" alt="" width={34} height={43} /><span><strong>Torchlight</strong><small>Passport workspace</small></span></Link>
      <div className="portal-role"><span className="portal-role-indicator" />{audience}<small>Prototype · no real records</small></div>
      <PortalNav audience={audience} links={links} />
      <div className="portal-sidebar-footer"><span className="portal-avatar">{isAdmin ? "A" : "W"}</span><span><strong>{isAdmin ? "Admin preview" : "Worker preview"}</strong><small>Demo workspace</small></span><span className="portal-more">···</span></div>
    </aside>
    <div className="portal-main">
      <header className="portal-topbar"><div className="portal-breadcrumb">Torchlight <span>/</span> {audience}</div><div className="portal-topbar-right"><span className="portal-environment"><i />Local prototype</span><button type="button" aria-label="Notifications" className="portal-notification">◇<span /></button><button className="portal-user-chip" type="button"><span className="portal-avatar">{isAdmin ? "A" : "W"}</span><span>{isAdmin ? "Admin" : "Worker"}</span><span aria-hidden="true">⌄</span></button></div></header>
      {children}
      <footer className="portal-footer"><span>Passport funding workspace</span><span>Prototype only · synthetic data</span></footer>
    </div>
  </div>;
}
