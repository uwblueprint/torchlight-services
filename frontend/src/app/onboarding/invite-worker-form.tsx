"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { UserRole } from "@/lib/api/types";
import { inviteRoleOptions } from "@/lib/onboarding";
import { inviteWorkerAction } from "./actions";
import { initialInviteFormState, type InviteField } from "./form-state";

const fieldLabels: Record<InviteField, string> = {
  email: "Work email",
  display_name: "Display name",
  role: "Role",
};

type InviteWorkerFormProps = {
  approvedDomains: string[];
};

export function InviteWorkerForm({ approvedDomains }: InviteWorkerFormProps) {
  const [state, formAction, pending] = useActionState(inviteWorkerAction, initialInviteFormState);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("passport_worker");
  const [hideResult, setHideResult] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status !== "idle") summaryRef.current?.focus();
  }, [state]);

  const showSuccess = state.status === "success" && !hideResult;
  const emailError = state.fieldErrors.email;
  const displayNameError = state.fieldErrors.display_name;
  const roleError = state.fieldErrors.role;
  const errorEntries = (Object.keys(state.fieldErrors) as InviteField[])
    .map((field) => [field, state.fieldErrors[field]] as const)
    .filter(([, message]) => Boolean(message));
  const domainList = approvedDomains.length > 0 ? approvedDomains.join(", ") : "none configured";

  function startAnotherInvite() {
    setEmail("");
    setDisplayName("");
    setRole("passport_worker");
    setHideResult(true);
  }

  return (
    <section className="onboarding-panel onboarding-invite" id="invite-worker" aria-labelledby="invite-worker-title">
      <div className="onboarding-panel-heading">
        <div>
          <p className="stub-eyebrow">New staff account</p>
          <h2 id="invite-worker-title">Invite a worker</h2>
          <p>Admins choose the role. Participants are assigned later in the participant workspace.</p>
        </div>
        <span className="onboarding-count-badge">AUTH-01</span>
      </div>

      {showSuccess ? (
        <div className="onboarding-invite-body">
          <div ref={summaryRef} tabIndex={-1} role="status" aria-live="polite" className="onboarding-message is-success">
            <strong>Invitation sent</strong>
            <p>{state.message}</p>
            <button type="button" className="onboarding-secondary-button" onClick={startAnotherInvite}>
              Invite another worker
            </button>
          </div>
        </div>
      ) : (
        <form
          className="onboarding-invite-body"
          action={formAction}
          noValidate
          onSubmit={() => setHideResult(false)}
        >
          {state.status === "error" && (
            <div ref={summaryRef} tabIndex={-1} role="alert" aria-live="polite" className="onboarding-message is-error">
              <strong>Check the form</strong>
              <p>{state.message}</p>
              {errorEntries.length > 0 && (
                <ul>
                  {errorEntries.map(([field, message]) => (
                    <li key={field}><strong>{fieldLabels[field]}:</strong> {message}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="onboarding-field">
            <label htmlFor="invite-email">Work email</label>
            <input
              id="invite-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              aria-required="true"
              aria-invalid={emailError ? true : undefined}
              aria-describedby={emailError ? "invite-email-hint invite-email-error" : "invite-email-hint"}
            />
            <p id="invite-email-hint" className="onboarding-hint">
              Lowercased and trimmed before sending. Approved domains: {domainList}.
            </p>
            {emailError && <p id="invite-email-error" className="onboarding-field-error">{emailError}</p>}
          </div>

          <div className="onboarding-field">
            <label htmlFor="invite-display-name">Display name</label>
            <input
              id="invite-display-name"
              name="display_name"
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
              aria-required="true"
              aria-invalid={displayNameError ? true : undefined}
              aria-describedby={displayNameError ? "invite-display-name-hint invite-display-name-error" : "invite-display-name-hint"}
            />
            <p id="invite-display-name-hint" className="onboarding-hint">Name shown in the staff workspace.</p>
            {displayNameError && <p id="invite-display-name-error" className="onboarding-field-error">{displayNameError}</p>}
          </div>

          <div className="onboarding-field">
            <label htmlFor="invite-role">Role</label>
            <select
              id="invite-role"
              name="role"
              value={role}
              onChange={(event) => setRole(event.target.value as UserRole)}
              required
              aria-required="true"
              aria-invalid={roleError ? true : undefined}
              aria-describedby={roleError ? "invite-role-hint invite-role-error" : "invite-role-hint"}
            >
              {inviteRoleOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <p id="invite-role-hint" className="onboarding-hint">
              Admins manage staff and participant records. Passport workers only see assigned participants.
            </p>
            {roleError && <p id="invite-role-error" className="onboarding-field-error">{roleError}</p>}
          </div>

          <button className="onboarding-primary-button" type="submit" disabled={pending}>
            {pending ? "Sending invitation…" : "Send invitation"}
          </button>
          <p className="onboarding-form-note">
            This creates an invited account only. No password, participant assignment, or worker signup is created here.
          </p>
        </form>
      )}
    </section>
  );
}
