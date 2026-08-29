/** Wire types + request models for the FortyGuard Temperature API. */

export type AnalyticType = "tcm" | "time_of_measure" | "exceedance" | "persistence";
export type Granularity = 60 | 80 | 100;
export const DEFAULT_GRANULARITY: Granularity = 100;

/** How the requested time relates to now — drives cache TTL. */
export type TimeKind = "historical" | "current" | "forecast";

export interface HeatmapRequest {
  aoi: [number, number][];
  startDate: string;
  startTime: string;
  endDate?: string;
  endTime?: string;
  /** FortyGuard filter_type: 1 = single hour, 2 = range */
  filterType: 1 | 2;
  granularity: Granularity;
  analyticType: AnalyticType;
  threshold?: number;
  direction?: "above" | "below";
  kind: TimeKind;
}

export interface EnvParamsRequest {
  lat: number;
  lng: number;
  date: string;
  time: string;
  /** Basic plan allows at most 3 per request */
  parameters: string[];
  kind: TimeKind;
}

export interface GeoJsonFeature {
  properties?: Record<string, number | string | undefined>;
  geometry?: { coordinates?: number[][][] };
}

export interface HeatmapResult {
  features: GeoJsonFeature[];
  statistics?: {
    min?: number;
    max?: number;
    mean?: number;
    std?: number;
  };
  activityId: string;
}

export interface Capabilities {
  heatmap: boolean;
  mapStatistics: boolean;
  envParams: boolean;
  maxEnvParams: number;
  heatIntelligence: boolean;
  satellite: boolean;
  streetView: boolean;
  /** max AOI size the plan allows */
  maxAreaSqMi: number;
  plan: "basic" | "premium" | "unknown";
}

export const BASIC_CAPABILITIES: Capabilities = {
  heatmap: true,
  mapStatistics: true,
  envParams: true,
  maxEnvParams: 3,
  heatIntelligence: false,
  satellite: false,
  streetView: false,
  maxAreaSqMi: 10,
  plan: "basic",
};

/** The three parameters the MVP asks for — never more (Basic caps at 3). */
export const MVP_ENV_PARAMETERS = [
  "heat_index",
  "relative_humidity",
  "wet_bulb_temperature",
] as const;
