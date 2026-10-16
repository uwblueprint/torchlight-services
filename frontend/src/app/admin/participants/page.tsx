const sampleRows = [
  { initials: "AM", name: "Sample participant A", allocation: "$5,500.00", categories: "8 configured", status: "Active" },
  { initials: "BK", name: "Sample participant B", allocation: "$7,200.00", categories: "9 configured", status: "Active" },
  { initials: "CL", name: "Sample participant C", allocation: "Needs setup", categories: "Not configured", status: "Setup needed" },
];

export default function ParticipantsPage() {
  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Funding setup</p><h1>Participants & budgets</h1><p>Manage annual allocations and category baselines by fiscal year.</p></div><button className="button button-primary" type="button">Add participant <span aria-hidden="true">＋</span></button></div>
      <div className="prototype-warning"><strong>Illustrative values only.</strong> These names and amounts are fake. Official categories, caps, and participant allocations must come from Torchlight.</div>
      <section className="panel table-panel"><div className="panel-heading"><div><p className="eyebrow">Roster preview</p><h2>Funding setup status</h2></div><label className="search-field"><span className="sr-only">Search sample participants</span><input placeholder="Search roster" type="search" /></label></div>
        <div className="table-scroll"><table><thead><tr><th>Participant</th><th>Annual allocation</th><th>Category setup</th><th>Status</th></tr></thead><tbody>{sampleRows.map((row) => <tr key={row.initials}><td><span className="person-cell"><span className="avatar">{row.initials}</span><strong>{row.name}</strong></span></td><td>{row.allocation}</td><td>{row.categories}</td><td><span className={row.status === "Active" ? "status-pill status-active" : "status-pill status-pending"}>{row.status}</span></td></tr>)}</tbody></table></div>
      </section>
    </>
  );
}
