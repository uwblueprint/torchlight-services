import { PageStub } from "@/components/page-stub";

export default function ShiftsPage() {
  return <PageStub
    audience="Passport Worker"
    title="Hours & mileage"
    description="Research flows call for workers to record working time and mileage for assigned participants. Exact meal eligibility, mileage rates, rounding, and reimbursement rules are not specified by the supplied materials."
    developerTasks={[
      "Load the worker's assigned participants and restrict this workflow to those participants.",
      "Implement start/end time entry, date, mileage, and optional work note fields.",
      "Validate time ordering and mileage input; keep policy-dependent calculations out until rates/rules are confirmed.",
      "List the worker's submitted shift records and provide edit/correction behavior according to the approved workflow.",
    ]}
    sections={[
      { title: "New work record", description: "Fields shown here are a work surface only; no hours or reimbursement are saved or calculated.", kind: "form", fields: [{ label: "Participant", type: "select", options: ["Load assigned participants"] }, { label: "Work date", type: "date" }, { label: "Start time", type: "text", placeholder: "HH:MM" }, { label: "End time", type: "text", placeholder: "HH:MM" }, { label: "Mileage (km)", type: "number", placeholder: "0.0" }, { label: "Work note", type: "textarea" }], action: "Save work record", callout: "No mileage rate or meal rule is assumed. Those details need to be wired to confirmed policy." },
      { title: "My submitted records", description: "History for the signed-in worker.", kind: "table", columns: ["Date", "Participant", "Start", "End", "Hours", "Mileage", "Status"], emptyMessage: "Implement worker-scoped shift history and lifecycle." },
    ]}
  />;
}
