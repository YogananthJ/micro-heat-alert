/**
 * HeatSafe Risk v1.0 — our own deterministic model, built on FortyGuard data.
 * FortyGuard measures; HeatSafe interprets. This is never a FortyGuard metric.
 *
 *   thermalSeverity = 0.50*nHeatIndex + 0.30*nWetBulb + 0.20*nTemperature
 *   exposureSeverity = nPersistence
 *   risk = 0.80*thermalSeverity + 0.20*exposureSeverity        (0..100)
 *
 * Missing environmental inputs re-weight the remaining thermal terms and are
 * reported through `dataCompleteness` — never silently hidden.
 */

import {
  RISK_MODEL_VERSION,
  type DataCompleteness,
  type EnvironmentReading,
  type RiskResult,
  type Severity,
} from "@/types/analysis";

/** Bounds are documented, inclusive-clamped, and never produce NaN. */
export function normalizeClamped(value: number, lower: number, upper: number): number {
  if (!Number.isFinite(value) || upper <= lower) return 0;
  if (value <= lower) return 0;
  if (value >= upper) return 1;
  return (value - lower) / (upper - lower);
}

export const BOUNDS = {
  heatIndexC: [27, 54] as const,
  wetBulbC: [21, 35] as const,
  temperatureC: [24, 48] as const,
  persistenceH: [0, 8] as const,
};

export function getRiskLevel(score: number): Severity {
  if (score <= 25) return "LOW";
  if (score <= 50) return "MODERATE";
  if (score <= 75) return "HIGH";
  return "EXTREME";
}

export interface RiskInput {
  /** area mean air temperature, °C — always required */
  temperatureC: number;
  environment: EnvironmentReading;
  /** longest continuous run above threshold, hours (FortyGuard persistence) */
  persistenceHours?: number;
}

export function calculateRisk(input: RiskInput): RiskResult {
  const missing: string[] = [];

  const terms: { key: string; label: string; weight: number; n: number; display: string }[] = [];

  const hi = input.environment.heatIndexC;
  if (typeof hi === "number") {
    terms.push({
      key: "heatIndex",
      label: "Heat index",
      weight: 0.5,
      n: normalizeClamped(hi, ...BOUNDS.heatIndexC),
      display: `${hi.toFixed(1)} °C`,
    });
  } else missing.push("Heat index");

  const wb = input.environment.wetBulbC;
  if (typeof wb === "number") {
    terms.push({
      key: "wetBulb",
      label: "Wet-bulb temperature",
      weight: 0.3,
      n: normalizeClamped(wb, ...BOUNDS.wetBulbC),
      display: `${wb.toFixed(1)} °C`,
    });
  } else missing.push("Wet-bulb temperature");

  terms.push({
    key: "temperature",
    label: "Surface-level air temperature",
    weight: 0.2,
    n: normalizeClamped(input.temperatureC, ...BOUNDS.temperatureC),
    display: `${input.temperatureC.toFixed(1)} °C`,
  });

  const weightSum = terms.reduce((a, t) => a + t.weight, 0);
  const thermalSeverity = terms.reduce((a, t) => a + (t.weight / weightSum) * t.n, 0);

  const hasPersistence = typeof input.persistenceHours === "number";
  if (!hasPersistence) missing.push("Heat persistence");
  const exposureSeverity = hasPersistence
    ? normalizeClamped(input.persistenceHours!, ...BOUNDS.persistenceH)
    : thermalSeverity; // conservative stand-in, reported as incomplete

  const score = Math.round((0.8 * thermalSeverity + 0.2 * exposureSeverity) * 100);

  const completeness: DataCompleteness =
    missing.length === 0 ? "HIGH" : missing.length <= 1 ? "PARTIAL" : "LOW";

  return {
    thermalSeverity: Math.round(thermalSeverity * 100),
    exposureSeverity: Math.round(exposureSeverity * 100),
    score: Math.min(100, Math.max(0, score)),
    level: getRiskLevel(score),
    dataCompleteness: completeness,
    modelVersion: RISK_MODEL_VERSION,
    drivers: terms.map((t) => ({
      label: t.label,
      value: t.display,
      contribution: Math.round((t.weight / weightSum) * t.n * 100),
    })),
    missingInputs: missing,
  };
}

export const RISK_LEVEL_TOKEN: Record<Severity, string> = {
  LOW: "text-cool",
  MODERATE: "text-caution",
  HIGH: "text-danger",
  EXTREME: "text-critical",
};
