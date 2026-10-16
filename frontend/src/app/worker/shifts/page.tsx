export default function ShiftsPage() {
  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Worker workspace</p><h1>Hours & mileage</h1><p>Capture time and travel details for supported work.</p></div><button className="button button-primary" type="button">Log a shift <span aria-hidden="true">＋</span></button></div>
      <section className="panel shift-panel"><div className="panel-heading"><div><p className="eyebrow">Proposed workflow</p><h2>Shift details</h2></div><span className="period-chip">Policy confirmation needed</span></div>
        <div className="field-grid"><label>Participant<select defaultValue=""><option value="" disabled>Select assigned participant</option></select></label><label>Shift date<input type="date" /></label><label>Start time<input type="time" /></label><label>End time<input type="time" /></label><label>Mileage<input min="0" placeholder="0.0" step="0.1" type="number" /><small>Distance in kilometres</small></label><label>Work note<input placeholder="Optional note" /></label></div>
        <div className="prototype-warning"><strong>Rate and eligibility rules are not set.</strong> Mileage rate and meal eligibility in the technical draft are unconfirmed; no reimbursement amount is calculated here.</div>
      </section>
    </>
  );
}
