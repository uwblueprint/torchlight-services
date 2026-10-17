import { PageStub } from "@/components/page-stub";

export default function OnboardingPage() {
  return <PageStub
    audience="Passport Worker"
    title="Worker onboarding"
    description="The flow board starts with onboarding before login. The SOW describes staff onboarding/training; account approval, participant assignment, and offboarding must be implemented as an authorized admin-managed workflow."
    developerTasks={[
      "Define invite/account provisioning and approval with the admin/auth implementation.",
      "Capture only required worker information and keep participant assignment under admin control.",
      "Provide staff orientation steps for expense submission, receipt review, and privacy boundaries.",
      "Implement onboarding status and completion audit record; do not expose a public participant signup route.",
    ]}
    sections={[
      { title: "Onboarding stages", kind: "checklist", items: ["Worker account invited and verified", "Role assigned by authorized admin", "Participant assignments configured by authorized admin", "Training completed: receipt, expense, and time-entry flow", "Privacy/access expectations acknowledged"] },
      { title: "Invite worker", description: "Admin-operated invitation form; backend and identity checks are not connected.", kind: "form", fields: [{ label: "Work email", type: "text" }, { label: "Display name", type: "text" }, { label: "Role", type: "select", options: ["Passport Worker", "Admin"] }], action: "Send invite" },
    ]}
  />;
}
