import { PageStub } from "@/components/page-stub";

export default function CalculatorPage() {
  return <PageStub
    audience="Shared"
    title="Coverage calculator"
    description="Estimate Passport coverage and any out-of-pocket amount before an expense is purchased. This is a planning view; it must not imply approval or replace the Ministry's eligibility rules."
    developerTasks={[
      "Load category balance, applicable confirmed cap, and fiscal-year spend for the selected assigned participant.",
      "Calculate covered and uncovered amounts using shared backend business logic; never duplicate policy math in the UI.",
      "Present assumptions, amounts, and the selected fiscal year clearly; validate negative/invalid values.",
      "Link the result into the expense/receipt workflow without silently creating a ledger entry.",
    ]}
    sections={[
      { title: "Estimate an activity", description: "The flow board calls for an amount field, category selection, and a coverage calculation.", kind: "form", fields: [{ label: "Participant", type: "select", options: ["Load assigned participants"] }, { label: "Fiscal year", type: "select", options: ["Current fiscal year", "Prior fiscal year"] }, { label: "Category", type: "select", options: ["Load PassportONE categories"] }, { label: "Planned amount", type: "number", placeholder: "0.00" }], action: "Calculate coverage" },
      { title: "Coverage result", description: "Display funding available, Passport-covered amount, and out-of-pocket estimate with calculation assumptions.", kind: "metrics", items: ["Category balance", "Covered by Passport", "Out of pocket"] },
    ]}
  />;
}
