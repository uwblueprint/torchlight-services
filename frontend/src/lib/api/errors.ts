import type { ValidationIssue } from "@/lib/api/types";

// Non-2xx response, including 501 and 404.
export class ApiError extends Error {
  readonly status: number;
  readonly detail: string | ValidationIssue[] | null;

  constructor(status: number, detail: string | ValidationIssue[] | null) {
    super(`API request failed with ${status}${typeof detail === "string" ? `: ${detail}` : ""}`);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }

  get isNotImplemented(): boolean {
    return this.status === 501;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}

// 2xx response whose body breaks the contract.
export class ApiResponseError extends Error {
  readonly field: string;

  constructor(field: string, problem: string) {
    super(`Invalid API response at ${field}: ${problem}`);
    this.name = "ApiResponseError";
    this.field = field;
  }
}
