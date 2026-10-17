import type { ReactNode } from "react";
import { PortalShell } from "@/components/portal-shell";

const links = [
  { href: "/admin/dashboard", label: "Overview", group: "Workspace" },
  { href: "/admin/participants", label: "Participants & expense logs", group: "Funding" },
  { href: "/admin/ocr-review", label: "Receipt follow-up", group: "Funding" },
  { href: "/admin/invoicing", label: "Overages & invoices", group: "Funding" },
  { href: "/admin/reports", label: "Month-end & audits", group: "Month end" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <PortalShell audience="Torchlight Admin" links={links}>{children}</PortalShell>;
}
