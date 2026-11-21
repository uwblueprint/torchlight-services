"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { OnboardingUser } from "@/lib/api/types";
import { initialRowActionState } from "./form-state";
import { recordTrainingAction, resendInviteAction } from "./actions";

type WorkerRowActionsProps = {
  user: OnboardingUser;
  resendAvailable: boolean;
};

export function WorkerRowActions({ user, resendAvailable }: WorkerRowActionsProps) {
  const [resendState, resendAction, resendPending] = useActionState(resendInviteAction, initialRowActionState);
  const [trainingState, trainingAction, trainingPending] = useActionState(recordTrainingAction, initialRowActionState);

  const canResend = resendAvailable && user.status === "invited";
  const canRecordTraining = user.status === "active" && !user.training_acknowledgement;
  const hasMessage = resendState.status !== "idle" || trainingState.status !== "idle";

  return (
    <div className="onboarding-row-actions">
      {canResend && (
        <form action={resendAction} className="onboarding-inline-form">
          <input type="hidden" name="user_id" value={user.id} />
          <button type="submit" className="onboarding-secondary-button" disabled={resendPending}>
            {resendPending ? "Resending…" : "Resend invite"}
          </button>
        </form>
      )}

      {canRecordTraining && (
        <form action={trainingAction} className="onboarding-inline-form">
          <input type="hidden" name="user_id" value={user.id} />
          <button type="submit" className="onboarding-secondary-button" disabled={trainingPending}>
            {trainingPending ? "Recording…" : "Record training ack"}
          </button>
        </form>
      )}

      <Link className="onboarding-row-link" href="/admin/participants">Assign participants</Link>

      {hasMessage && (
        <div className="onboarding-row-message" aria-live="polite">
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
