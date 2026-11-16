import { ApiError, ApiResponseError } from "@/lib/api/errors";
import { categoryBalanceList, errorDetail, expenseList, participantList } from "@/lib/api/parse";
import type { CategoryBalance, ExpenseRecord, FiscalYear, ParticipantSummary } from "@/lib/api/types";

export type ApiTransport = (path: string) => Promise<unknown>;

const API_PREFIX = "/api/v1";

// Inlined at build time, so production bundles drop the fixtures import.
export const mocksEnabled = process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_USE_MOCKS === "true";

function apiUrl(path: string): string {
  // The server has no origin, so it skips the rewrite and calls the backend directly.
  const origin = typeof window === "undefined" ? (process.env.BACKEND_URL ?? "http://localhost:8000") : "";
  return `${origin}${API_PREFIX}${path}`;
}

const httpTransport: ApiTransport = async (path) => {
  const response = await fetch(apiUrl(path), { headers: { Accept: "application/json" } });

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

async function get(path: string): Promise<unknown> {
  return (await transport())(path);
}

export async function listParticipants(): Promise<ParticipantSummary[]> {
  const path = "/participants";
  return participantList(await get(path), path).items;
}

export async function listCategoryBalances(participantId: string, fiscalYear: FiscalYear): Promise<CategoryBalance[]> {
  const path = `/participants/${encodeURIComponent(participantId)}/balances?fiscal_year=${fiscalYear}`;
  return categoryBalanceList(await get(path), path).items;
}

export async function listExpenses(participantId: string, fiscalYear: FiscalYear): Promise<ExpenseRecord[]> {
  const path = `/participants/${encodeURIComponent(participantId)}/expenses?fiscal_year=${fiscalYear}`;
  return expenseList(await get(path), path).items;
}
