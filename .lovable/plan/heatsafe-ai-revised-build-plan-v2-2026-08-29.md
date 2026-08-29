# HeatSafe AI — Revised Build Plan (v2)

Adopting the review in full. Three foundation fixes come before any new UI: data
architecture, risk engine, routing provider.

## Layered architecture (frozen)
```
LOCATION + TIME -> AOI VALIDATOR -> DATA ORCHESTRATOR
        FortyGuard layer            Routing layer (OSRM)
                     \             /
                      NORMALIZED HeatAnalysis
          RISK ENGINE   HEAT EVENTS   ROUTE EXPOSURE
                      DECISION OBJECT
                        AI ADVISOR (explains only)
              CITIZEN      ROUTES       PLANNER
```
Every feature emits the same `Decision` shape (title, severity, summary,
reasons, actions, dataSources, limitations, modelVersion) so the UI stays
consistent. AI never calls FortyGuard and never computes a score.

## Phase 0 — Foundation (before any feature)
`src/lib/fortyguard/` split into `client.server.ts`, `activity.server.ts`
(submit + bounded poll with maxAttempts, maxDuration, AbortSignal; `Failed` is
terminal), `heatmap.server.ts`, `env-params.server.ts`, `cache.server.ts`,
`errors.server.ts`, `types.ts`. One polling implementation for all endpoints.

- Cache key = hash of the full normalized request (endpoint, aoi, dates/times,
  filterType, granularity, analyticType, threshold, direction / parameters).
- TTL by kind: historical 24h, current 20min, forecast 20min, demo fixed — all configurable.
- Freshness ladder: LIVE → CACHED (real response, shows fetch time + age) → DEMO
  (captured response, labelled). Mock data is never labelled live.
- Capability matrix (heatmap, mapStatistics, envParams + max, heatIntelligence,
  satellite, streetView) probed once and cached; Premium-only features disable
  gracefully instead of surfacing 403s.
- Time: UTC internally, `{requestedAtUTC, dataTimeUTC, displayTimezone, displayTime}`
  on every analysis; UI renders location-local time with the zone shown.
- AOI: US-only check, preset radii (1 km / 2 km / custom), area validated
  against the plan limit (10 mi² Basic / 50 mi² Premium) before any call.
- Granularity constant `DEFAULT_GRANULARITY = 100`, 60/80/100 supported internally.
- Real progress states: LOCATION_READY → HEATMAP_SUBMITTED → HEATMAP_PROCESSING →
  HEATMAP_COMPLETED → ENV_SUBMITTED → ENV_COMPLETED → RISK_CALCULATED →
  AI_GENERATING → COMPLETE, mapped to friendly labels (no fake steps).
- Analysis ID `HS-YYYY-MM-DD-NNN` recorded with activity IDs and model versions.

## Phase 1 — Location + dashboard
US search + five deterministic demo locations (Phoenix, Las Vegas, Miami, New
York, Los Angeles), AOI build/validate, single heatmap request, freshness badge
with timestamp, progress checklist, stat cards, forecast strip.

## Phase 2 — HeatSafe Risk Engine v1.0 (tests before UI)
```
normalizeClamped(value, lower, upper)   // <lower=0, >upper=1, bounds documented
thermalSeverity = 0.50*nHeatIndex + 0.30*nWetBulb + 0.20*nTemperature
durationSeverity = nPersistence
risk = 0.80*thermalSeverity + 0.20*durationSeverity      // 0..100
LOW 0-25 · MODERATE 26-50 · HIGH 51-75 · EXTREME 76-100
```
Missing env inputs re-weight the remaining thermal terms **and** set
`dataCompleteness: HIGH|PARTIAL|LOW`, which is shown, not hidden. UI displays
Thermal Severity, Exposure and Risk separately, each tagged "HeatSafe model v1.0".
Copy states it is a prototype decision-support score, not a medical or official
warning and not a FortyGuard metric.

## Phase 3 — Heat events (native FortyGuard analytics)
Threshold selector → two heatmap requests with `analytic_type: exceedance` and
`persistence` (direction above). Show hours above threshold and longest
continuous run per zone, plus an event map layer. Request model supports
historical / current / forecast rather than a fixed 12-frame assumption.

## Phase 4 — AI Advisor
Input is the compact `HeatAnalysis` facts object only — never GeoJSON. Output is
schema-validated (`summary, riskLevel, reasons[], actions[], limitations[],
sourceFacts[]`); one retry on invalid, then a deterministic rule-based fallback.
Grounding rule in the system prompt: use only supplied numbers, never invent
temperature, time, distance, score, persistence or percentages; say when a fact
is unavailable. No medical claims.

## Phase 5 — Heat-Aware Routes (renamed from "Safe Routes")
Real road routes from OSRM (public routing API, no key) with alternatives; each
route sampled ~100 m, samples matched to heat cells.
```
routeExposure = 0.45*nAvgHeat + 0.30*nPeakHeat + 0.25*nExtremeDuration   // 0..100
delta% = (fastestExposure - routeExposure) / fastestExposure * 100
```
Labels: Fastest / Balanced / Coolest, "N% lower estimated heat exposure" (never
"safer"). Each route carries a **data coverage** rating (HIGH/MEDIUM/LOW) based
on sampled-cell hit rate. If routing fails: "Heat corridor comparison
unavailable" — no straight-line substitute in production; any dev fallback is
labelled "Illustrative corridor — not a navigable route". Methodology block
printed on the page.

## Phase 6 — City Heat Planner (read-only model)
Zones come from real geometry where available, otherwise neutral "Analysis Zone
A/B/C" — never AI-invented district names.
```
priority = 0.45*risk + 0.30*persistence + 0.25*affectedArea   // heat-exposed area, not people
budget: 20% split equally + 80% by priority share
```
"Why this priority?" panel lists the driving numbers. Interventions fire only
when their `InterventionEvidence` exists (vegetation / solar / surface class),
otherwise "Insufficient environmental evidence". OBSERVED/FORECAST and SCENARIO
are separate tabs; scenario numbers labelled "Scenario estimate". Only budget,
threshold and location are user-editable — weights are fixed.

## Phase 7 — Landing + How It Works
Landing: problem → solution → SEE / PREDICT / DECIDE / ACT → single CTA. Kept
small. How It Works carries the architecture diagram, the FortyGuard-provides vs
HeatSafe-provides split, methodology for risk/routes/events/planner, and current
API limitations (US-only, 12h forecast window, plan tiers).

## Phase 8 — Trust + polish
"Data & Method" drawer (one entry per layer with source, status, timestamp,
model version, activity IDs) replaces per-number chips; cards carry a single
small source line. "View Analysis Details" reproduces any run. Then mobile,
empty/error states, accessibility, README, demo script.

## Tests
`normalizeClamped`, `calculateRisk`, `calculateRiskWithMissingEnv`,
`getRiskLevel`, `routeExposure`, `calculateRouteDelta`, `heatEvents`,
`calculatePriority`, `allocateBudget`, `validateAOI`, `formatLocalTime`.
Extremes (0/20/30/35/40/50 °C, humidity 0/50/100) must never yield NaN or
out-of-range scores. Contract tests mock 200/400/401/403/404/429/500 and
Processing/Completed/Failed.

## Call budget
One heatmap + one env request per analysis; routes only on "Compare Routes";
planner only on entering Planner; Heat Intelligence (Premium) is an optional
deep-analysis action, never on dashboard load.

## Open item
Routing provider is set to public OSRM (keyless). Say the word if you'd rather
use Mapbox Directions or ORS and I'll wire that key path instead.
