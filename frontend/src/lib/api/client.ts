import { ApiError, ApiResponseError } from "@/lib/api/errors";
import {
  categoryBalanceList,
  errorDetail,
  expenseList,
  onboardingOverview,
  onboardingUser,
  participantList,
} from "@/lib/api/parse";
import type {
  CategoryBalance,
  ExpenseRecord,
  FiscalYear,
  InviteWorkerInput,
  ListResponse,
  OnboardingOverview,
  OnboardingUser,
  ParticipantSummary,
} from "@/lib/api/types";

export type ApiRequest = {
  method?: "GET" | "POST";
  body?: unknown;
};

export type ApiTransport = (path: string, request?: ApiRequest) => Promise<unknown>;

const API_PREFIX = "/api/v1";

// Inlined at build time, so production bundles drop the fixtures import.
export const mocksEnabled = process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_USE_MOCKS === "true";

function apiUrl(path: string): string {
  // The server has no origin, so it skips the rewrite and calls the backend directly.
  const origin = typeof window === "undefined" ? (process.env.BACKEND_URL ?? "http://localhost:8000") : "";
  return `${origin}${API_PREFIX}${path}`;
}

const httpTransport: ApiTransport = async (path, request) => {
  const response = await fetch(apiUrl(path), {
    method: request?.method ?? "GET",
    headers: {
      Accept: "application/json",
      ...(request?.body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: request?.body === undefined ? undefined : JSON.stringify(request.body),
  });

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    throw new ApiError(response.status, errorDetail(body));
  }

  try {
    return await response.json();
  } catch {
    throw new ApiResponseError(path, "body is not valid JSON");
  }
};

// Picked once from the flag, never as a fallback after a failed request.
async function transport(): Promise<ApiTransport> {
  if (mocksEnabled) {
    const { fixtureTransport } = await import("@/lib/api/fixtures");
    return fixtureTransport;
  }
  return httpTransport;
}

async function request(path: string, init?: ApiRequest): Promise<unknown> {
  return (await transport())(path, init);
}

async function get(path: string): Promise<unknown> {
  return request(path);
}

async function post(path: string, body?: unknown): Promise<unknown> {
  return request(path, { method: "POST", body });
}

export async function listParticipants(): Promise<ListResponse<ParticipantSummary>> {
  const path = "/participants";
  return participantList(await get(path), path);
}

export async function listCategoryBalances(participantId: string, fiscalYear: FiscalYear): Promise<ListResponse<CategoryBalance>> {
  const path = `/participants/${encodeURIComponent(participantId)}/balances?fiscal_year=${fiscalYear}`;
  return categoryBalanceList(await get(path), path);
}

export async function listExpenses(participantId: string, fiscalYear: FiscalYear): Promise<ListResponse<ExpenseRecord>> {
  const path = `/participants/${encodeURIComponent(participantId)}/expenses?fiscal_year=${fiscalYear}`;
  return expenseList(await get(path), path);
}

// AUTH-01/AUDIT-LOG-01 contract seam. The fixture transport implements this shape until
// the backend endpoints exist; components never see the raw response.
export async function getOnboardingOverview(): Promise<OnboardingOverview> {
  const path = "/users/onboarding";
  return onboardingOverview(await get(path), path);
}

export async function inviteWorker(input: InviteWorkerInput): Promise<OnboardingUser> {
  const path = "/users/invitations";
  return onboardingUser(await post(path, input), path);
}

export async function resendInvite(userId: string): Promise<OnboardingUser> {
  const path = `/users/${encodeURIComponent(userId)}/invitations/resend`;
  return onboardingUser(await post(path), path);
}

export async function recordTrainingAcknowledgement(userId: string): Promise<OnboardingUser> {
  const path = `/users/${encodeURIComponent(userId)}/training-acknowledgements`;
  return onboardingUser(await post(path), path);
}
