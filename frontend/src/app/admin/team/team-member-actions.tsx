"use client";

import { useActionState } from "react";
import type { OnboardingUser } from "@/lib/api/types";
import { initialRowActionState } from "./form-state";
import { recordTrainingAction, resendInviteAction } from "./actions";

type TeamMemberActionsProps = {
  user: OnboardingUser;
  resendAvailable: boolean;
};

export function TeamMemberActions({ user, resendAvailable }: TeamMemberActionsProps) {
  const [resendState, resendAction, resendPending] = useActionState(resendInviteAction, initialRowActionState);
  const [trainingState, trainingAction, trainingPending] = useActionState(recordTrainingAction, initialRowActionState);

  const canResend = resendAvailable && user.status === "invited";
  const canRecordTraining = user.status === "active" && !user.training_acknowledgement;
  const hasMessage = resendState.status !== "idle" || trainingState.status !== "idle";

  if (!canResend && !canRecordTraining && !hasMessage) {
    return <p className="team-action-empty">No onboarding actions are waiting for this account.</p>;
  }

  return (
    <div className="team-member-actions">
      {canResend && (
        <form action={resendAction}>
          <input type="hidden" name="user_id" value={user.id} />
          <button className="team-action-button" disabled={resendPending} type="submit">
            {resendPending ? "Resending…" : "Resend invite"}
          </button>
        </form>
      )}

      {canRecordTraining && (
        <form action={trainingAction}>
          <input type="hidden" name="user_id" value={user.id} />
          <button className="team-action-button" disabled={trainingPending} type="submit">
            {trainingPending ? "Recording…" : "Record training acknowledgment"}
          </button>
        </form>
      )}

      {hasMessage && (
        <div aria-live="polite" className="team-action-message">
          {resendState.status !== "idle" && (
            <p className={resendState.status === "error" ? "is-error" : "is-success"} role={resendState.status === "error" ? "alert" : "status"}>
              {resendState.message}
            </p>
          )}
          {trainingState.status !== "idle" && (
            <p className={trainingState.status === "error" ? "is-error" : "is-success"} role={trainingState.status === "error" ? "alert" : "status"}>
              {trainingState.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
