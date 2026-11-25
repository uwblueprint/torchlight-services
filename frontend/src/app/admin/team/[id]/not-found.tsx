import Link from "next/link";

export default function TeamMemberNotFound() {
  return <main className="team-detail-page">
    <section className="onboarding-empty team-detail-not-found">
      <p className="stub-eyebrow">Team member</p>
      <h1>Account not found</h1>
      <p>This team member does not exist, or your account is not allowed to view the record.</p>
      <Link className="onboarding-text-link" href="/admin/team">← Return to Team</Link>
    </section>
  </main>;
}
