/**
 * Environmental parameters (heat index, relative humidity, wet-bulb).
 * The Basic plan caps requests at 3 parameters, so MVP_ENV_PARAMETERS is fixed.
 *
 * Endpoint shape varies by plan/deployment, so each known path is attempted in
 * order and any failure degrades gracefully: the caller receives an empty
 * reading and the risk engine reports reduced data completeness.
 */

import type { EnvironmentReading } from "@/types/analysis";
import { runActivity } from "./activity.server";
import { fgRequest } from "./client.server";
import { MVP_ENV_PARAMETERS, type EnvParamsRequest } from "./types";

const PATHS = ["/v1/environmental-parameters", "/v1/env-parameters"];

interface EnvBody {
  data?: Record<string, unknown>;
  result?: Record<string, unknown>;
}

function num(value: unknown): number | undefined {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : undefined;
}

function pick(obj: Record<string, unknown> | undefined, keys: string[]): number | undefined {
  if (!obj) return undefined;
  for (const k of keys) {
    const v = num(obj[k]);
    if (v !== undefined) return v;
  }
  return undefined;
}

export function parseEnvironment(payload: unknown): EnvironmentReading {
  const body = payload as EnvBody | undefined;
  const flat = (body?.result ?? body?.data ?? body ?? {}) as Record<string, unknown>;
  const nested = (flat["parameters"] ?? flat["values"] ?? flat) as Record<string, unknown>;
  const heatIndexC = pick(nested, ["heat_index", "heatIndex", "heat_index_c"]);
  const relativeHumidity = pick(nested, ["relative_humidity", "relativeHumidity", "humidity"]);
  const wetBulbC = pick(nested, ["wet_bulb_temperature", "wetBulb", "wet_bulb"]);
  return {
    ...(heatIndexC !== undefined ? { heatIndexC } : {}),
    ...(relativeHumidity !== undefined ? { relativeHumidity } : {}),
    ...(wetBulbC !== undefined ? { wetBulbC } : {}),
  };
}

export async function fetchEnvironmentParameters(
  req: Omit<EnvParamsRequest, "parameters"> & { parameters?: string[] },
  signal?: AbortSignal,
): Promise<{ reading: EnvironmentReading; activityId?: string }> {
  const body = {
    location: { latitude: req.lat, longitude: req.lng },
    latitude: req.lat,
    longitude: req.lng,
    date_time: { start_date: req.date, start_time: req.time, filter_type: 1 },
    parameters: req.parameters ?? [...MVP_ENV_PARAMETERS],
  };

  let lastError: unknown;
  for (const path of PATHS) {
    try {
      const { result, activityId } = await runActivity<unknown>(path, body, {
        maxAttempts: 8,
        maxDurationMs: 30_000,
        ...(signal ? { signal } : {}),
      });
      return { reading: parseEnvironment(result), activityId };
    } catch (err) {
      lastError = err;
      // Some deployments answer synchronously rather than with an activity id.
      try {
        const direct = await fgRequest<unknown>(path, {
          method: "POST",
          body: JSON.stringify(body),
          ...(signal ? { signal } : {}),
        });
        const reading = parseEnvironment(direct);
        if (reading.heatIndexC ?? reading.wetBulbC ?? reading.relativeHumidity) {
          return { reading };
        }
      } catch (inner) {
        lastError = inner;
      }
    }
  }
  void lastError;
  return { reading: {} };
}
