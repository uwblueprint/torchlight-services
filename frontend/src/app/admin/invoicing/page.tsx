export default function InvoicingPage() {
  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Uncovered costs</p><h1>Invoice tracking</h1><p>Keep visibility on costs not covered by available Passport funding.</p></div><button className="button button-primary" type="button">Record an item <span aria-hidden="true">＋</span></button></div>
      <div className="prototype-warning"><strong>Tracking concept only.</strong> The application will not move money. Whether it generates invoices or only records them, and who is billed, requires Torchlight confirmation.</div>
      <div className="content-grid"><section className="panel"><div className="panel-heading"><div><p className="eyebrow">Sample statuses</p><h2>Out-of-pocket items</h2></div></div><ul className="action-list"><li><span className="action-icon action-amber">◷</span><div><strong>Activity coverage confirmation</strong><small>Sample participant A · family informed</small></div><span className="status-pill status-pending">Draft</span></li><li><span className="action-icon action-blue">↗</span><div><strong>Partner cost follow-up</strong><small>Sample participant B · amount to confirm</small></div><span className="status-pill status-active">In progress</span></li></ul></section><aside className="panel"><p className="eyebrow">Proposed record</p><h2>What might need tracking?</h2><ul className="plain-list"><li>Expense and covered amount</li><li>Uncovered amount and responsible payer</li><li>Confirmation that family/caregiver was informed</li><li>Invoice/payment status, if confirmed in scope</li></ul></aside></div>
    </>
  );
}
