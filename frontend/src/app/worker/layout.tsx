import type { ReactNode } from "react";
import { PortalShell } from "@/components/portal-shell";

const links = [
  { href: "/worker/dashboard", label: "Funding & activity", group: "My work" },
  { href: "/worker/submit", label: "Add expense", group: "My work" },
  { href: "/worker/shifts", label: "Hours & mileage", group: "My work" },
  { href: "/worker/calculator", label: "Coverage calculator", group: "Plan" },
];

export default function WorkerLayout({ children }: { children: ReactNode }) {
  return <PortalShell audience="Passport Worker" links={links}>{children}</PortalShell>;
}
