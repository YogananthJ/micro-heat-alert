/**
 * HeatSafe AI — data layer.
 *
 * ⚠️ MOCK DATA — shaped exactly like the FortyGuard Temperature API response.
 * To go live, replace the body of `getHeatmapData()` with a call to our own
 * server function that proxies:
 *   POST https://api.fortyguard.com/v1/heatmap
 *   headers: { "api-key": FORTYGUARD_API_KEY, "Content-Type": "application/json" }
 *   body: { polygon_aoi, date_time: { start_date, start_time, filter_type: 1 }, granularity: 100 }
 * (async job → activity_id → poll result). Nothing else in the app changes.
 */

export type SurfaceType = "asphalt" | "concrete" | "grass" | "tree canopy" | "water";

export interface HeatCell {
  id: string;
  /** cell center */
  lat: number;
  lng: number;
  /** °F at ~2m above ground */
  temp_f: number;
  surface_type: SurfaceType;
  /** 0–1 */
  shade_index: number;
  vegetation_index: number;
}

export interface HeatFrame {
  /** ISO hour of this forecast frame */
  timestamp: string;
  /** e.g. "14:00" */
  label: string;
  cells: HeatCell[];
}

export interface HeatmapResponse {
  activity_id: string;
  city: string;
  center: [number, number];
  /** cell size in degrees */
  cell_size: number;
  granularity: number;
  frames: HeatFrame[];
  source: "MOCK" | "fortyguard";
}

/** Hardcoded target area: downtown Phoenix, AZ */
export const TARGET = {
  city: "Downtown Phoenix, AZ",
  center: [33.4484, -112.074] as [number, number],
  rows: 10,
  cols: 10,
  cellSize: 0.0045,
};

const SURFACES: { type: SurfaceType; bias: number; shade: number; veg: number }[] = [
  { type: "asphalt", bias: 7.5, shade: 0.05, veg: 0.02 },
  { type: "concrete", bias: 5, shade: 0.15, veg: 0.05 },
  { type: "grass", bias: -2.5, shade: 0.3, veg: 0.6 },
  { type: "tree canopy", bias: -6.5, shade: 0.8, veg: 0.9 },
  { type: "water", bias: -4.5, shade: 0.2, veg: 0.15 },
];

/** deterministic pseudo-random so the demo looks the same every run */
function rand(seed: number) {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

function surfaceFor(r: number, c: number) {
  const n = rand(r * 31 + c * 17);
  // core blocks skew paved, edges greener
  const edge = Math.min(r, c, TARGET.rows - 1 - r, TARGET.cols - 1 - c) / 5;
  if (n > 0.93) return SURFACES[4]!;
  if (n + edge * 0.5 > 0.85) return SURFACES[3]!;
  if (n + edge * 0.5 > 0.66) return SURFACES[2]!;
  if (n > 0.4) return SURFACES[0]!;
  return SURFACES[1]!;
}

/** diurnal base air temperature for Phoenix in August */
function baseTempAt(hour: number) {
  return 96 + 14 * Math.sin(((hour - 9.5) / 24) * Math.PI * 2);
}

export function buildFrames(startHour: number, hours = 12): HeatFrame[] {
  const frames: HeatFrame[] = [];
  for (let h = 0; h < hours; h++) {
    const hour = (startHour + h) % 24;
    const base = baseTempAt(hour);
    // surfaces store heat: paved penalty peaks mid/late afternoon
    const load = Math.max(0, Math.sin(((hour - 7) / 24) * Math.PI * 2)) * 1.15 + 0.35;
    const cells: HeatCell[] = [];
    for (let r = 0; r < TARGET.rows; r++) {
      for (let c = 0; c < TARGET.cols; c++) {
        const s = surfaceFor(r, c);
        const jitter = (rand(r * 7.3 + c * 3.1 + hour) - 0.5) * 1.6;
        cells.push({
          id: `${r}-${c}`,
          lat: TARGET.center[0] + (r - TARGET.rows / 2 + 0.5) * TARGET.cellSize,
          lng: TARGET.center[1] + (c - TARGET.cols / 2 + 0.5) * TARGET.cellSize,
          temp_f: Math.round((base + s.bias * load + jitter) * 10) / 10,
          surface_type: s.type,
          shade_index: Math.round(Math.min(1, Math.max(0, s.shade + jitter / 20)) * 100) / 100,
          vegetation_index: Math.round(s.veg * 100) / 100,
        });
      }
    }
    frames.push({
      timestamp: `2026-08-13T${String(hour).padStart(2, "0")}:00:00`,
      label: `${((hour + 11) % 12) + 1}${hour < 12 ? "am" : "pm"}`,
      cells,
    });
  }
  return frames;
}

/** Single swap point for the real FortyGuard API. */
export async function getHeatmapData(startHour = new Date().getHours()): Promise<HeatmapResponse> {
  return {
    activity_id: "mock-activity-0001",
    city: TARGET.city,
    center: TARGET.center,
    cell_size: TARGET.cellSize,
    granularity: 100,
    frames: buildFrames(startHour),
    source: "MOCK",
  };
}

/** thermal "ironbow" ramp: cool teal -> amber -> vermilion -> magenta */
export function heatColor(temp: number, min: number, max: number) {
  const t = max === min ? 0.5 : (temp - min) / (max - min);
  const stops = [
    [62, 216, 201],
    [120, 200, 150],
    [240, 168, 60],
    [232, 69, 47],
    [255, 45, 107],
  ];
  const p = t * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(p));
  const f = p - i;
  const a = stops[i]!;
  const b = stops[i + 1]!;
  return `rgb(${a.map((v, k) => Math.round(v + (b[k]! - v) * f)).join(",")})`;
}
