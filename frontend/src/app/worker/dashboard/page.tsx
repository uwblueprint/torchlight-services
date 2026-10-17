import { PageStub } from "@/components/page-stub";

export default function WorkerDashboard() {
  return <PageStub
    audience="Passport Worker"
    title="My participants"
    description="Workers can search their own assigned participants, view balance and transaction information needed for planning, and start receipt or work-hour entry. The participant switcher and all records must remain assignment-scoped."
    developerTasks={[
      "Implement a worker-scoped participant search and selected-participant state shared across worker pages.",
      "Show only necessary participant label/client code, not full profile or unrelated records.",
      "Show current/prior two fiscal years of category allotment, spend, and available balance.",
      "Show a bank-statement-style transaction history with receipt access and status.",
      "Wire add expense, calculator, and work hours/mileage entry to the selected participant.",
    ]}
    sections={[
      { title: "Find an assigned participant", description: "Search for a different assigned person, as shown in Research & flows.", kind: "form", fields: [{ label: "Participant", type: "search", placeholder: "Search your assigned participants" }], action: "Open participant view" },
      { title: "Funding at a glance", description: "Participant switcher selection controls the balance/history shown below.", kind: "metrics", items: ["Allocated this fiscal year", "Spent this fiscal year", "Available to plan"] },
      { title: "Category balances & transaction history", description: "Only funding and transaction information for the currently selected assigned participant.", kind: "table", columns: ["Date", "Expense / receipt", "Category", "Allocated", "Spent", "Available", "Status"], emptyMessage: "Connect assigned participant and expense/budget APIs; add fiscal-year selector." },
      { title: "Quick actions", kind: "links", links: [{ label: "Upload receipt / add expense", href: "/worker/submit" }, { label: "Check activity coverage", href: "/worker/calculator" }, { label: "Record working hours or mileage", href: "/worker/shifts" }] },
    ]}
  />;
}
