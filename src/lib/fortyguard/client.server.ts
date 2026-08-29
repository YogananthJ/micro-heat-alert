/** Low-level HTTP client. Reads credentials inside the call (Workers inject env per request). */

import { FortyGuardError, errorForStatus } from "./errors.server";

export interface FgCredentials {
  key: string;
  base: string;
}

export function credentials(): FgCredentials {
  const key = process.env["FORTYGUARD_API_KEY"];
  const base = process.env["FORTYGUARD_BASE_URL"] || "https://api.fortyguard.com";
  if (!key) throw new FortyGuardError("not_configured");
  return { key, base: base.replace(/\/$/, "") };
}

export function isConfigured(): boolean {
  return Boolean(process.env["FORTYGUARD_API_KEY"]);
}

export async function fgRequest<T = Record<string, unknown>>(
  path: string,
  init: RequestInit & { signal?: AbortSignal } = {},
): Promise<T> {
  const { key, base } = credentials();
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        "api-key": key,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new FortyGuardError("timeout");
    }
    throw new FortyGuardError("network", undefined, String(err));
  }

  const text = await res.text();
  if (!res.ok) throw errorForStatus(res.status, text.slice(0, 300));
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new FortyGuardError("upstream", res.status, "Malformed response body");
  }
}
