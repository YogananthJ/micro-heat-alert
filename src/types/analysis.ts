/**
 * Shared vocabulary for HeatSafe AI.
 *
 * Everything the app renders flows through `HeatAnalysis` (facts) and
 * `Decision` (interpretation). FortyGuard-sourced numbers, HeatSafe-model
 * numbers and AI text are always distinguishable via `Provenance`.
 */

export const RISK_MODEL_VERSION = "HeatSafe Risk v1.0";
export const ROUTE_MODEL_VERSION = "HeatSafe Route Exposure v1.0";
export const PLANNER_MODEL_VERSION = "HeatSafe Planner v1.0";

export type Severity = "LOW" | "MODERATE" | "HIGH" | "EXTREME";
export type Freshness = "LIVE" | "CACHED" | "DEMO";
export type DataCompleteness = "HIGH" | "PARTIAL" | "LOW";
export type Coverage = "HIGH" | "MEDIUM" | "LOW";

export interface GeoLocation {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  /** IANA timezone used for every user-facing time on this location */
  timezone: string;
}

export interface Aoi {
  /** GeoJSON polygon ring, [lng, lat] pairs, closed */
  coordinates: [number, number][];
  center: [number, number];
  radiusKm: number;
  areaSqMi: number;
}

export interface HeatCell {
  id: string;
  lat: number;
  lng: number;
  /** °C at ~2 m above ground */
  temp_c: number;
  /** FortyGuard exceedance analytic: hours above threshold */
  exceedance_h?: number;
  /** FortyGuard persistence analytic: longest continuous run above threshold */
  persistence_h?: number;
}

export interface HeatFrame {
  /** ISO-8601 UTC */
  timestampUtc: string;
  /** short local-time label, e.g. "3 PM" */
  label: string;
  cells: HeatCell[];
}

export interface TemperatureStats {
  min: number;
  max: number;
  mean: number;
  stdDev: number;
}

export interface EnvironmentReading {
  heatIndexC?: number;
  relativeHumidity?: number;
  wetBulbC?: number;
}

export interface HeatEventSummary {
  thresholdC: number;
  /** hours above threshold, area mean */
  exceedanceHours: number;
  /** longest continuous run above threshold, area max */
  persistenceHours: number;
  source: "FortyGuard" | "unavailable";
}

export interface TimeMeta {
  requestedAtUtc: string;
  dataTimeUtc: string;
  displayTimezone: string;
  displayTime: string;
}

export interface Provenance {
  layer: string;
  source: "FortyGuard" | "HeatSafe" | "AI" | "OSRM";
  detail: string;
  status: Freshness | "OK" | "UNAVAILABLE";
  timestampUtc?: string;
  activityId?: string;
}

export interface RiskResult {
  thermalSeverity: number;
  exposureSeverity: number;
  score: number;
  level: Severity;
  dataCompleteness: DataCompleteness;
  modelVersion: string;
  drivers: { label: string; value: string; contribution: number }[];
  missingInputs: string[];
}

export interface HeatAnalysis {
  analysisId: string;
  location: GeoLocation;
  aoi: Aoi;
  time: TimeMeta;
  freshness: Freshness;
  granularity: number;
  temperature: TemperatureStats;
  environment: EnvironmentReading;
  heatEvent?: HeatEventSummary;
  frames: HeatFrame[];
  risk: RiskResult;
  provenance: Provenance[];
  activityIds: string[];
  notes: string[];
}

export interface Reason {
  label: string;
  value: string;
}

export interface Action {
  label: string;
  detail: string;
}

export interface Decision {
  title: string;
  severity: Severity;
  summary: string;
  reasons: Reason[];
  actions: Action[];
  dataSources: Provenance[];
  limitations: string[];
  modelVersion?: string;
  origin: "HeatSafe" | "AI";
}

export type ProgressState =
  | "IDLE"
  | "LOCATION_READY"
  | "HEATMAP_SUBMITTED"
  | "HEATMAP_PROCESSING"
  | "HEATMAP_COMPLETED"
  | "ENV_SUBMITTED"
  | "ENV_COMPLETED"
  | "RISK_CALCULATED"
  | "AI_GENERATING"
  | "COMPLETE"
  | "FAILED";

export const PROGRESS_LABELS: Record<ProgressState, string> = {
  IDLE: "Waiting for a location",
  LOCATION_READY: "Location identified",
  HEATMAP_SUBMITTED: "Temperature intelligence requested",
  HEATMAP_PROCESSING: "Processing heat distribution",
  HEATMAP_COMPLETED: "Heat distribution received",
  ENV_SUBMITTED: "Environmental parameters requested",
  ENV_COMPLETED: "Environmental parameters received",
  RISK_CALCULATED: "Heat risk calculated",
  AI_GENERATING: "Generating recommendation",
  COMPLETE: "Analysis complete",
  FAILED: "Analysis failed",
};
