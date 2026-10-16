const steps = ["Upload receipt", "Check details", "Admin review"];

export default function SubmitExpensePage() {
  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">Worker workspace</p><h1>Submit an expense</h1><p>A preview of the proposed receipt workflow. Nothing is uploaded or saved.</p></div></div>
      <ol className="stepper">{steps.map((step, index) => <li className={index === 0 ? "active" : ""} key={step}><span>{String(index + 1).padStart(2, "0")}</span>{step}</li>)}</ol>
      <div className="content-grid upload-layout">
        <section className="panel"><div className="panel-heading"><div><p className="eyebrow">Step one</p><h2>Add a receipt</h2></div><span className="period-chip">PDF · JPEG · Word*</span></div>
          <div className="upload-zone"><span className="upload-symbol">↑</span><strong>Choose a receipt file</strong><p>Drag a file here or browse your device.</p><button className="button button-secondary" type="button">Choose file</button><small>File limits and accepted formats need Torchlight confirmation.</small></div>
          <p className="prototype-warning"><strong>Prototype only.</strong> Upload, OCR, and storage are not connected yet. Do not use real participant data.</p>
        </section>
        <aside className="panel"><p className="eyebrow">What happens next</p><h2>People stay in control.</h2><ol className="review-steps"><li><span>1</span><div><strong>Receipt saved privately</strong><p>Original receipt linked to a participant and uploader.</p></div></li><li><span>2</span><div><strong>Details extracted</strong><p>OCR suggests values; it does not approve an expense.</p></div></li><li><span>3</span><div><strong>Reviewed before posting</strong><p>Confirmed expenses follow a defined approval and balance workflow.</p></div></li></ol><p className="muted-copy">Pending expenses should not silently change approved balances; final ledger rules remain to be decided.</p></aside>
      </div>
    </>
  );
}
