const categories = [
  { name: "Community participation", remaining: "$1,240.00", spent: "$760.00", percent: 38, allocated: "$2,000.00" },
  { name: "Transportation", remaining: "$485.00", spent: "$315.00", percent: 39, allocated: "$800.00" },
  { name: "Technology", remaining: "$755.00", spent: "$245.00", percent: 25, allocated: "$1,000.00" },
];

export default function WorkerDashboard() {
  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Assigned participant</p><h1>Your funding overview</h1><p>Illustrative participant data · not connected to Torchlight records</p></div><button className="button button-primary" type="button">Plan an activity <span aria-hidden="true">＋</span></button></div>
      <section className="summary-grid" aria-label="Sample summary">
        <article className="summary-card summary-highlight"><span>Available to plan</span><strong>$2,480.00</strong><small>Illustrative total across shown categories</small></article>
        <article className="summary-card"><span>Assigned participants</span><strong>1</strong><small>Access will be assignment-scoped</small></article>
        <article className="summary-card"><span>Needs a second look</span><strong>1 receipt</strong><small>Review flags are examples only</small></article>
      </section>
      <div className="content-grid">
        <section className="panel"><div className="panel-heading"><div><p className="eyebrow">Funding categories</p><h2>Remaining balances</h2></div><span className="period-chip">Sample fiscal year</span></div>
          <div className="category-list">{categories.map((category) => <article className="category-row" key={category.name}><div className="category-title"><div><strong>{category.name}</strong><span>Sample allocated: {category.allocated}</span></div><strong>{category.remaining}</strong></div><div className="progress-track"><span style={{ width: `${category.percent}%` }} /></div><small>{category.percent}% shown as spent · {category.spent} sample</small></article>)}</div>
        </section>
        <section className="panel"><div className="panel-heading"><div><p className="eyebrow">Recent activity</p><h2>Transaction history</h2></div><span className="icon-chip">↗</span></div>
          <ol className="transaction-list"><li><span className="transaction-dot dot-green"/><div><strong>Community art class</strong><small>Sep 28 · Community participation</small></div><b>−$48.00</b></li><li><span className="transaction-dot dot-blue"/><div><strong>Local transit</strong><small>Sep 25 · Transportation</small></div><b>−$12.50</b></li><li><span className="transaction-dot dot-amber"/><div><strong>Activity admission</strong><small>Sep 22 · Pending review</small></div><b>−$32.00</b></li></ol>
          <div className="coverage-note"><span>◌</span><p><strong>Planning an activity?</strong><br/>Coverage estimates will use approved category and balance rules.</p></div>
        </section>
      </div>
    </>
  );
}
