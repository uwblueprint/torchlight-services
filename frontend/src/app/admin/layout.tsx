import type { ReactNode } from "react";
import { PortalShell } from "@/components/portal-shell";

const links = [
  { href: "/admin/dashboard", label: "Overview" },
  { href: "/admin/participants", label: "Participants & budgets" },
  { href: "/admin/ocr-review", label: "Receipt review" },
  { href: "/admin/invoicing", label: "Invoicing" },
  { href: "/admin/reports", label: "Reports & audits" },
  { href: "/worker/dashboard", label: "Worker preview" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <PortalShell audience="Torchlight Admin" links={links}>{children}</PortalShell>;
}
