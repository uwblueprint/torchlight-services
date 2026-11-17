// Types vanish at runtime, so response bodies are checked here.
import { ApiResponseError } from "@/lib/api/errors";
import {
  expenseSourceKinds,
  expenseStatuses,
  reviewStatuses,
  type ApiErrorBody,
  type CategoryBalance,
  type ExpenseRecord,
  type ListResponse,
  type Money,
  type ParticipantSummary,
  type ValidationIssue,
} from "@/lib/api/types";

type Parser<T> = (value: unknown, field: string) => T;

// Exactly two decimals, so an off-spec value fails here instead of being rounded on screen.
const MONEY_PATTERN = /^\d+\.\d{2}$/;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
// Aware datetimes only, as Pydantic emits them.
const DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

const string: Parser<string> = (value, field) => {
  if (typeof value !== "string") throw new ApiResponseError(field, "expected a string");
  return value;
};

const boolean: Parser<boolean> = (value, field) => {
  if (typeof value !== "boolean") throw new ApiResponseError(field, "expected a boolean");
  return value;
};

const integer: Parser<number> = (value, field) => {
  if (!Number.isInteger(value)) throw new ApiResponseError(field, "expected an integer");
  return value as number;
};

const money: Parser<Money> = (value, field) => {
  if (typeof value !== "string" || !MONEY_PATTERN.test(value)) {
    throw new ApiResponseError(field, 'expected a non-negative decimal string with two places, like "12.34"');
  }
  return value as Money;
};

const isoDate: Parser<string> = (value, field) => {
  const match = typeof value === "string" ? DATE_PATTERN.exec(value) : null;
  if (!match) throw new ApiResponseError(field, "expected a YYYY-MM-DD date");
  // Rejects impossible dates like 2026-02-30.
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new ApiResponseError(field, "expected a real calendar date");
  }
  return value as string;
};

const isoDateTime: Parser<string> = (value, field) => {
  if (typeof value !== "string" || !DATETIME_PATTERN.test(value) || Number.isNaN(Date.parse(value))) {
    throw new ApiResponseError(field, "expected an ISO 8601 timestamp with a time zone");
  }
  return value;
};

function oneOf<T extends string>(values: readonly T[]): Parser<T> {
  return (value, field) => {
    if (typeof value !== "string" || !(values as readonly string[]).includes(value)) {
      throw new ApiResponseError(field, `expected one of ${values.join(", ")}`);
    }
    return value as T;
  };
}

function nullable<T>(parse: Parser<T>): Parser<T | null> {
  return (value, field) => (value === null ? null : parse(value, field));
}

// shape must cover every key of T, so an unvalidated field is a compile error.
function object<T>(shape: { [K in keyof T]-?: Parser<T[K]> }): Parser<T> {
  return (value, field) => {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new ApiResponseError(field, "expected an object");
    }
    const record = value as Record<string, unknown>;
    const result = {} as T;
    for (const key of Object.keys(shape) as (keyof T & string)[]) {
      // Nullable fields must be sent as null, not omitted.
      if (!Object.hasOwn(record, key)) throw new ApiResponseError(`${field}.${key}`, "missing field");
      result[key] = shape[key](record[key], `${field}.${key}`);
    }
    return result;
  };
}

const count: Parser<number> = (value, field) => {
  const parsed = integer(value, field);
  if (parsed < 0) throw new ApiResponseError(field, "expected a non-negative integer");
  return parsed;
};

const items = <T>(item: Parser<T>): Parser<T[]> => (value, field) => {
  if (!Array.isArray(value)) throw new ApiResponseError(field, "expected an array");
  return value.map((entry, index) => item(entry, `${field}[${index}]`));
};

function list<T>(item: Parser<T>): Parser<ListResponse<T>> {
  return object<ListResponse<T>>({ items: items(item), total: count, next_cursor: nullable(string) });
}

export const participantSummary = object<ParticipantSummary>({
  id: string,
  display_name: string,
  client_code: nullable(string),
  is_active: boolean,
});

export const categoryBalance = object<CategoryBalance>({
  category_id: string,
  category_code: string,
  category_name: string,
  fiscal_year: integer,
  allocated_amount: money,
  projected_amount: money,
  spent_amount: money,
  remaining_amount: money,
});

export const expenseRecord = object<ExpenseRecord>({
  id: string,
  participant_id: string,
  fiscal_year: integer,
  receipt_id: nullable(string),
  category_id: nullable(string),
  category_name: nullable(string),
  other_category_desc: nullable(string),
  source_kind: oneOf(expenseSourceKinds),
  vendor_name: nullable(string),
  start_date: isoDate,
  end_date: nullable(isoDate),
  total_amount: money,
  covered_amount: money,
  out_of_pocket_amount: money,
  status: oneOf(expenseStatuses),
  review_status: oneOf(reviewStatuses),
  created_at: isoDateTime,
});

export const participantList = list(participantSummary);
export const categoryBalanceList = list(categoryBalance);
export const expenseList = list(expenseRecord);

export function errorDetail(body: unknown): ApiErrorBody["detail"] | null {
  if (typeof body !== "object" || body === null) return null;
  const detail = (body as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.every(isValidationIssue)) return detail;
  return null;
}

function isValidationIssue(value: unknown): value is ValidationIssue {
  if (typeof value !== "object" || value === null) return false;
  const issue = value as Record<string, unknown>;
  return (
    Array.isArray(issue.loc) &&
    issue.loc.every((part) => typeof part === "string" || typeof part === "number") &&
    typeof issue.msg === "string" &&
    typeof issue.type === "string"
  );
}
