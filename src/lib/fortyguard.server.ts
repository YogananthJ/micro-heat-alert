/**
 * FortyGuard Temperature API client (server-only).
 *
 * Verified flow (api.fortyguard.com):
 *   POST /v1/heatmap  { polygon_aoi: GeoJSON Polygon, date_time, granularity: 60|80|100 }
 *     -> { data: { activity_id } }
 *   GET  /v1/status/{activity_id}
 *     -> { data: { status: "Processing" | "Completed", result: { map_data: FeatureCollection } } }
 * Tile properties carry average/min/max temperature in Celsius.
 */

import { TARGET, type HeatCell, type HeatFrame, type SurfaceType } from "./heatmap";

export interface RawPoint {
  lat: number;
  lng: number;
  temp_f: number;
}

const cToF = (c: number) => Math.round((c * 9) / 5 + 32 * 10) / 10;

interface Feature {
  properties?: { average_temperature?: number; min_temperature?: number; max_temperature?: number };
  geometry?: { coordinates?: number[][][] };
}

/** GeoJSON tiles -> centroid points in °F. */
export function featuresToPoints(features: Feature[]): RawPoint[] {
  const out: RawPoint[] = [];
  for (const f of features) {
    const ring = f.geometry?.coordinates?.[0];
    const c = f.properties?.average_temperature;
    if (!ring?.length || typeof c !== "number") continue;
    let lat = 0;
    let lng = 0;
    for (const [x, y] of ring) {
      lng += x ?? 0;
      lat += y ?? 0;
    }
    out.push({
      lat: lat / ring.length,
      lng: lng / ring.length,
      temp_f: Math.round(((c * 9) / 5 + 32) * 10) / 10,
    });
  }
  return out;
}

function aoiPolygon() {
  const [clat, clng] = TARGET.center;
  const dLat = (TARGET.rows * TARGET.cellSize) / 2;
  const dLng = (TARGET.cols * TARGET.cellSize) / 2;
  return {
    type: "Polygon",
    coordinates: [
      [
        [clng - dLng, clat - dLat],
        [clng + dLng, clat - dLat],
        [clng + dLng, clat + dLat],
        [clng - dLng, clat + dLat],
        [clng - dLng, clat - dLat],
      ],
    ],
  };
}

