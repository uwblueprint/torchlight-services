import type { OnboardingUser, UserRole, UserStatus } from "@/lib/api/types";
import { formatTimestamp } from "@/lib/dates";

export const userRoleLabels: Record<UserRole, string> = {
  admin: "Admin",
  passport_worker: "Passport worker",
};

export const userStatusLabels: Record<UserStatus, string> = {
  invited: "Invited",
  active: "Active",
  suspended: "Suspended",
  deactivated: "Deactivated",
};

export const inviteRoleOptions: { value: UserRole; label: string }[] = [
  { value: "passport_worker", label: "Passport worker" },
  { value: "admin", label: "Admin" },
];

export function userInitials(displayName: string): string {
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return initials || "?";
}

export type OnboardingStep = {
  key: string;
  label: string;
  detail: string;
  complete: boolean;
};

export function onboardingSteps(user: OnboardingUser): OnboardingStep[] {
  const assignmentsRequired = user.role === "passport_worker";
  const hasAssignments = user.open_assignment_count > 0;

  return [
    {
      key: "invited",
      label: "Account invited",
      detail: `Invite sent ${formatTimestamp(user.invited_at)}.`,
      complete: true,
    },
    {
      key: "active",
      label: "Account active",
      detail: user.status === "active"
        ? "The account can sign in."
        : user.status === "invited"
          ? "The invite has not been accepted yet."
          : user.status === "suspended"
            ? "Sign-in is paused for this account."
            : "This account has been deactivated.",
      complete: user.status === "active",
    },
    {
      key: "role",
      label: "Role assigned",
      detail: `Assigned as ${userRoleLabels[user.role]}.`,
      complete: true,
    },
    {
      key: "assignments",
      label: "Participants assigned",
      detail: !assignmentsRequired
        ? "Not required for admin accounts."
        : hasAssignments
          ? `${user.open_assignment_count} open participant assignment${user.open_assignment_count === 1 ? "" : "s"}.`
          : "No open participant assignments.",
      complete: assignmentsRequired ? hasAssignments : true,
    },
    {
      key: "training",
      label: "Training acknowledged",
      detail: user.training_acknowledgement
        ? `Acknowledged ${formatTimestamp(user.training_acknowledgement.acknowledged_at)} by ${user.training_acknowledgement.acknowledged_by_name}.`
        : "No acknowledgment on record.",
      complete: Boolean(user.training_acknowledgement),
    },
  ];
}

export function isOnboardingComplete(user: OnboardingUser): boolean {
  const hasAssignments = user.role === "admin" || user.open_assignment_count > 0;
  return user.status === "active" && hasAssignments && Boolean(user.training_acknowledgement);
}
