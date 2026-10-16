import type { ReactNode } from "react";
import { PortalShell } from "@/components/portal-shell";

const links = [
  { href: "/worker/dashboard", label: "Overview" },
  { href: "/worker/submit", label: "Submit expense" },
  { href: "/worker/shifts", label: "Hours & mileage" },
];

export default function WorkerLayout({ children }: { children: ReactNode }) {
  return <PortalShell audience="Passport Worker" links={links}>{children}</PortalShell>;
}
