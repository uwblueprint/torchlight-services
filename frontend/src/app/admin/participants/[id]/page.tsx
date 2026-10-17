import Link from "next/link";
import { PageStub } from "@/components/page-stub";

export const generateStaticParams = () => [{ id: "participant-id" }];

export default async function ParticipantDetailPage({ params }: PageProps<"/admin/participants/[id]">) {
  const { id } = await params;
  return <PageStub
    audience="Torchlight Admin"
    title="Participant workspace"
    description={`Admin-only participant detail route (record key: ${id}). Implement profile, annual allocation, agency splits, expense log, notes, and receipt history from real API data.`}
    developerTasks={[
      "Load the participant from the route id and handle not-found/unauthorized states.",
      "Implement approved profile fields and editable annual allocations, category baselines, and managing-agency splits.",
      "Show current and prior two fiscal-year allotment, spending, and available amounts by category.",
      "Add expense log actions and receipt record access with an audit trail.",
      "Preserve authorization: this detailed profile is for admin users; workers receive only assigned funding/transaction views.",
    ]}
    sections={[
      { title: "Participant information", kind: "form", fields: [{ label: "Full name", type: "text" }, { label: "PassportONE client code", type: "text" }, { label: "Status", type: "select", options: ["Active", "Inactive"] }, { label: "Fiscal year", type: "select", options: ["Current", "Prior year", "Two years prior"] }], action: "Save participant changes" },
      { title: "Funding allocations", description: "Support category baselines and multiple managing agencies when allocations are split.", kind: "table", columns: ["Category", "Managing agency", "Allocated", "Spent", "Available", "Fiscal year"], emptyMessage: "Load per-participant, per-agency budgets and ledger totals." },
      { title: "Expense log", kind: "table", columns: ["Date", "Description", "Category", "Amount", "Source", "Status", "Receipt"], emptyMessage: "Implement read/edit rules and monthly history for this participant." },
      { title: "Notes & follow-up", kind: "table", columns: ["Date", "Note", "Author", "Follow-up status"], emptyMessage: "Implement staff notes about expense/family conversations and receipt follow-up." },
    ]}
  ><p className="stub-inline-link"><Link href="/admin/participants">← Return to participant directory</Link></p></PageStub>;
}
