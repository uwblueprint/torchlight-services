// Non-negative decimal string with two places, like "1234.50"; never convert to a number or do math on it.
export type Money = string & { readonly __brand: "Money" };

// Signed decimal string with two places, like "-125.00"; used only for computed remainders that may go below zero.
export type SignedMoney = string & { readonly __brand: "SignedMoney" };

export type IsoDate = string;

export type IsoDateTime = string;

export type FiscalYear = number;

export const userRoles = ["admin", "passport_worker"] as const;
export type UserRole = (typeof userRoles)[number];

export const userStatuses = ["invited", "active", "suspended", "deactivated"] as const;
export type UserStatus = (typeof userStatuses)[number];

export type User = {
  id: string;
  display_name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
};

export type ParticipantSummary = {
  id: string;
  display_name: string;
  client_code: string | null;
  is_active: boolean;
};

// All amounts are computed by the backend.
export type CategoryBalance = {
  category_id: string;
  category_code: string;
  category_name: string;
  fiscal_year: FiscalYear;
  allocated_amount: Money;
  projected_amount: Money;
  spent_amount: Money;
  // Negative when confirmed spending exceeds the allocation; do not clamp.
  remaining_amount: SignedMoney;
};

export const expenseStatuses = ["draft", "awaiting_worker_confirmation", "confirmed", "rejected", "voided"] as const;
export type ExpenseStatus = (typeof expenseStatuses)[number];

export const reviewStatuses = ["not_required", "pending", "reviewed", "needs_correction"] as const;
export type ReviewStatus = (typeof reviewStatuses)[number];

export const expenseSourceKinds = ["worker", "admin", "day_program_invoice", "import", "other"] as const;
export type ExpenseSourceKind = (typeof expenseSourceKinds)[number];

export type ExpenseRecord = {
  id: string;
  participant_id: string;
  fiscal_year: FiscalYear;
  receipt_id: string | null;
  // Null until a category is chosen.
  category_id: string | null;
  category_name: string | null;
  other_category_desc: string | null;
  source_kind: ExpenseSourceKind;
  vendor_name: string | null;
  start_date: IsoDate;
  end_date: IsoDate | null;
  total_amount: Money;
  covered_amount: Money;
  out_of_pocket_amount: Money;
  status: ExpenseStatus;
  review_status: ReviewStatus;
  created_at: IsoDateTime;
};

export type ListResponse<T> = {
  items: T[];
  total: number;
  next_cursor: string | null;
};

export type ValidationIssue = {
  loc: (string | number)[];
  msg: string;
  type: string;
};

// FastAPI default: a string, or a list of issues for 422.
export type ApiErrorBody = {
  detail: string | ValidationIssue[];
};

// AUTH-01 owns the approved-domain list; the screen only renders what the API returns.
export type OnboardingSettings = {
  approved_email_domains: string[];
  training_material: string;
  resend_available: boolean;
};

export type TrainingAcknowledgement = {
  acknowledged_at: IsoDateTime;
  material: string;
  acknowledged_by_name: string;
  recorded_by_name: string;
  audit_event_id: string;
};

export type OnboardingUser = User & {
  invited_at: IsoDateTime;
  open_assignment_count: number;
  training_acknowledgement: TrainingAcknowledgement | null;
};

export type OnboardingOverview = OnboardingSettings & {
  users: ListResponse<OnboardingUser>;
};

export type InviteWorkerInput = {
  email: string;
  display_name: string;
  role: UserRole;
};
