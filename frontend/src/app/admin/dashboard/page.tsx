import { PageStub } from "@/components/page-stub";

export default function AdminDashboard() {
  return <PageStub
    audience="Torchlight Admin"
    title="Admin dashboard"
    description="The research flow calls for all-user access, a roster that opens an individual participant profile, recent activity, funding stats, and notes/messages that need follow-up."
    developerTasks={[
      "Load all authorized users and participants; support opening a selected participant profile.",
      "Build recent activity from auditable events such as receipt uploads, expense updates, and invoice status changes.",
      "Calculate funding amount, where funding is allocated, and funding spent from approved records.",
      "Add a follow-up inbox for missing/unclear receipts and client/staff notes.",
      "Keep all amounts and people sourced from the API; remove example counts and fake values.",
    ]}
    sections={[
      { title: "Workspace at a glance", kind: "metrics", items: ["Users / participants", "Funding allocated", "Funding spent", "Needs follow-up"] },
      { title: "All participants", description: "Select a person to open their funding and expense log.", kind: "table", columns: ["Participant", "Client code", "Funding", "Spent", "Available", "Follow-up"], emptyMessage: "Connect the admin-scoped participant directory; selecting a row should open its profile." },
      { title: "Recent activity", description: "Examples from the research flow include who uploaded a document and when an invoice was sent.", kind: "table", columns: ["Time", "Person", "Activity", "Related record", "Actor"], emptyMessage: "Implement an activity feed from backend audit/activity records." },
      { title: "Notes & messages", description: "Surface receipts and records that need staff follow-up.", kind: "table", columns: ["Date", "Participant", "Follow-up item", "Owner", "Status"], emptyMessage: "Implement follow-up notes and owner/status behavior." },
    ]}
  />;
}
