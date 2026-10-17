import { PageStub } from "@/components/page-stub";

export default function SubmitExpensePage() {
  return <PageStub
    audience="Passport Worker"
    title="Add an expense"
    description="The research flow starts with a participant, then receipt upload, expense details, category selection, and a coverage check. PassportONE instructions show an Expense Log with an Add Expense action and a separate Log Expense form."
    developerTasks={[
      "Connect assigned-participant selection and receipt upload (PDF, JPEG, Word; size limit still needs implementing from an approved value).",
      "Support multiple expenses/receipts and show the current submission batch before saving.",
      "Add expense date, amount, vendor/description, category, and category subcategory fields based on PassportONE categories.",
      "Add non-AI receipt parsing only if included by scope; keep extracted values editable and flagged for review.",
      "Call the coverage calculator, show covered versus out-of-pocket, and save the expense against its participant and fiscal year.",
      "Record notes about the family/participant conversation where required; do not assume an acknowledgment rule in this UI stub.",
    ]}
    sections={[
      { title: "1 · Choose participant & receipt", description: "Upload a receipt by file picker or drag-and-drop. The supported source notes list PDF, JPEG, and Word documents; no Excel.", kind: "form", fields: [{ label: "Assigned participant", type: "select", options: ["Load worker assignments"] }, { label: "Receipt file", type: "file", placeholder: "PDF, JPEG, or Word document" }, { label: "Expense date", type: "date" }], action: "Upload receipt", callout: "Upload, storage, OCR, and persistence are not implemented. Use only fake test files." },
      { title: "2 · Log expense details", description: "Mirror the PassportONE Log Expense flow; add the item to a draft batch before generating a month-end export.", kind: "form", fields: [{ label: "Vendor / expense description", type: "text" }, { label: "Amount", type: "number", placeholder: "0.00" }, { label: "Category", type: "select", options: ["Load category catalog"] }, { label: "Subcategory", type: "select", options: ["Show where category has subcategories"] }, { label: "Other category detail", type: "text", placeholder: "Required when Other is selected" }, { label: "Worker note", type: "textarea", placeholder: "Optional context for admin review" }], action: "+ Add Expense" },
      { title: "PassportONE categories", description: "Category labels and subcategories transcribed from P1PictureInstructions.pdf. This is a UI reference; verify the live portal/template before export logic.", kind: "categories" },
      { title: "Draft expense log", description: "Allow workers to manage only their own submissions; keep other-source expenses visible but read-only.", kind: "table", columns: ["Date", "Expense", "Category", "Amount", "Coverage", "Receipt", "Status"], emptyMessage: "Implement a removable/editable draft row list and submission workflow." },
    ]}
  />;
}
