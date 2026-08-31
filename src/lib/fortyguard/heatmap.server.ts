/**
 * Heatmap analytics through the shared activity lifecycle.
 * Supports the native FortyGuard analytics: tcm, exceedance, persistence.
 */

import { runActivity } from "./activity.server";
import { cacheKey, TTL_MS, withCache } from "./cache.server";
import type { GeoJsonFeature, HeatmapRequest, HeatmapResult } from "./types";

interface ResultBody {
  map_data?: { features?: GeoJsonFeature[] };
  statistics?: Record<string, number>;
}

function requestBody(req: HeatmapRequest) {
  return {
    polygon_aoi: { type: "Polygon", coordinates: [req.aoi] },
    date_time: {
      start_date: req.startDate,
      start_time: req.startTime,
      ...(req.endDate ? { end_date: req.endDate } : {}),
      ...(req.endTime ? { end_time: req.endTime } : {}),
      filter_type: req.filterType,
    },
    granularity: req.granularity,
    analytic_type: req.analyticType,
    ...(req.threshold !== undefined ? { threshold: req.threshold } : {}),
    ...(req.direction ? { direction: req.direction } : {}),
  };
}

export async function runHeatmap(
  req: HeatmapRequest,
  signal?: AbortSignal,
): Promise<{ value: HeatmapResult; freshness: "LIVE" | "CACHED"; storedAtUtc: string }> {
  const key = cacheKey({ endpoint: "/v1/heatmap", ...req });
  return withCache<HeatmapResult>(key, TTL_MS[req.kind], async () => {
    const { result, activityId } = await runActivity<ResultBody>("/v1/heatmap", requestBody(req), {
      ...(signal ? { signal } : {}),
    });
    const stats = result?.statistics ?? {};
    return {
      features: result?.map_data?.features ?? [],
      statistics: {
        ...(typeof stats["min"] === "number" ? { min: stats["min"] } : {}),
        ...(typeof stats["max"] === "number" ? { max: stats["max"] } : {}),
        ...(typeof stats["mean"] === "number" ? { mean: stats["mean"] } : {}),
        ...(typeof stats["std"] === "number" ? { std: stats["std"] } : {}),
      },
      activityId,
    };
  });
}
