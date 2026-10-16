import Link from "next/link";

const capabilities = [
  ["01", "Capture", "Bring receipts and expense details into one consistent workflow."],
  ["02", "Review", "Keep people in control of receipt categorization and approval."],
  ["03", "Report", "Prepare Ministry-ready exports and audit receipt bundles."],
];

export default function Home() {
  return (
    <main className="landing">
      <nav className="landing-nav">
        <Link className="brand" href="/">
          <span className="brand-mark">T</span>
          <span>Torchlight<span className="brand-subtitle">Passport workspace</span></span>
        </Link>
        <span className="environment-tag">Development scaffold</span>
      </nav>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">A clearer view of Passport funding</p>
          <h1>More time for the moments that matter.</h1>
          <p className="hero-description">A shared workspace concept for tracking receipts, funding and reporting—designed around Torchlight&apos;s real-world workflow.</p>
          <div className="portal-actions">
            <Link className="button button-primary" href="/worker/dashboard">Open worker portal <span aria-hidden="true">↗</span></Link>
            <Link className="button button-secondary" href="/admin/dashboard">Open admin portal <span aria-hidden="true">↗</span></Link>
          </div>
          <p className="prototype-note">These screens are a navigable scaffold with illustrative data only. Authentication and real participant records are not connected.</p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="art-card art-balance"><span>Available to plan</span><strong>$2,480.00</strong><i>across assigned categories</i></div>
          <div className="art-card art-receipt"><span className="receipt-icon">↗</span><span>Receipt reviewed</span><strong>Community activity</strong><i>Ready for admin review</i></div>
          <span className="art-dot dot-one" /><span className="art-dot dot-two" />
        </div>
      </section>
      <section className="capabilities" aria-labelledby="capabilities-heading">
        <div className="section-heading"><p className="eyebrow">The foundation</p><h2 id="capabilities-heading">A workflow, built around people.</h2></div>
        <div className="capability-grid">{capabilities.map(([number, title, copy]) => <article className="capability-card" key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div>
      </section>
      <footer className="landing-footer"><span>TORCHLIGHT SERVICES</span><span>Project scaffold · Features remain subject to scope review</span></footer>
    </main>
  );
}
