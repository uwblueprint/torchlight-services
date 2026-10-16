import Link from "next/link";

const metrics = [
  { label: "Participants", value: "36", detail: "Illustrative current roster" },
  { label: "Receipts to review", value: "8", detail: "Sample review queue" },
  { label: "Export period", value: "September", detail: "Example reporting month" },
];

export default function AdminDashboard() {
  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Office workspace</p><h1>Good morning, team.</h1><p>One place to review spending, keep records together, and prepare monthly submissions.</p></div><span className="period-chip">Sample overview</span></div>
      <section className="summary-grid" aria-label="Sample admin summary">{metrics.map((metric) => <article className="summary-card" key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.detail}</small></article>)}</section>
      <div className="content-grid">
        <section className="panel"><div className="panel-heading"><div><p className="eyebrow">Next actions</p><h2>Keep the month moving</h2></div><span className="icon-chip">✳</span></div><ul className="action-list"><li><span className="action-icon action-amber">◷</span><div><strong>Review receipts with uncertain details</strong><small>Sample queue · no real uploads</small></div><Link href="/admin/ocr-review">Review →</Link></li><li><span className="action-icon action-blue">↗</span><div><strong>Prepare monthly Ministry export</strong><small>Spreadsheet layout awaits client template</small></div><Link href="/admin/reports">Reports →</Link></li><li><span className="action-icon action-green">＋</span><div><strong>Check participant allocations</strong><small>Budgets and current rules need confirmed data</small></div><Link href="/admin/participants">Participants →</Link></li></ul></section>
        <aside className="panel callout-panel"><span className="callout-mark">✦</span><p className="eyebrow">A useful reminder</p><h2>Review first.<br/>Submit with confidence.</h2><p>OCR can suggest receipt details, but staff should verify them before an expense is approved or included in an export.</p><Link className="text-link" href="/admin/ocr-review">Open review queue <span aria-hidden="true">↗</span></Link></aside>
      </div>
    </>
  );
}
