/**
 * The single place that implements FortyGuard's async lifecycle:
 *   submit -> activity_id -> poll /v1/status/{id} -> Completed | Failed.
 * Polling is bounded by attempts AND wall-clock duration, and honours an
 * external AbortSignal. `Failed` is terminal — never retried in place.
 */

import { fgRequest } from "./client.server";
import { FortyGuardError } from "./errors.server";

export interface PollOptions {
  maxAttempts?: number;
  maxDurationMs?: number;
  intervalMs?: number;
  signal?: AbortSignal;
  onState?: (state: "SUBMITTED" | "PROCESSING") => void;
}

interface StatusBody {
  data?: {
    status?: string;
    result?: unknown;
    message?: string;
  };
}

export async function submitActivity(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<string> {
  const created = await fgRequest<{ data?: { activity_id?: string } }>(path, {
    method: "POST",
    body: JSON.stringify(body),
    ...(signal ? { signal } : {}),
  });
  const activityId = created.data?.activity_id;
  if (!activityId) throw new FortyGuardError("upstream", undefined, "no activity_id returned");
  return activityId;
}

export async function pollActivity<T>(activityId: string, opts: PollOptions = {}): Promise<T> {
  const maxAttempts = opts.maxAttempts ?? 20;
  const maxDurationMs = opts.maxDurationMs ?? 75_000;
  const intervalMs = opts.intervalMs ?? 2500;
  const startedAt = Date.now();

  opts.onState?.("SUBMITTED");

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (opts.signal?.aborted) throw new FortyGuardError("timeout");
    if (Date.now() - startedAt > maxDurationMs) throw new FortyGuardError("timeout");

    await sleep(attempt === 0 ? 1200 : intervalMs, opts.signal);

    const status = await fgRequest<StatusBody>(`/v1/status/${activityId}`, {
      ...(opts.signal ? { signal: opts.signal } : {}),
    });
    const state = status.data?.status;

    if (state === "Completed") return status.data?.result as T;
    if (state === "Failed" || state === "Cancelled") {
      throw new FortyGuardError("job_failed", undefined, status.data?.message);
    }
    opts.onState?.("PROCESSING");
  }
  throw new FortyGuardError("timeout");
}

export async function runActivity<T>(
  path: string,
  body: unknown,
  opts: PollOptions = {},
): Promise<{ result: T; activityId: string }> {
  const activityId = await submitActivity(path, body, opts.signal);
  const result = await pollActivity<T>(activityId, opts);
  return { result, activityId };
}

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new FortyGuardError("timeout"));
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new FortyGuardError("timeout"));
      },
      { once: true },
    );
  });
}