async function call(base: string, key: string, path: string, init?: RequestInit) {
  const res = await fetch(`${base.replace(/\/$/, "")}${path}`, {
    ...init,
    headers: { "api-key": key, "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`FortyGuard ${path} ${res.status}: ${text.slice(0, 200)}`);
  return JSON.parse(text) as Record<string, any>;
}

function isoDate(offsetDays: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - offsetDays);
  return d.toISOString().slice(0, 10);
}

async function runHeatmap(base: string, key: string, date: string, hour: number) {
  const created = await call(base, key, "/v1/heatmap", {
    method: "POST",
    body: JSON.stringify({
      polygon_aoi: aoiPolygon(),
      date_time: {
        start_date: date,
        start_time: `${String(hour).padStart(2, "0")}:00`,
        filter_type: 1,
      },
      granularity: 100,
    }),
  });
  const activityId: string | undefined = created?.["data"]?.activity_id;
  if (!activityId) throw new Error("FortyGuard: no activity_id returned");

  for (let i = 0; i < 12; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const status = await call(base, key, `/v1/status/${activityId}`);
    const d = status?.["data"];
    if (d?.status === "Completed") {
      return featuresToPoints((d.result?.map_data?.features ?? []) as Feature[]);
    }
    if (d?.status && d.status !== "Processing") {
      throw new Error(`FortyGuard job ${d.status}`);
    }
  }
  throw new Error("FortyGuard: heatmap activity timed out");
}

/** Requests the hyperlocal grid for the target AOI and returns tile points. */
export async function fetchHeatmapPoints(startHour: number): Promise<RawPoint[]> {
  const key = process.env["FORTYGUARD_API_KEY"];
  const base = process.env["FORTYGUARD_BASE_URL"] || "https://api.fortyguard.com";
  if (!key) throw new Error("FORTYGUARD_API_KEY missing");

  // Same-day data isn't always published yet — fall back one day.
  for (const offset of [1, 2]) {
    const points = await runHeatmap(base, key, isoDate(offset), startHour);
    if (points.length) return points;
  }
  throw new Error("FortyGuard: no tiles returned for this AOI");
}

const SURFACE_BY_DEV: { max: number; type: SurfaceType; shade: number; veg: number }[] = [
  { max: -1.2, type: "tree canopy", shade: 0.8, veg: 0.9 },
  { max: -0.7, type: "water", shade: 0.25, veg: 0.15 },
  { max: -0.2, type: "grass", shade: 0.3, veg: 0.6 },
  { max: 0.6, type: "concrete", shade: 0.15, veg: 0.05 },
  { max: Infinity, type: "asphalt", shade: 0.05, veg: 0.02 },
];

/**
 * Aggregate API tiles onto our fixed 10x10 inspection grid and infer surface
 * context from each block's deviation from the AOI mean (hot = paved, cool = shaded).
 */
export function pointsToCells(points: RawPoint[]): HeatCell[] {
  const [clat, clng] = TARGET.center;
  const cells: HeatCell[] = [];
  const buckets = new Map<string, number[]>();

  for (const p of points) {
    const r = Math.floor((p.lat - clat) / TARGET.cellSize + TARGET.rows / 2);
    const c = Math.floor((p.lng - clng) / TARGET.cellSize + TARGET.cols / 2);
    if (r < 0 || c < 0 || r >= TARGET.rows || c >= TARGET.cols) continue;
    const k = `${r}-${c}`;
    const arr = buckets.get(k) ?? [];
    arr.push(p.temp_f);
    buckets.set(k, arr);
  }

  const all = points.map((p) => p.temp_f);
  const globalMean = all.reduce((a, b) => a + b, 0) / Math.max(1, all.length);

  for (let r = 0; r < TARGET.rows; r++) {
    for (let c = 0; c < TARGET.cols; c++) {
      const vals = buckets.get(`${r}-${c}`) ?? [];
      const t = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : globalMean;
      cells.push({
        id: `${r}-${c}`,
        lat: clat + (r - TARGET.rows / 2 + 0.5) * TARGET.cellSize,
        lng: clng + (c - TARGET.cols / 2 + 0.5) * TARGET.cellSize,
        temp_f: Math.round(t * 10) / 10,
        surface_type: "concrete",
        shade_index: 0.15,
        vegetation_index: 0.05,
      });
    }
  }

  const mean = cells.reduce((a, c) => a + c.temp_f, 0) / Math.max(1, cells.length);
  for (const cell of cells) {
    const dev = cell.temp_f - mean;
    const s = SURFACE_BY_DEV.find((x) => dev <= x.max)!;
    cell.surface_type = s.type;
    cell.shade_index = s.shade;
    cell.vegetation_index = s.veg;
  }
  return cells;
}

function baseTempAt(hour: number) {
  return 96 + 14 * Math.sin(((hour - 9.5) / 24) * Math.PI * 2);
}

/**
 * The API is queried once for the reference hour; following hours are projected
 * with the diurnal curve while preserving each block's measured hyperlocal
 * offset, and paved blocks amplify the afternoon swing.
 */
export function projectFrames(cells: HeatCell[], startHour: number, hours = 12): HeatFrame[] {
  const mean = cells.reduce((a, c) => a + c.temp_f, 0) / Math.max(1, cells.length);
  const frames: HeatFrame[] = [];
  for (let h = 0; h < hours; h++) {
    const hour = (startHour + h) % 24;
    const delta = baseTempAt(hour) - baseTempAt(startHour);
    const load = Math.max(0, Math.sin(((hour - 7) / 24) * Math.PI * 2)) * 1.4 + 0.8;
    frames.push({
      timestamp: `${new Date().toISOString().slice(0, 10)}T${String(hour).padStart(2, "0")}:00:00`,
      label: `${((hour + 11) % 12) + 1}${hour < 12 ? "am" : "pm"}`,
      cells: cells.map((c) => ({
        ...c,
        temp_f: Math.round((mean + delta + (c.temp_f - mean) * load) * 10) / 10,
      })),
    });
  }
  return frames;
}

export { cToF };
