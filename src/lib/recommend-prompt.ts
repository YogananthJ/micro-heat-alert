export type Activity = "walk" | "cycle" | "commute" | "outdoor work";

export interface ZoneSummary {
  id: string;
  lat: number;
  lng: number;
  temp_f: number;
  surface_type: string;
  shade_index: number;
  vegetation_index: number;
}

export interface RecommendInput {
  activity: Activity;
  city: string;
  current_time_label: string;
  /** hourly min/avg/max for the next 12h */
  forecast: { label: string; min_f: number; avg_f: number; max_f: number }[];
  hottest_zones: ZoneSummary[];
  coolest_zones: ZoneSummary[];
}

export interface Recommendation {
  risk_level: "low" | "moderate" | "high" | "extreme";
  summary: string;
  safer_window: string;
  zones_to_avoid: { zone_id: string; reason: string; delta_f: number }[];
  cooler_route_tip: string;
}

export const SYSTEM_PROMPT = `You are HeatSafe AI, a heat-safety analyst reading hyperlocal (city-block scale, ~2m above ground) temperature data from the FortyGuard Temperature API.
Reason about the actual numbers: compare zones, cite real temperature deltas in °F, and use surface_type / shade_index / vegetation_index to explain WHY a block is hot.
Tailor risk to the user's activity (exertion level and exposure duration differ between a walk, a cycle, a commute and outdoor work).
Be concrete and plain-language. Never invent zones or numbers that are not in the data.
Return STRICT JSON only, no markdown, matching:
{"risk_level":"low|moderate|high|extreme","summary":"2-3 sentences about right now","safer_window":"e.g. before 9am or after 6pm","zones_to_avoid":[{"zone_id":"r-c","reason":"why, citing surface/shade","delta_f":number}],"cooler_route_tip":"one sentence: avoid the red zones between X and Y, favour ..."}`;

export function buildUserPrompt(input: RecommendInput) {
  return JSON.stringify(input);
}
