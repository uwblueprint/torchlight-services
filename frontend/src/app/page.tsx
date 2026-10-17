import Link from "next/link";

const pages = [
  { role: "Shared", href: "/onboarding", title: "Worker onboarding", description: "Invite/role/assignment setup and training checklist." },
  { role: "Shared", href: "/login", title: "Login", description: "Shared sign-in stub and role-specific destination." },
  { role: "Passport Worker", href: "/worker/dashboard", title: "Funding & activity", description: "Assigned participant search, category balances, recent expenses, and planning." },
  { role: "Passport Worker", href: "/worker/submit", title: "Add expense", description: "Receipt upload, expense fields, category selection, and coverage calculation." },
  { role: "Passport Worker", href: "/worker/shifts", title: "Hours & mileage", description: "Start/end time, participant, mileage, and work note entry." },
  { role: "Torchlight Admin", href: "/admin/dashboard", title: "Admin dashboard", description: "All users, funding overview, recent activity, and follow-up notes." },
  { role: "Torchlight Admin", href: "/admin/participants", title: "Participant records", description: "Participant lookup, funding setup, individual expense log, and receipt history." },
  { role: "Torchlight Admin", href: "/admin/ocr-review", title: "Receipt follow-up", description: "Review missing/unclear details and categorize submitted receipts." },
  { role: "Torchlight Admin", href: "/admin/invoicing", title: "Overage tracking", description: "Track uncovered amounts, family notification, and invoice status." },
  { role: "Torchlight Admin", href: "/admin/reports", title: "Month-end & audit", description: "Prepare per-person, per-month export and retrieve historical receipts." },
  { role: "Shared calculator", href: "/worker/calculator", title: "Coverage calculator", description: "Estimate Passport-covered and out-of-pocket amounts before purchase." },
];

export default function Home() {
  return <main className="map-page">
    <header className="map-header"><Link href="/" className="portal-brand"><span className="portal-brand-symbol">T</span><span><strong>Torchlight</strong><small>Passport workspace</small></span></Link><span className="map-status"><i />Developer handoff · page stubs</span></header>
    <section className="map-intro"><p className="stub-eyebrow">Worker + admin workflows</p><h1>Implementation map</h1><p>These routes are intentionally low-fidelity stubs based on Research & flows and the PassportONE expense-log instructions. Each page marks what developers still need to build. No authentication, persistence, uploads, OCR, calculations, or exports are connected.</p></section>
    <section className="map-group"><div className="map-group-heading"><div><p className="stub-eyebrow">Field workflow</p><h2>Passport Worker</h2></div><span>Mobile-first · assigned participants only</span></div><div className="map-card-grid">{pages.filter((page) => page.role === "Passport Worker").map((page) => <Link className="map-card" href={page.href} key={page.href}><span className="map-card-kicker">{page.role}</span><h3>{page.title}</h3><p>{page.description}</p><span className="map-card-link">Open page stub →</span></Link>)}</div></section>
    <section className="map-group"><div className="map-group-heading"><div><p className="stub-eyebrow">Office workflow</p><h2>Torchlight Admin</h2></div><span>Desktop-first · all participant records</span></div><div className="map-card-grid">{pages.filter((page) => page.role === "Torchlight Admin").map((page) => <Link className="map-card" href={page.href} key={page.href}><span className="map-card-kicker">{page.role}</span><h3>{page.title}</h3><p>{page.description}</p><span className="map-card-link">Open page stub →</span></Link>)}</div></section>
    <section className="map-group"><div className="map-group-heading"><div><p className="stub-eyebrow">Access & planning</p><h2>Shared workflow stubs</h2></div><span>Onboarding · login · coverage</span></div><div className="map-card-grid">{pages.filter((page) => page.role === "Shared" || page.role === "Shared calculator").map((page) => <Link className="map-card" href={page.href} key={page.href}><span className="map-card-kicker">{page.role}</span><h3>{page.title}</h3><p>{page.description}</p><span className="map-card-link">Open page stub →</span></Link>)}</div></section>
    <footer className="map-footer">Passport funding workspace <span>·</span> Developer handoff prototype</footer>
  </main>;
}
