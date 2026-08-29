/** Typed FortyGuard failures with user-facing copy — never leak raw provider text. */

export type FgErrorKind =
  | "not_configured"
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "rate_limited"
  | "upstream"
  | "timeout"
  | "job_failed"
  | "network";

const MESSAGES: Record<FgErrorKind, string> = {
  not_configured: "FortyGuard access is not configured for this deployment.",
  bad_request: "That area or time range isn't supported by the temperature API.",
  unauthorized: "FortyGuard rejected our credentials.",
  forbidden: "This capability isn't included in the current FortyGuard plan.",
  not_found: "FortyGuard has no data for this request.",
  rate_limited: "FortyGuard is rate limiting us. Try again in a moment.",
  upstream: "FortyGuard had a processing error.",
  timeout: "Analysis is taking longer than expected.",
  job_failed: "FortyGuard could not complete this analysis.",
  network: "We couldn't reach FortyGuard.",
};

export class FortyGuardError extends Error {
  readonly kind: FgErrorKind;
  readonly status: number | undefined;
  readonly retryable: boolean;

  constructor(kind: FgErrorKind, status?: number, detail?: string) {
    super(MESSAGES[kind]);
    this.name = "FortyGuardError";
    this.kind = kind;
    this.status = status;
    this.retryable = kind === "rate_limited" || kind === "upstream" || kind === "timeout";
    if (detail) this.cause = detail;
  }
}

export function errorForStatus(status: number, detail?: string): FortyGuardError {
  if (status === 400) return new FortyGuardError("bad_request", status, detail);
  if (status === 401) return new FortyGuardError("unauthorized", status, detail);
  if (status === 403) return new FortyGuardError("forbidden", status, detail);
  if (status === 404) return new FortyGuardError("not_found", status, detail);
  if (status === 429) return new FortyGuardError("rate_limited", status, detail);
  return new FortyGuardError("upstream", status, detail);
}

export function toUserMessage(err: unknown): string {
  if (err instanceof FortyGuardError) return err.message;
  return "Something went wrong while analyzing this area.";
}
