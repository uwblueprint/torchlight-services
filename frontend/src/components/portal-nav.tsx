"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type PortalLink = {
  href: string;
  label: string;
  group?: string;
};

export function PortalNav({ audience, links }: { audience: string; links: PortalLink[] }) {
  const pathname = usePathname();
  const groupedLinks = links.reduce<Record<string, PortalLink[]>>((groups, link) => {
    const group = link.group ?? "Workspace";
    groups[group] ??= [];
    groups[group].push(link);
    return groups;
  }, {});

  return <nav className="portal-nav" aria-label={`${audience} pages`}>
    {Object.entries(groupedLinks).map(([group, groupLinks]) => <div className="portal-nav-group" key={group}>
      <p>{group}</p>
      {groupLinks.map((link) => {
        const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(`${link.href}/`));

        return <Link
          aria-current={isActive ? "page" : undefined}
          className={`portal-nav-link${isActive ? " is-active" : ""}`}
          href={link.href}
          key={link.href}
        >
          <span className="portal-nav-icon" aria-hidden="true">{link.label.slice(0, 1)}</span>{link.label}<span className="portal-nav-arrow" aria-hidden="true">→</span>
        </Link>;
      })}
    </div>)}
  </nav>;
}
