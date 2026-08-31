import { describe, expect, it } from "vitest";
import { calculateRisk, getRiskLevel, normalizeClamped } from "./risk";

describe("normalizeClamped", () => {
  it("clamps to the documented bounds", () => {
    expect(normalizeClamped(10, 20, 40)).toBe(0);
    expect(normalizeClamped(50, 20, 40)).toBe(1);
    expect(normalizeClamped(30, 20, 40)).toBeCloseTo(0.5);
  });
  it("never returns NaN for bad input", () => {
    expect(normalizeClamped(Number.NaN, 0, 1)).toBe(0);
    expect(normalizeClamped(5, 10, 10)).toBe(0);
  });
});

describe("getRiskLevel", () => {
  it("maps bands", () => {
    expect(getRiskLevel(0)).toBe("LOW");
    expect(getRiskLevel(26)).toBe("MODERATE");
    expect(getRiskLevel(51)).toBe("HIGH");
    expect(getRiskLevel(100)).toBe("EXTREME");
  });
});

describe("calculateRisk", () => {
  it("reports HIGH completeness with all inputs", () => {
    const r = calculateRisk({
      temperatureC: 42,
      environment: { heatIndexC: 48, wetBulbC: 30, relativeHumidity: 35 },
      persistenceHours: 6,
    });
    expect(r.dataCompleteness).toBe("HIGH");
    expect(r.score).toBeGreaterThan(50);
    expect(r.score).toBeLessThanOrEqual(100);
  });

  it("re-weights when environmental inputs are missing", () => {
    const r = calculateRisk({ temperatureC: 30, environment: {} });
    expect(r.dataCompleteness).toBe("LOW");
    expect(r.missingInputs.length).toBeGreaterThan(1);
    expect(Number.isFinite(r.score)).toBe(true);
  });

  it("stays in range across extremes", () => {
    for (const t of [0, 20, 30, 35, 40, 50]) {
      for (const rh of [0, 50, 100]) {
        const r = calculateRisk({
          temperatureC: t,
          environment: { heatIndexC: t + 4, wetBulbC: t - 6, relativeHumidity: rh },
          persistenceHours: 3,
        });
        expect(r.score).toBeGreaterThanOrEqual(0);
        expect(r.score).toBeLessThanOrEqual(100);
        expect(Number.isNaN(r.score)).toBe(false);
      }
    }
  });
});
