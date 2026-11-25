import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOnboardingOverview } from "@/lib/api/client";
import { ApiError, ApiResponseError } from "@/lib/api/errors";
import type { OnboardingOverview, OnboardingUser } from "@/lib/api/types";
import { requireAdmin } from "@/lib/auth";
import { formatTimestamp } from "@/lib/dates";
import {
  isOnboardingComplete,
  onboardingSteps,
  userInitials,
  userRoleLabels,
  userStatusLabels,
} from "@/lib/onboarding";
import { TeamMemberActions } from "../team-member-actions";

export const metadata: Metadata = {
  title: "Team member · Torchlight Passport",
};

function DetailLoadError({ error }: { error: unknown }) {
  let detail = "The team API could not be reached. Check that the backend is running and try again.";

  if (error instanceof ApiError) {
    if (error.status === 501) {
      detail = "The team API is not implemented yet. AUTH-01 and AUDIT-LOG-01 must land before this screen can load real records.";
    } else if (error.status === 401 || error.status === 403) {
      detail = "Your account is not allowed to view this team member.";
    } else {
      detail = `The team API returned error ${error.status}. Try again or check the API logs.`;
    }
  } else if (error instanceof ApiResponseError) {
    detail = "The team API returned a response that did not match the shared contract. The page is refusing to render malformed data.";
  }

  return <section className="onboarding-error" role="alert">
    <p className="stub-eyebrow">Unable to load</p>
    <h2>We could not open this team member</h2>
    <p>{detail}</p>
    <Link className="onboarding-text-link" href="/admin/team">← Return to Team</Link>
  </section>;
}

export default async function TeamMemberPage({ params }: PageProps<"/admin/team/[id]">) {
  await requireAdmin();
  const { id } = await params;

  let overview: OnboardingOverview;
  try {
    overview = await getOnboardingOverview();
  } catch (error) {
    return <main className="team-detail-page"><DetailLoadError error={error} /></main>;
  }

  const user: OnboardingUser | undefined = overview.users.items.find((entry) => entry.id === id);
  if (!user) notFound();

  const steps = onboardingSteps(user);
  const completedSteps = steps.filter((step) => step.complete).length;
  const complete = isOnboardingComplete(user);
  const acknowledgement = user.training_acknowledgement;
  const trainingLabel = acknowledgement
    ? `Recorded ${formatTimestamp(acknowledgement.acknowledged_at)}`
    : "Not recorded";

  return <main className="team-detail-page">
    <Link className="team-back-link" href="/admin/team">← Team</Link>

    <header className="team-detail-header">
      <div className="team-detail-identity">
        <span className="team-detail-avatar" aria-hidden="true">{userInitials(user.display_name)}</span>
        <div>
          <p className="stub-eyebrow">Team member</p>
          <h1>{user.display_name}</h1>
          <p className="team-detail-email">{user.email}</p>
        </div>
      </div>
      <div className="team-detail-badges">
        <span className={`onboarding-status onboarding-status-${user.status}`}>{userStatusLabels[user.status]}</span>
        <span className="onboarding-role">{userRoleLabels[user.role]}</span>
      </div>
    </header>

    <div className="team-detail-layout">
      <section className="team-detail-panel" aria-labelledby="team-member-checklist-title">
        <header className="team-detail-panel-head">
          <div>
            <p className="stub-eyebrow">Server state</p>
            <h2 id="team-member-checklist-title">Onboarding checklist</h2>
            <p>Each step reflects the account, assignment, and training state returned by the API.</p>
          </div>
          <span className={`team-detail-progress${complete ? " is-complete" : ""}`}>
            {completedSteps}/{steps.length} steps
          </span>
        </header>

        <ul className="team-detail-checklist">
          {steps.map((step) => <li className={step.complete ? "is-complete" : undefined} key={step.key}>
            <span className="team-detail-step-mark" aria-hidden="true">{step.complete ? "✓" : ""}</span>
            <div>
              <strong>{step.label}</strong>
              <p>{step.detail}</p>
            </div>
          </li>)}
        </ul>

        {acknowledgement && <p className="team-detail-audit">
          {acknowledgement.material} · acknowledged by {acknowledgement.acknowledged_by_name} · recorded by {acknowledgement.recorded_by_name} on {formatTimestamp(acknowledgement.acknowledged_at)} · audit event {acknowledgement.audit_event_id.slice(0, 8)}…
        </p>}
      </section>

      <aside className="team-detail-side">
        <section className="team-detail-card" aria-labelledby="team-member-account-title">
          <h2 id="team-member-account-title">Account details</h2>
          <dl className="team-detail-facts">
            <div><dt>Status</dt><dd>{userStatusLabels[user.status]}</dd></div>
            <div><dt>Role</dt><dd>{userRoleLabels[user.role]}</dd></div>
            <div><dt>Invited</dt><dd><time dateTime={user.invited_at}>{formatTimestamp(user.invited_at)}</time></dd></div>
            <div>
              <dt>Participants</dt>
              <dd>{user.role === "admin" ? "Not applicable" : `${user.open_assignment_count} assigned`}</dd>
            </div>
            <div><dt>Training</dt><dd>{trainingLabel}</dd></div>
          </dl>
        </section>

        <section className="team-detail-card" aria-labelledby="team-member-actions-title">
          <h2 id="team-member-actions-title">Next step</h2>
          <TeamMemberActions resendAvailable={overview.resend_available} user={user} />
          <Link className="team-workspace-link" href="/admin/participants">
            Open participant workspace <span aria-hidden="true">→</span>
          </Link>
          <p className="team-detail-note">
            Assign or remove participants in FE-10. Those changes update the participant count on this checklist.
          </p>
        </section>
      </aside>
    </div>
  </main>;
}
