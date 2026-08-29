/**
 * Request-shaped cache. The key hashes the ENTIRE normalized request, so
 * tcm / exceedance / persistence, different thresholds, granularities and
 * time ranges can never collide.
 */

import type { TimeKind } from "./types";

export const TTL_MS: Record<TimeKind | "demo", number> = {
  historical: 24 * 60 * 60 * 1000,
  current: 20 * 60 * 1000,
  forecast: 20 * 60 * 1000,
  demo: Number.POSITIVE_INFINITY,
};

export interface CacheEntry<T> {
  value: T;
  storedAtUtc: string;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

/** Stable stringify so key order never changes the hash. */
function stable(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj)
    .sort()
    .filter((k) => obj[k] !== undefined)
    .map((k) => `${JSON.stringify(k)}:${stable(obj[k])}`)
    .join(",")}}`;
}

export function cacheKey(parts: Record<string, unknown>): string {
  const text = stable(parts);
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < text.length; i++) {
    h1 = Math.imul(h1 ^ text.charCodeAt(i), 16777619) >>> 0;
    h2 = Math.imul(h2 + text.charCodeAt(i), 2246822519) >>> 0;
  }
  return `${h1.toString(36)}${h2.toString(36)}`;
}

export function readCache<T>(key: string): CacheEntry<T> | undefined {
  const hit = store.get(key) as CacheEntry<T> | undefined;
  if (!hit) return undefined;
  return hit;
}

export function isFresh(entry: CacheEntry<unknown>): boolean {
  return Date.now() < entry.expiresAt;
}

export function writeCache<T>(key: string, value: T, ttlMs: number): CacheEntry<T> {
  const entry: CacheEntry<T> = {
    value,
    storedAtUtc: new Date().toISOString(),
    expiresAt: ttlMs === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : Date.now() + ttlMs,
  };
  store.set(key, entry);
  return entry;
}

/**
 * Fresh cache -> LIVE reuse. Stale cache is kept as the graceful-degradation
 * source: if the network call fails we serve it and label it CACHED.
 */
export async function withCache<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<{ value: T; freshness: "LIVE" | "CACHED"; storedAtUtc: string }> {
  const existing = readCache<T>(key);
  if (existing && isFresh(existing)) {
    return { value: existing.value, freshness: "LIVE", storedAtUtc: existing.storedAtUtc };
  }

  let pending = inFlight.get(key) as Promise<T> | undefined;
  if (!pending) {
    pending = loader();
    inFlight.set(key, pending);
    pending.finally(() => inFlight.delete(key)).catch(() => undefined);
  }

  try {
    const value = await pending;
    const entry = writeCache(key, value, ttlMs);
    return { value, freshness: "LIVE", storedAtUtc: entry.storedAtUtc };
  } catch (err) {
    if (existing) {
      return { value: existing.value, freshness: "CACHED", storedAtUtc: existing.storedAtUtc };
    }
    throw err;
  }
}

export function cacheAgeMinutes(storedAtUtc: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(storedAtUtc).getTime()) / 60000));
}
