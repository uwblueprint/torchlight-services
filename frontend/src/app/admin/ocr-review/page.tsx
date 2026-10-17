import { PageStub } from "@/components/page-stub";

export default function ReceiptReviewPage() {
  return <PageStub
    audience="Torchlight Admin"
    title="Receipt follow-up & categorization"
    description="Admins review unclear or incomplete receipts, assign a PassportONE category, and maintain person-by-person audit records. Research notes explicitly say not to use AI; low-confidence/unclear details should be flagged for staff follow-up."
    developerTasks={[
      "Query real receipt and expense records and identify missing fields or extraction confidence requiring review.",
      "Build a side-by-side receipt viewer and editable metadata form; record reviewer and changes in audit history.",
      "Support categorization against the PassportONE catalog and conditional subcategory selection.",
      "Add follow-up state, owner, and note; never automatically approve or post a receipt.",
      "Expose filtered participant/date/category views used by export and audit workflows.",
    ]}
    sections={[
      { title: "Review queue", description: "Filter receipts needing missing-information follow-up or category review.", kind: "form", fields: [{ label: "Participant", type: "select", options: ["Load participants"] }, { label: "Receipt date", type: "date" }, { label: "Review status", type: "select", options: ["Needs review", "Needs follow-up", "Reviewed"] }, { label: "Category", type: "select", options: ["Load PassportONE categories"] }], action: "Apply filters" },
      { title: "Receipts requiring action", kind: "table", columns: ["Uploaded", "Participant", "Receipt / vendor", "Amount", "Category", "Issue", "Reviewer"], emptyMessage: "Connect receipt ingestion and review states; do not fabricate sample receipt data." },
      { title: "Receipt review workspace", description: "Show source receipt beside editable details and history.", kind: "checklist", items: ["Receipt image/document preview", "Participant and expense link", "Date and amount correction", "PassportONE category and subcategory", "Follow-up note and reviewer attribution", "Save / return to queue without auto-approval"] },
    ]}
  />;
}
