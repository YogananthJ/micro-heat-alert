/**
 * Location, AOI and time helpers. Browser-safe (no secrets, no server imports).
 * FortyGuard coverage is U.S.-only, so every location is validated against a
 * continental-US bounding box before any request is made.
 */

import type { Aoi, GeoLocation } from "@/types/analysis";

export const DEMO_LOCATIONS: GeoLocation[] = [
  {
    id: "phoenix",
    name: "Downtown Phoenix",
    region: "AZ",
    lat: 33.4484,
    lng: -112.074,
    timezone: "America/Phoenix",
  },
  {
    id: "las-vegas",
    name: "Las Vegas Strip",
    region: "NV",
    lat: 36.1147,
    lng: -115.1728,
    timezone: "America/Los_Angeles",
  },
  {
    id: "miami",
    name: "Downtown Miami",
    region: "FL",
    lat: 25.7743,
    lng: -80.1937,
    timezone: "America/New_York",
  },
  {
    id: "new-york",
    name: "Midtown Manhattan",
    region: "NY",
    lat: 40.7549,
    lng: -73.984,
    timezone: "America/New_York",
  },
  {
    id: "los-angeles",
    name: "Downtown Los Angeles",
    region: "CA",
    lat: 34.0522,
    lng: -118.2437,
    timezone: "America/Los_Angeles",
  },
];

export function locationById(id: string): GeoLocation {
  return DEMO_LOCATIONS.find((l) => l.id === id) ?? DEMO_LOCATIONS[0]!;
}

/** Continental US + AK/HI generous envelope. */
export function isInCoverage(lat: number, lng: number): boolean {
  if (lat >= 24 && lat <= 50 && lng >= -125 && lng <= -66) return true; // CONUS
  if (lat >= 51 && lat <= 72 && lng >= -170 && lng <= -129) return true; // AK
  if (lat >= 18 && lat <= 23 && lng >= -161 && lng <= -154) return true; // HI
  return false;
}

const KM_PER_DEG_LAT = 110.574;
const SQKM_PER_SQMI = 2.58999;

/** Square AOI of `radiusKm` half-width around a point, as a closed GeoJSON ring. */
export function buildAoi(lat: number, lng: number, radiusKm = 1): Aoi {
  const dLat = radiusKm / KM_PER_DEG_LAT;
  const dLng = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
  const ring: [number, number][] = [
    [lng - dLng, lat - dLat],
    [lng + dLng, lat - dLat],
    [lng + dLng, lat + dLat],
    [lng - dLng, lat + dLat],
    [lng - dLng, lat - dLat],
  ];
  const areaSqKm = (2 * radiusKm) ** 2;
  return {
    coordinates: ring,
    center: [lat, lng],
    radiusKm,
    areaSqMi: Math.round((areaSqKm / SQKM_PER_SQMI) * 100) / 100,
  };
}

export function validateAoi(aoi: Aoi, maxAreaSqMi: number): { ok: boolean; reason?: string } {
  const [lat, lng] = aoi.center;
  if (!isInCoverage(lat, lng)) {
    return { ok: false, reason: "Temperature coverage is currently United States only." };
  }
  if (aoi.areaSqMi > maxAreaSqMi) {
    return {
      ok: false,
      reason: `Area is ${aoi.areaSqMi} mi²; the current plan allows up to ${maxAreaSqMi} mi².`,
    };
  }
  return { ok: true };
}

export function formatLocalTime(utcIso: string, timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timezone,
      timeZoneName: "short",
    }).format(new Date(utcIso));
  } catch {
    return new Date(utcIso).toISOString().slice(11, 16) + " UTC";
  }
}

let analysisSeq = 0;
export function nextAnalysisId(now = new Date()): string {
  analysisSeq = (analysisSeq + 1) % 1000;
  return `HS-${now.toISOString().slice(0, 10)}-${String(analysisSeq).padStart(3, "0")}`;
}

export const cToF = (c: number) => Math.round(((c * 9) / 5 + 32) * 10) / 10;
export const fToC = (f: number) => Math.round((((f - 32) * 5) / 9) * 10) / 10;
