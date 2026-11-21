import Link from "next/link";
import type { OnboardingUser } from "@/lib/api/types";
import { formatTimestamp } from "@/lib/dates";
import {
  isOnboardingComplete,
  onboardingSteps,
  userInitials,
  userRoleLabels,
  userStatusLabels,
} from "@/lib/onboarding";
import { WorkerRowActions } from "./worker-row-actions";

type OnboardingRosterProps = {
  users: OnboardingUser[];
  resendAvailable: boolean;
};

function WorkerCard({ user, resendAvailable }: { user: OnboardingUser; resendAvailable: boolean }) {
  const steps = onboardingSteps(user);
  const completedSteps = steps.filter((step) => step.complete).length;
  const complete = isOnboardingComplete(user);
  const acknowledgement = user.training_acknowledgement;

  return (
    <article className="onboarding-worker" aria-labelledby={`worker-${user.id}`}>
      <div className="onboarding-worker-head">
        <div className="onboarding-worker-identity">
          <span className="onboarding-worker-avatar" aria-hidden="true">{userInitials(user.display_name)}</span>
          <div>
            <h3 id={`worker-${user.id}`}>{user.display_name}</h3>
            <p>{user.email}</p>
          </div>
        </div>
        <div className="onboarding-worker-badges">
          <span className={`onboarding-status onboarding-status-${user.status}`}>{userStatusLabels[user.status]}</span>
          <span className="onboarding-role">{userRoleLabels[user.role]}</span>
        </div>
      </div>

      <div className="onboarding-worker-meta">
        <span>Invited {formatTimestamp(user.invited_at)}</span>
        <span>{user.open_assignment_count} open assignment{user.open_assignment_count === 1 ? "" : "s"}</span>
        <span>{completedSteps} of {steps.length} onboarding steps</span>
      </div>

      <ul className="onboarding-checklist" aria-label={`Onboarding checklist for ${user.display_name}`}>
        {steps.map((step) => (
          <li key={step.key} className={step.complete ? "is-complete" : undefined}>
            <span className="onboarding-step-mark" aria-hidden="true">{step.complete ? "✓" : ""}</span>
            <div>
              <strong>{step.label}</strong>
              <p>{step.detail}</p>
            </div>
          </li>
        ))}
      </ul>

      {acknowledgement && (
        <p className="onboarding-audit-note">
          {acknowledgement.material} · acknowledged by {acknowledgement.acknowledged_by_name} · recorded by {acknowledgement.recorded_by_name} on {formatTimestamp(acknowledgement.acknowledged_at)} · audit event {acknowledgement.audit_event_id.slice(0, 8)}…
        </p>
      )}

      <div className="onboarding-worker-footer">
        <span className={`onboarding-completion ${complete ? "is-complete" : ""}`}>
          {complete ? "Onboarding complete" : "Onboarding pending"}
        </span>
        <WorkerRowActions user={user} resendAvailable={resendAvailable} />
      </div>

      <p className="onboarding-handoff">
        <Link href="/admin/participants">Assign participants in the participant workspace →</Link>
      </p>
    </article>
  );
}

export function OnboardingRoster({ users, resendAvailable }: OnboardingRosterProps) {
  return (
    <section className="onboarding-panel onboarding-roster" aria-labelledby="onboarding-roster-title">
      <div className="onboarding-panel-heading">
        <div>
          <p className="stub-eyebrow">Server state</p>
          <h2 id="onboarding-roster-title">Staff accounts</h2>
          <p>Each checklist reads the account, assignment, and training audit state returned by the API.</p>
        </div>
        <Link className="onboarding-secondary-link" href="#invite-worker">Invite a worker</Link>
      </div>

      {users.length === 0 ? (
        <div className="onboarding-empty">
          <h3>No staff accounts yet</h3>
          <p>Invite the first worker to start the onboarding checklist. No account is created until the invite succeeds.</p>
          <Link className="onboarding-text-link" href="#invite-worker">Invite the first worker →</Link>
        </div>
      ) : (
        <div className="onboarding-worker-list">
          {users.map((user) => (
            <WorkerCard key={user.id} user={user} resendAvailable={resendAvailable} />
          ))}
        </div>
      )}
    </section>
  );
}
