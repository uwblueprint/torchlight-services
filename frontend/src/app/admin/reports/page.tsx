import { PageStub } from "@/components/page-stub";

export default function ReportsPage() {
  return <PageStub
    audience="Torchlight Admin"
    title="Month-end & audit records"
    description="The office prepares expenses per participant each month for Patty to submit through the Ministry portal. The application should prepare a copy/paste-ready workbook and make receipt records easy to retrieve; it must not submit to PassportONE."
    developerTasks={[
      "Use the Ministry-provided spreadsheet template; map required fields and verify the generated workbook with client staff.",
      "Generate one monthly export per participant with fiscal-year/backdated expense handling.",
      "Provide a per-person receipt archive filtered by date range and optional category/amount.",
      "Stream/download files safely for offline archival; record who generated an export or archive.",
      "Display local workflow status separately from PassportONE invoice status; do not imply API submission.",
    ]}
    sections={[
      { title: "Monthly expense export", description: "Prepare a workbook for staff review and manual entry into the PassportONE portal.", kind: "form", fields: [{ label: "Participant", type: "select", options: ["Load participants"] }, { label: "Fiscal year", type: "select", options: ["Current", "Prior"] }, { label: "Month", type: "select", options: ["Select month"] }, { label: "Export status", type: "select", options: ["Draft", "Ready for review", "Exported"] }], action: "Generate participant workbook", callout: "Use the current Ministry spreadsheet template. Patty remains the portal submitter; no direct ministry integration." },
      { title: "Monthly submission tracker", description: "Track local preparation and manual submission progress per participant/month.", kind: "table", columns: ["Participant", "Period", "Expenses", "Receipts", "Export status", "Portal status", "Last updated"], emptyMessage: "Implement a separate internal tracker; do not claim portal status without user entry." },
      { title: "Audit receipt archive", description: "Retrieve historical receipt files per participant and date range for offline retention and audit response.", kind: "form", fields: [{ label: "Participant", type: "select", options: ["Load participants"] }, { label: "From date", type: "date" }, { label: "To date", type: "date" }, { label: "Category filter", type: "select", options: ["All categories"] }, { label: "Amount filter", type: "number", placeholder: "Optional amount" }], action: "Download receipt archive" },
      { title: "Audit files", description: "Keep receipts grouped in a predictable per-person, month-by-month structure.", kind: "table", columns: ["Period", "Participant", "Receipt count", "Archive created", "Created by", "Download"], emptyMessage: "Implement historical receipt indexing and downloadable archive bundles." },
    ]}
  />;
}
