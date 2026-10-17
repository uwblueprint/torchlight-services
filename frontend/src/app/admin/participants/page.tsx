import Link from "next/link";
import { PageStub } from "@/components/page-stub";

export default function ParticipantsPage() {
  return <PageStub
    audience="Torchlight Admin"
    title="Participants & expense logs"
    description="The research flow has the admin view all users, open one person, and work with their funding and expense records. PassportONE instructions show a client-specific Expense Log with allotment, spent, and available amounts across the current and prior two years."
    developerTasks={[
      "Replace the directory and participant detail route with API-backed, searchable records; do not use names from source documents in fixtures.",
      "Implement a participant profile with admin editing, annual funding setup, and agency-specific budget splits.",
      "Show the participant's expense log and funding allotment/spending/available by fiscal year.",
      "Implement Add Expense and Generate Invoice as workflows that prepare internal records only; never submit to PassportONE.",
      "Keep worker access separate: workers may only see assigned participants' balances and transaction history, not full admin profiles.",
    ]}
    sections={[
      { title: "Find a participant", description: "Search/filter the authorized admin roster and open one participant.", kind: "form", fields: [{ label: "Search by name or client code", type: "search", placeholder: "Search participants" }, { label: "Status", type: "select", options: ["All", "Active", "Inactive"] }], action: "Search directory" },
      { title: "Participant directory", kind: "table", columns: ["Participant", "Client code", "Annual allocation", "Managing agency", "Status", "Open"], emptyMessage: "Load admin-authorized participant records and link each row to a participant detail page." },
      { title: "Individual participant workspace", description: "Define the detail view reached from a roster row.", kind: "links", links: [{ label: "Participant detail route (implement dynamic record)", href: "/admin/participants/demo" }, { label: "PassportONE categories reference", href: "/worker/submit" }] },
      { title: "Expense log requirements", description: "Use the source portal as a workflow reference; the local app prepares and tracks data but does not submit it to the Ministry.", kind: "checklist", items: ["Funding allotment, spending, and available by current + prior two fiscal years", "Expense rows with date, category, receipt, and amount", "Add Expense opens a Log Expense form", "Generate Invoice creates a draft submission workbook/form", "Preserve statuses and audit history; no direct PassportONE API submission"] },
    ]}
  ><p className="stub-inline-link"><Link href="/admin/reports">Continue to month-end exports and audit retrieval →</Link></p></PageStub>;
}
