import Link from "next/link";

export default function OnboardingForbidden() {
  return (
    <main className="onboarding-access-denied">
      <section className="onboarding-access-card">
        <p className="stub-eyebrow">Torchlight Admin</p>
        <h1>Admin access required</h1>
        <p>
          Worker onboarding is limited to active administrators. Your session could not be
          verified on the server, so no staff records or checklist data were loaded.
        </p>
        <p>If you believe you should have access, contact a Torchlight administrator.</p>
        <Link className="onboarding-primary-link" href="/login">Go to sign in</Link>
      </section>
    </main>
  );
}
