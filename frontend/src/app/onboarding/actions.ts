"use server";

import { revalidatePath } from "next/cache";
import {
  getOnboardingOverview,
  inviteWorker,
  recordTrainingAcknowledgement,
  resendInvite,
} from "@/lib/api/client";
import { ApiError, ApiResponseError } from "@/lib/api/errors";
import type { InviteWorkerInput, UserRole, ValidationIssue } from "@/lib/api/types";
import { getAdminSession } from "@/lib/auth";
import type { InviteField, InviteFieldErrors, InviteFormState, RowActionState } from "./form-state";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_DISPLAY_NAME = 120;

function readValue(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function emailDomain(email: string): string {
  const at = email.lastIndexOf("@");
  return at === -1 ? "" : email.slice(at + 1);
}

function roleFromForm(value: string): UserRole | null {
  return value === "admin" || value === "passport_worker" ? value : null;
}

function fieldForIssue(issue: ValidationIssue): InviteField | null {
  const location = issue.loc.map(String);
  if (location.includes("email")) return "email";
  if (location.includes("display_name")) return "display_name";
  if (location.includes("role")) return "role";
  return null;
}

function formError(message: string, fieldErrors: InviteFieldErrors = {}): InviteFormState {
  return { status: "error", message, fieldErrors };
}

function rowError(message: string): RowActionState {
  return { status: "error", message };
}

function rowSuccess(message: string): RowActionState {
  return { status: "success", message };
}

function sessionFormError(): InviteFormState {
  return formError("Your admin session has expired. Sign in again before inviting staff.");
}

function sessionRowError(): RowActionState {
  return rowError("Your admin session has expired. Sign in again and retry.");
}

function inviteFailure(error: unknown): InviteFormState {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return formError("A staff account with this email already exists.", {
        email: "Use Resend for an invited account, or choose a different address.",
      });
    }

    if (error.status === 422) {
      const fieldErrors: InviteFieldErrors = {};
      if (Array.isArray(error.detail)) {
        for (const issue of error.detail) {
          const field = fieldForIssue(issue);
          if (field && !fieldErrors[field]) {
            fieldErrors[field] = issue.msg || "The server rejected this value.";
          }
        }
      }
      if (Object.keys(fieldErrors).length > 0) {
        return formError("The server rejected some of these values. Check the fields and try again.", fieldErrors);
      }
      return formError("The server rejected this invitation. Check the email domain and role, then try again.");
    }

    if (error.status === 401 || error.status === 403) {
      return formError("Your account is not allowed to invite staff. Sign in with an active admin account.");
    }
    if (error.status === 501) {
      return formError("The invite API is not implemented yet. AUTH-01 must land before invitations can be sent.");
    }
    return formError(`The invitation could not be sent (error ${error.status}). Try again.`);
  }

  if (error instanceof ApiResponseError) {
    return formError("The server returned an invitation response that did not match the shared contract. Try again.");
  }
  return formError("The invitation could not be sent. Check the API connection and try again.");
}

function rowFailure(error: unknown, action: "resend" | "training"): RowActionState {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      revalidatePath("/onboarding");
      return rowError(action === "resend"
        ? "This account is no longer awaiting an invitation. The list has been refreshed."
        : "Training is already recorded for this account. The list has been refreshed.");
    }
    if (error.status === 404) {
      revalidatePath("/onboarding");
      return rowError("That account no longer exists. The list has been refreshed.");
    }
    if (error.status === 401 || error.status === 403) {
      return rowError("Your account is not allowed to change this record.");
    }
    if (error.status === 501) {
      return rowError(action === "resend"
        ? "The invite API is not implemented yet. AUTH-01 must land before invitations can be resent."
        : "The training acknowledgment API is not implemented yet. AUDIT-LOG-01 must land before this can be recorded.");
    }
    return rowError(`${action === "resend" ? "The invitation" : "The training acknowledgment"} could not be saved (error ${error.status}). Try again.`);
  }

  if (error instanceof ApiResponseError) {
    return rowError("The server returned a response that did not match the shared contract. Try again.");
  }
  return rowError("The server could not be reached. Check the API connection and try again.");
}

