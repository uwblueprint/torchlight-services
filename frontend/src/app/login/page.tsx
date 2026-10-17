import { PageStub } from "@/components/page-stub";

export default function LoginPage() {
  return <PageStub
    audience="Shared"
    title="Sign in"
    description="The research flow has a shared login followed by role-specific Admin and Passport Worker dashboards. This page is a handoff stub only; there is no authentication service or session implementation in the repository yet."
    developerTasks={[
      "Implement the approved authentication provider/account lifecycle and secure session handling.",
      "Resolve a user's role on the server and route them to the correct authorized portal.",
      "Add validation, password reset/invitation flow, session expiry, sign-out, and error/loading states.",
      "Do not provide participant/caregiver self-service signup; account creation is for staff/worker roles.",
    ]}
    sections={[
      { title: "Account access", description: "Sign-in fields are intentionally disabled until authentication is implemented.", kind: "form", fields: [{ label: "Work email", type: "text", placeholder: "name@organization.ca" }, { label: "Password", type: "text", placeholder: "Authentication not connected" }], action: "Sign in", callout: "No credentials are accepted or stored by this prototype." },
      { title: "Role destinations", kind: "links", links: [{ label: "Worker portal stub", href: "/worker/dashboard" }, { label: "Admin portal stub", href: "/admin/dashboard" }, { label: "Worker onboarding stub", href: "/onboarding" }] },
    ]}
  />;
}
