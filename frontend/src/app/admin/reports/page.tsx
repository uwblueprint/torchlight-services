export default function ReportsPage() {
  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Month-end & audit support</p><h1>Reports & archives</h1><p>Prepare spending data and retrieve the documents behind it.</p></div></div>
      <div className="content-grid">
        <section className="panel report-card"><span className="report-icon">▦</span><p className="eyebrow">Ministry submission support</p><h2>Spending spreadsheet</h2><p>Prepare an Excel workbook shaped to the Ministry portal so Patty can review and copy/paste submissions.</p><label>Reporting period<select defaultValue="September 2026"><option>September 2026</option><option>August 2026</option></select></label><button className="button button-primary" disabled type="button">Export Excel · coming later</button><small>Requires the current Ministry spreadsheet template.</small></section>
        <section className="panel report-card"><span className="report-icon report-icon-amber">▤</span><p className="eyebrow">Audit retrieval</p><h2>Receipt archive</h2><p>Download source receipts for a participant and date range to support audits and offline retention.</p><label>Participant<select defaultValue=""><option value="" disabled>Select a participant</option></select></label><div className="field-grid compact-fields"><label>From<input type="date" /></label><label>To<input type="date" /></label></div><button className="button button-secondary" disabled type="button">Download ZIP · coming later</button><small>Keep the source documents and their audit trail together.</small></section>
      </div>
      <p className="muted-copy report-footnote">Exports, receipt storage, and archive retention are not implemented in this scaffold. The seven-year offline retention requirement must be confirmed with Torchlight.</p>
    </>
  );
}