export async function inviteWorkerAction(
  _previousState: InviteFormState,
  formData: FormData,
): Promise<InviteFormState> {
  const admin = await getAdminSession();
  if (!admin || admin.role !== "admin" || admin.status !== "active") return sessionFormError();

  const email = normalizeEmail(readValue(formData, "email"));
  const displayName = readValue(formData, "display_name").trim();
  const role = roleFromForm(readValue(formData, "role"));
  const fieldErrors: InviteFieldErrors = {};

  if (!email) {
    fieldErrors.email = "Enter a work email address.";
  } else if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    fieldErrors.email = "Enter an email address like name@torchlight.example.";
  }

  if (!displayName) {
    fieldErrors.display_name = "Enter the worker's display name.";
  } else if (displayName.length > MAX_DISPLAY_NAME) {
    fieldErrors.display_name = `Keep the display name to ${MAX_DISPLAY_NAME} characters or fewer.`;
  }

  if (!role) fieldErrors.role = "Choose a role.";

  if (!role || Object.keys(fieldErrors).length > 0) {
    return formError("Check the highlighted fields and try again.", fieldErrors);
  }

  let approvedDomains: string[];
  try {
    approvedDomains = (await getOnboardingOverview()).approved_email_domains
      .map((domain) => domain.trim().toLowerCase().replace(/^@/, ""))
      .filter(Boolean);
  } catch {
    return formError("We could not check AUTH-01's approved email domains. Try again.");
  }

  if (approvedDomains.length === 0) {
    return formError("No approved email domains are configured yet. AUTH-01 must provide the allowlist before invitations can be sent.", {
      email: "The approved-domain list is empty.",
    });
  }

  const domain = emailDomain(email);
  if (!approvedDomains.includes(domain)) {
    return formError(`Use an approved work email domain: ${approvedDomains.join(", ")}.`, {
      email: `That domain is not on AUTH-01's approved list. Use ${approvedDomains.join(" or ")}.`,
    });
  }

  const input: InviteWorkerInput = { email, display_name: displayName, role };
  try {
    const created = await inviteWorker(input);
    revalidatePath("/onboarding");
    return {
      status: "success",
      message: `Invitation sent to ${created.email}. The account is listed as invited until AUTH-01 confirms acceptance.`,
      fieldErrors: {},
    };
  } catch (error) {
    return inviteFailure(error);
  }
}

export async function resendInviteAction(
  _previousState: RowActionState,
  formData: FormData,
): Promise<RowActionState> {
  const admin = await getAdminSession();
  if (!admin || admin.role !== "admin" || admin.status !== "active") return sessionRowError();

  const userId = readValue(formData, "user_id");
  if (!UUID_PATTERN.test(userId)) return rowError("That account could not be found. Refresh the page and try again.");

  try {
    const updated = await resendInvite(userId);
    revalidatePath("/onboarding");
    return rowSuccess(`Invitation resent to ${updated.email}.`);
  } catch (error) {
    return rowFailure(error, "resend");
  }
}

export async function recordTrainingAction(
  _previousState: RowActionState,
  formData: FormData,
): Promise<RowActionState> {
  const admin = await getAdminSession();
  if (!admin || admin.role !== "admin" || admin.status !== "active") return sessionRowError();

  const userId = readValue(formData, "user_id");
  if (!UUID_PATTERN.test(userId)) return rowError("That account could not be found. Refresh the page and try again.");

  try {
    const updated = await recordTrainingAcknowledgement(userId);
    revalidatePath("/onboarding");
    return rowSuccess(`Training acknowledgment recorded for ${updated.display_name}. The audit event includes the actor and timestamp.`);
  } catch (error) {
    return rowFailure(error, "training");
  }
}
