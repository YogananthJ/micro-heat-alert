import { createServerFn } from "@tanstack/react-start";
import { getHeatmapData, TARGET, type HeatmapResponse } from "./heatmap";

/**
 * Live FortyGuard heatmap with graceful degradation:
 * if the API key is missing or the call fails, the mock grid is returned so
 * the demo never breaks (response carries `source` so the UI can label it).
 */
export const fetchHeatmap = createServerFn({ method: "GET" })
  .inputValidator((input: { startHour?: number } | undefined) => ({
    startHour:
      typeof input?.startHour === "number" ? Math.min(23, Math.max(0, input.startHour)) : 6,
  }))
  .handler(async ({ data }): Promise<HeatmapResponse & { error?: string }> => {
    const { startHour } = data;
    try {
      const { fetchHeatmapPoints, pointsToCells, projectFrames } = await import(
        "./fortyguard.server"
      );
      const points = await fetchHeatmapPoints(startHour);
      const cells = pointsToCells(points);
      return {
        activity_id: "fortyguard-live",
        city: TARGET.city,
        center: TARGET.center,
        cell_size: TARGET.cellSize,
        granularity: 100,
        frames: projectFrames(cells, startHour),
        source: "fortyguard",
      };
    } catch (err) {
      const fallback = await getHeatmapData(startHour);
      return { ...fallback, error: err instanceof Error ? err.message : String(err) };
    }
  });
