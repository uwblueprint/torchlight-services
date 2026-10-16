const sampleReceipts = [
  { merchant: "Community Arts Centre", participant: "Sample participant A", date: "Oct 14, 2026", amount: "$48.00", confidence: "Needs confirmation", category: "Community participation" },
  { merchant: "City Transit", participant: "Sample participant B", date: "Oct 13, 2026", amount: "$12.50", confidence: "Review suggested", category: "Transportation" },
  { merchant: "Local Bookshop", participant: "Sample participant C", date: "Oct 12, 2026", amount: "$32.00", confidence: "Needs confirmation", category: "Unassigned" },
];

export default function OcrReviewPage() {
  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Human-in-the-loop</p><h1>Receipt review</h1><p>Check suggested details before an expense is approved or reported.</p></div><span className="status-pill status-pending">3 sample items</span></div>
      <p className="prototype-warning"><strong>OCR is not implemented.</strong> Values below are fabricated examples. No receipt images or extracted information are connected.</p>
      <section className="panel table-panel"><div className="panel-heading"><div><p className="eyebrow">Needs attention</p><h2>Suggested details</h2></div><span className="period-chip">Illustrative queue</span></div>
        <div className="table-scroll"><table><thead><tr><th>Receipt</th><th>Participant</th><th>Date</th><th>Amount</th><th>Category</th><th>Review</th></tr></thead><tbody>{sampleReceipts.map((receipt) => <tr key={receipt.merchant}><td><strong>{receipt.merchant}</strong></td><td>{receipt.participant}</td><td>{receipt.date}</td><td>{receipt.amount}</td><td>{receipt.category}</td><td><button className="review-button" type="button">Open review</button></td></tr>)}</tbody></table></div>
        <div className="coverage-note"><span>i</span><p><strong>OCR never approves an expense.</strong><br/>A staff member must confirm the date, amount, participant and category before approval or ledger posting.</p></div>
      </section>
    </>
  );
}
