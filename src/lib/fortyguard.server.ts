/**
 * FortyGuard Temperature API client (server-only).
 *
 * Flow: POST /v1/heatmap creates an async activity, then we poll until the
 * grid is ready. Response shapes vary slightly between dev/prod, so the
 * parser is intentionally tolerant and normalises to { lat, lng, temp_f }.
 */

import { TARGET, type HeatCell, type HeatFrame, type SurfaceType } from "./heatmap";

export interface RawPoint {
  lat: number;
  lng: number;
  temp_f: number;
}

const num = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN);

function cToF(v: number) {
  // FortyGuard returns Celsius; anything already > 60 is assumed Fahrenheit.
  return v > 60 ? v : v * 9 / 5 + 32;
}

/** Pull every {lat,lon,temperature}-ish object out of an arbitrary payload. */
export function extractPoints(payload: unknown): RawPoint[] {
  const out: RawPoint[] = [];
  const seen = new Set<unknown>();

  const walk = (node: unknown) => {
    if (!node || typeof node !== "object" || seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) {
      for (const n of node) walk(n);
      return;
    }
    const o = node as Record<string, unknown>;
    const lat = num(o["lat"] ?? o["latitude"] ?? o["y"]);
    const lng = num(o["lng"] ?? o["lon"] ?? o["longitude"] ?? o["x"]);
    const t = num(
      o["temperature"] ?? o["temp"] ?? o["value"] ?? o["temperature_c"] ?? o["air_temperature"],
    );
    if (Number.isFinite(lat) && Number.isFinite(lng) && Number.isFinite(t)) {
      out.push({ lat, lng, temp_f: Math.round(cToF(t) * 10) / 10 });
      return;
    }
    for (const v of Object.values(o)) walk(v);
  };

  walk(payload);
  return out;
}

function aoiPolygon() {
  const [clat, clng] = TARGET.center;
  const dLat = (TARGET.rows * TARGET.cellSize) / 2;
  const dLng = (TARGET.cols * TARGET.cellSize) / 2;
  return [
    [clng - dLng, clat - dLat],
    [clng + dLng, clat - dLat],
    [clng + dLng, clat + dLat],
    [clng - dLng, clat + dLat],
    [clng - dLng, clat - dLat],
  ];
}

async function call(base: string, key: string, path: string, init?: RequestInit) {
  const res = await fetch(`${base.replace(/\/$/, "")}${path}`, {
    ...init,
    headers: {
      "api-key": key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* non-JSON */
  }
  if (!res.ok) throw new Error(`FortyGuard ${path} ${res.status}: ${text.slice(0, 240)}`);
  return json;
}

/** Requests the hyperlocal grid for the target AOI and returns raw points. */
export async function fetchHeatmapPoints(startHour: number): Promise<RawPoint[]> {
  const key = process.env["FORTYGUARD_API_KEY"];
  const base = process.env["FORTYGUARD_BASE_URL"] || "https://api.fortyguard.com";
  if (!key) throw new Error("FORTYGUARD_API_KEY missing");

  const now = new Date();
  const body = {
    polygon_aoi: aoiPolygon(),
    date_time: {
      start_date: now.toISOString().slice(0, 10),
      start_time: `${String(startHour).padStart(2, "0")}:00`,
      filter_type: 1,
    },
    granularity: 100,
  };

  const created = (await call(base, key, "/v1/heatmap", {
    method: "POST",
    body: JSON.stringify(body),
  })) as Record<string, unknown> | null;

  let points = extractPoints(created);
  if (points.length) return points;

  const activityId =
    (created?.["activity_id"] as string | undefined) ??
    (created?.["activityId"] as string | undefined) ??
    ((created?.["data"] as Record<string, unknown> | undefined)?.["activity_id"] as
      | string
      | undefined);
  if (!activityId) throw new Error("FortyGuard: no activity_id and no inline points");

  for (let i = 0; i < 12; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const result = await call(base, key, `/v1/heatmap/${activityId}`);
    points = extractPoints(result);
    if (points.length) return points;
  }
  throw new Error("FortyGuard: heatmap activity timed out");
}

const SURFACE_BY_TEMP: { max: number; type: SurfaceType; shade: number; veg: number }[] = [
  { max: -6, type: "tree canopy", shade: 0.8, veg: 0.9 },
  { max: -3.5, type: "water", shade: 0.25, veg: 0.15 },
  { max: -1, type: "grass", shade: 0.3, veg: 0.6 },
  { max: 3, type: "concrete", shade: 0.15, veg: 0.05 },
  { max: Infinity, type: "asphalt", shade: 0.05, veg: 0.02 },
];

/**
 * Snap raw API points onto our fixed inspection grid and infer surface context
 * from each cell's deviation from the block mean (hot = paved, cool = shaded).
 */
export function pointsToCells(points: RawPoint[]): HeatCell[] {
  const cells: HeatCell[] = [];
  const [clat, clng] = TARGET.center;
  const temps: number[] = [];

  for (let r = 0; r < TARGET.rows; r++) {
    for (let c = 0; c < TARGET.cols; c++) {
      const lat = clat + (r - TARGET.rows / 2 + 0.5) * TARGET.cellSize;
      const lng = clng + (c - TARGET.cols / 2 + 0.5) * TARGET.cellSize;
      let best: RawPoint | null = null;
      let bestD = Infinity;
      for (const p of points) {
        const d = (p.lat - lat) ** 2 + (p.lng - lng) ** 2;
        if (d < bestD) {
          bestD = d;
          best = p;
        }
      }
      const temp = best ? best.temp_f : NaN;
      temps.push(temp);
      cells.push({
        id: `${r}-${c}`,
        lat,
        lng,
        temp_f: temp,
        surface_type: "concrete",
        shade_index: 0.15,
        vegetation_index: 0.05,
      });
    }
  }

  const valid = temps.filter((t) => Number.isFinite(t));
  const mean = valid.reduce((a, b) => a + b, 0) / Math.max(1, valid.length);
  for (const cell of cells) {
    if (!Number.isFinite(cell.temp_f)) cell.temp_f = Math.round(mean * 10) / 10;
    const dev = cell.temp_f - mean;
    const s = SURFACE_BY_TEMP.find((x) => dev <= x.max)!;
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
 * The API is queried once for the current hour; the following hours are
 * projected with the diurnal curve while keeping each cell's measured
 * hyperlocal offset (the whole point of the app).
 */
export function projectFrames(cells: HeatCell[], startHour: number, hours = 12): HeatFrame[] {
  const mean = cells.reduce((a, c) => a + c.temp_f, 0) / Math.max(1, cells.length);
  const frames: HeatFrame[] = [];
  for (let h = 0; h < hours; h++) {
    const hour = (startHour + h) % 24;
    const delta = baseTempAt(hour) - baseTempAt(startHour);
    // paved surfaces amplify the swing, canopy damps it
    const load = Math.max(0, Math.sin(((hour - 7) / 24) * Math.PI * 2)) * 0.5 + 0.75;
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
