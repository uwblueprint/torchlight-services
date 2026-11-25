"use client";

import { useActionState, useEffect, useRef, useState, type MouseEvent } from "react";
import type { UserRole } from "@/lib/api/types";
import { inviteWorkerAction } from "./actions";
import { initialInviteFormState, type InviteField } from "./form-state";
import { CloseIcon, MailIcon, SearchIcon, UserIcon } from "./team-icons";

const fieldLabels: Record<InviteField, string> = {
  email: "Email",
  display_name: "Full name",
  role: "Role",
};

const permissionRows = [
  { area: "Receipts", detail: "Review, approve and export" },
  { area: "Funding", detail: "Budgets and category limits" },
  { area: "Participants", detail: "All participants and their funding" },
  { area: "Passport workers", detail: "Add, edit and archive workers" },
  { area: "Admins", detail: "Add, edit and archive admins" },
];

type AddTeamMemberModalProps = {
  approvedDomains: string[];
  onClose: () => void;
};

export function AddTeamMemberModal({ approvedDomains, onClose }: AddTeamMemberModalProps) {
  const [state, formAction, pending] = useActionState(inviteWorkerAction, initialInviteFormState);
  const [role, setRole] = useState<UserRole>("passport_worker");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const summaryRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const pendingRef = useRef(pending);

  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    nameRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      // Dismissal is ignored mid-submit so the result message is not lost.
      if (event.key === "Escape") {
        if (!pendingRef.current) onClose();
        return;
      }
      if (event.key !== "Tab" || !modalRef.current) return;

      const focusable = [...modalRef.current.querySelectorAll<HTMLElement>(
        "button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href]",
      )].filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  useEffect(() => {
    if (state.status !== "idle") summaryRef.current?.focus();
  }, [state]);

  const emailError = state.fieldErrors.email;
  const displayNameError = state.fieldErrors.display_name;
  const roleError = state.fieldErrors.role;
  const errorEntries = (Object.keys(state.fieldErrors) as InviteField[])
    .map((field) => [field, state.fieldErrors[field]] as const)
    .filter(([, message]) => Boolean(message));
  const domainList = approvedDomains.length > 0 ? approvedDomains.join(", ") : "none configured";
  const canSubmit = email.trim().length > 0 && displayName.trim().length > 0 && !pending;

  function closeFromBackdrop(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget && !pending) onClose();
  }

  const worker = role === "passport_worker";

  return <div className="team-modal-backdrop" onMouseDown={closeFromBackdrop}>
    <section
      aria-labelledby="add-team-member-title"
      aria-modal="true"
      className="team-modal"
      ref={modalRef}
      role="dialog"
    >
      <header className="team-modal-head">
        <h2 id="add-team-member-title">Add team member</h2>
        <button aria-label="Close add team member" className="team-modal-close" onClick={onClose} type="button">
          <CloseIcon />
        </button>
      </header>

      {state.status === "success" ? (
        <>
          <div className="team-modal-body team-modal-success" ref={summaryRef} role="status" tabIndex={-1}>
            <span className="team-success-mark" aria-hidden="true">✓</span>
            <h3>Invitation sent</h3>
            <p>{state.message}</p>
            <p>Open the member’s detail view to review onboarding or resend the invitation.</p>
          </div>
          <footer className="team-modal-footer">
            <span />
            <button className="team-modal-submit" onClick={onClose} type="button">Done</button>
          </footer>
        </>
      ) : (
        <form action={formAction} noValidate>
          <div className="team-modal-body">
            {state.status === "error" && (
              <div
                aria-live="polite"
                className="team-modal-message is-error"
                ref={summaryRef}
                role="alert"
                tabIndex={-1}
              >
                <strong>Check the form</strong>
                <p>{state.message}</p>
                {errorEntries.length > 0 && <ul>
                  {errorEntries.map(([field, message]) => (
                    <li key={field}><strong>{fieldLabels[field]}:</strong> {message}</li>
                  ))}
                </ul>}
              </div>
            )}

            <div aria-label="Role" className="team-role-toggle" role="group">
              <button
                aria-pressed={worker}
                className={worker ? "is-active" : undefined}
                onClick={() => setRole("passport_worker")}
                type="button"
              >
                Passport worker
              </button>
              <button
                aria-pressed={!worker}
                className={!worker ? "is-active" : undefined}
                onClick={() => setRole("admin")}
                type="button"
              >
                Admin
              </button>
              <input name="role" type="hidden" value={role} />
            </div>
            {roleError && <p className="team-field-error">{roleError}</p>}

            <div className="team-form-grid">
              <div className="team-field">
                <label htmlFor="team-member-name">Full name</label>
                <input
                  aria-describedby={displayNameError ? "team-member-name-error" : undefined}
                  aria-invalid={displayNameError ? true : undefined}
                  aria-required="true"
                  autoComplete="name"
                  id="team-member-name"
                  name="display_name"
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder={worker ? "e.g. Avery Example" : "e.g. Priya Desai"}
                  ref={nameRef}
                  required
                  type="text"
                  value={displayName}
                />
                {displayNameError && <p className="team-field-error" id="team-member-name-error">{displayNameError}</p>}
              </div>

              <div className="team-field">
                <label htmlFor="team-member-email">Email</label>
                <input
                  aria-describedby={emailError ? "team-member-email-hint team-member-email-error" : "team-member-email-hint"}
                  aria-invalid={emailError ? true : undefined}
                  aria-required="true"
                  autoComplete="email"
                  id="team-member-email"
                  inputMode="email"
                  name="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@torchlight.example"
                  required
                  type="email"
                  value={email}
                />
                <p className="team-field-hint" id="team-member-email-hint">Approved domains: {domainList}.</p>
                {emailError && <p className="team-field-error" id="team-member-email-error">{emailError}</p>}
              </div>
            </div>

            {worker ? (
              <>
                <div className="team-field">
                  <label htmlFor="team-member-participants">
                    Assign participants <span className="team-optional">(optional)</span>
                  </label>
                  <div className="team-assign-field">
                    <SearchIcon />
                    <input
                      aria-describedby="team-member-participants-hint"
                      disabled
                      id="team-member-participants"
                      placeholder="Assign after the invitation"
                      type="search"
                    />
                  </div>
                  <p className="team-field-hint" id="team-member-participants-hint">
                    Participant assignments are managed from the participant workspace (FE-10) once the account exists.
                  </p>
                </div>
                <div className="team-modal-note">
                  <UserIcon />
                  <p>Passport workers can add receipts, hours and mileage, and see funding for the participants assigned to them.</p>
                </div>
              </>
            ) : (
              <>
                <fieldset className="team-permissions" disabled>
                  <legend className="onboarding-sr-only">Admin permissions</legend>
                  <div className="team-permissions-head">
                    <div>
                      <strong>Permissions</strong>
                      <p>Choose what this admin can see and change, or pick a preset.</p>
                    </div>
                    <select aria-label="Permission preset" defaultValue="pending">
                      <option value="pending">Pending AUTH-01</option>
                    </select>
                  </div>
                  <div className="team-permissions-table">
                    <div className="team-permissions-row is-head" aria-hidden="true">
                      <span>Area</span>
                      <span>Access</span>
                    </div>
                    {permissionRows.map((row) => <div className="team-permissions-row" key={row.area}>
                      <div><strong>{row.area}</strong><span>{row.detail}</span></div>
                      <select aria-label={`${row.area} access`} defaultValue="pending">
                        <option value="pending">Pending</option>
                      </select>
                    </div>)}
                  </div>
                  <p className="team-field-hint">
                    Permission presets are not saved until AUTH-01 defines the admin authorization model.
                  </p>
                </fieldset>
                <div className="team-modal-note">
                  <UserIcon />
                  <p>Admins manage staff, participant records, funding, and receipt review. Access is checked on the server.</p>
                </div>
              </>
            )}
          </div>

          <footer className="team-modal-footer">
            <button className="team-modal-cancel" onClick={onClose} type="button">Cancel</button>
            <button className="team-modal-submit" disabled={!canSubmit} type="submit">
              <MailIcon />
              {pending ? "Sending…" : "Send invite"}
            </button>
          </footer>
        </form>
      )}
    </section>
  </div>;
}
