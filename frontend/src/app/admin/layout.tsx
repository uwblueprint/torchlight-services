import type { ReactNode } from "react";
import { PortalShell } from "@/components/portal-shell";
import { adminLinks } from "@/lib/admin-links";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <PortalShell audience="Torchlight Admin" links={adminLinks}>{children}</PortalShell>;
}
