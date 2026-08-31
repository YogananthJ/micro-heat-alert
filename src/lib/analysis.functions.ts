import { createServerFn } from "@tanstack/react-start";
import { calculateRisk } from "./risk";
import { buildAoi, locationById, nextAnalysisId, validateAoi, formatLocalTime } from "./geo";
import type { EnvironmentReading, Freshness, Provenance, RiskResult } from "@/types/analysis";

export interface RiskSnapshot {
  analysisId: string;
  locationId: string;
  locationLabel: string;
  areaSqMi: number;
  temperatureC: number;
  environment: EnvironmentReading;
  persistenceHours?: number;
  risk: RiskResult;
  freshness: Freshness;
  dataTimeUtc: string;
  displayTime: string;
  provenance: Provenance[];
  notes: string[];
}

/**
 * Environment + HeatSafe Risk for one location. Temperature comes from the
 * caller's already-loaded heat grid so we spend exactly one extra API call.
 */
export const analyzeRisk = createServerFn({ method: "POST" })
  .inputValidator((input: { locationId?: string; temperatureC: number; persistenceHours?: number }) => ({
    locationId: typeof input.locationId === "string" ? input.locationId : "phoenix",
    temperatureC: Number(input.temperatureC),
    ...(typeof input.persistenceHours === "number"
      ? { persistenceHours: input.persistenceHours }
      : {}),
  }))
  .handler(async ({ data }): Promise<RiskSnapshot> => {
    const location = locationById(data.locationId);
    const aoi = buildAoi(location.lat, location.lng, 1);
    const check = validateAoi(aoi, 10);
    const notes: string[] = [];
    if (!check.ok && check.reason) notes.push(check.reason);

    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = `${String(now.getUTCHours()).padStart(2, "0")}:00`;

    let environment: EnvironmentReading = {};
    let freshness: Freshness = "DEMO";
    let envActivityId: string | undefined;

    if (check.ok && process.env["FORTYGUARD_API_KEY"]) {
      try {
        const { fetchEnvironmentParameters } = await import("./fortyguard/env-params.server");
        const res = await fetchEnvironmentParameters({
          lat: location.lat,
          lng: location.lng,
          date,
          time,
          kind: "current",
        });
        environment = res.reading;
        envActivityId = res.activityId;
        freshness =
          environment.heatIndexC || environment.wetBulbC || environment.relativeHumidity
            ? "LIVE"
            : "CACHED";
      } catch {
        notes.push("Environmental parameters were unavailable for this request.");
      }
    }

    if (!environment.heatIndexC && !environment.wetBulbC) {
      notes.push(
        "Heat index and wet-bulb temperature were not returned; the risk model re-weighted the available inputs.",
      );
    }

    const risk = calculateRisk({
      temperatureC: data.temperatureC,
      environment,
      ...(typeof data.persistenceHours === "number"
        ? { persistenceHours: data.persistenceHours }
        : {}),
    });

    const dataTimeUtc = now.toISOString();
    const provenance: Provenance[] = [
      {
        layer: "Surface-level temperature",
        source: "FortyGuard",
        detail: `${location.name}, ${location.region} · ${aoi.areaSqMi} mi² AOI`,
        status: freshness,
        timestampUtc: dataTimeUtc,
        ...(envActivityId ? { activityId: envActivityId } : {}),
      },
      {
        layer: "Environmental parameters",
        source: "FortyGuard",
        detail: environment.heatIndexC
          ? "Heat index, relative humidity, wet-bulb temperature"
          : "Not available for this request",
        status: environment.heatIndexC ? freshness : "UNAVAILABLE",
      },
      {
        layer: "HeatSafe Risk",
        source: "HeatSafe",
        detail: `${risk.modelVersion} · data completeness ${risk.dataCompleteness}`,
        status: "OK",
        timestampUtc: dataTimeUtc,
      },
    ];

    return {
      analysisId: nextAnalysisId(now),
      locationId: location.id,
      locationLabel: `${location.name}, ${location.region}`,
      areaSqMi: aoi.areaSqMi,
      temperatureC: data.temperatureC,
      environment,
      ...(typeof data.persistenceHours === "number"
        ? { persistenceHours: data.persistenceHours }
        : {}),
      risk,
      freshness,
      dataTimeUtc,
      displayTime: formatLocalTime(dataTimeUtc, location.timezone),
      provenance,
      notes,
    };
  });
