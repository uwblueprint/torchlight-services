import { PageStub } from "@/components/page-stub";

export default function InvoicingPage() {
  return <PageStub
    audience="Torchlight Admin"
    title="Overages & invoice tracking"
    description="Research notes say uncovered costs may be paid by a family or absorbed by Torchlight, and Janella tracks invoices manually. This application tracks amounts and invoice status only; it does not collect or move money."
    developerTasks={[
      "Load expenses with an uncovered amount and show Passport-covered versus out-of-pocket amounts.",
      "Implement payer selection and invoice lifecycle according to the agreed client workflow.",
      "Record that the participant/family was informed, including note author and timestamp.",
      "Add filters and a status history for invoices; keep payment processing out of scope.",
    ]}
    sections={[
      { title: "Uncovered cost queue", description: "Find expenses needing payer, family communication, or invoice follow-up.", kind: "table", columns: ["Date", "Participant", "Expense", "Passport covered", "Uncovered", "Payer", "Status"], emptyMessage: "Connect the expense ledger and confirmed overage rules." },
      { title: "Record invoice / follow-up", description: "Capture administrative tracking, not payment collection.", kind: "form", fields: [{ label: "Participant and expense", type: "select", options: ["Load uncovered expenses"] }, { label: "Responsible payer", type: "select", options: ["Family", "Partner organization", "Torchlight absorbs cost", "To be determined"] }, { label: "Invoice amount", type: "number", placeholder: "0.00" }, { label: "Invoice status", type: "select", options: ["Draft", "Sent", "Resolved", "Written off"] }, { label: "Family/caregiver communication note", type: "textarea" }], action: "Save invoice tracking" },
      { title: "Boundary", description: "Keep this feature aligned to the documented scope.", kind: "checklist", items: ["Track only: no payment processing", "Save actor/time for status changes", "Preserve the expense link and uncovered amount", "Use approved payer/status rules when finalized"] },
    ]}
  />;
}
