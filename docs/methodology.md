# HeatSafe AI — Methodology

**Methodology v1.0 · HeatSafe Risk v1.0 · Last updated: August 2026**

HeatSafe Risk is our own deterministic model built using FortyGuard data. FortyGuard does not compute it.

## 1. Data sources

| Source | Provides |
| --- | --- |
| FortyGuard `/v1/heatmap` | Hyperlocal temperature grid (60m / 80m / 100m granularity), async activity → status polling → GeoJSON |
| FortyGuard environmental parameters | Up to 3 parameters per request (MVP: temperature, heat index, wet-bulb) |
| FortyGuard `exceedance` | Hours above a threshold within the window |
| FortyGuard `persistence` | Sustained-heat duration analytics |
| Public road network (OSRM) | Route geometry for exposure scoring |

Coverage is currently U.S.-only. Basic plan limits: ≤10 mi² AOI, ≤3 environmental parameters per request.

## 2. Normalization

Every response is normalized into a single `HeatAnalysis` object before any model runs: cells with lat/lng, temperature in °C (with °F derived), environment values, UTC and local timestamps, granularity, AOI, freshness (`LIVE` / `CACHED` / `DEMO`), coverage, and a data-completeness fraction.

Each environmental value is min–max normalized to 0–1 against fixed reference ranges so components remain comparable across locations and seasons.

## 3. HeatSafe Risk v1.0

Two-stage, deterministic, no AI involved.

**Stage 1 — Thermal severity (0–100)** combines the normalized available parameters:

```
thermal = 100 × ( w_hi·n(heat_index) + w_wb·n(wet_bulb) + w_t·n(temperature) )
```

Weights are fixed and read-only. Missing parameters are dropped and remaining weights renormalized; the drop is reported as reduced **data completeness**, never silently imputed.

**Stage 2 — Persistence severity (0–100)** derives from FortyGuard exceedance/persistence hours over the analysis window.

**Composite:**

```
HeatSafe Risk = 0.80 × thermal + 0.20 × persistence
```

Bands: `0–39 LOW · 40–59 MODERATE · 60–79 HIGH · 80–100 EXTREME`. Bands are always shown as text alongside color.

Every risk card exposes a "Why this score?" breakdown: thermal severity, persistence, data completeness, and the model version.

## 4. Heat events

Heat events use FortyGuard's native `exceedance` and `persistence` analytics rather than being reconstructed from projected frames. An event is reported with its threshold, start/end local time, peak value, and affected cell count.

## 5. Route exposure

```
Road routes → sample points along geometry → nearest heat cells → per-sample risk → aggregate
```

Components (each normalized 0–1): mean exposure, peak exposure, and time-weighted duration. Routes are ranked by combined exposure and always report the fraction of samples that fell inside covered heat cells. If coverage is insufficient, the route is shown as unscored — never as a misleading straight-line estimate.

## 6. Planner scoring

```
Heat zones → risk + persistence + heat-exposed area → priority → intervention rules → budget scenario
```

Zones use real geographic names where available, otherwise neutral `Analysis Zone N` labels. Priority weights are fixed and read-only. We score **heat-exposed area**, not population exposure, because we do not ingest population data. Interventions are evidence-gated: an intervention is only suggested when the zone's measured conditions satisfy its rule.

## 7. Budget allocation

Illustrative scenario only:

```
20% distributed equally across selected zones
80% distributed proportionally to priority score
```

Outputs are scenario estimates, clearly labeled, and are not engineering cost estimates.

## 8. AI grounding

The AI Advisor receives only compact, already-computed facts and returns schema-validated JSON. If validation fails, a deterministic fallback explanation is rendered.

**The AI cannot modify source facts or invent numerical values.** It does not compute risk, exposure, or priority.

## 9. Data provenance

A `SourceBadge` accompanies every derived number:

- **FortyGuard** — observed / forecast temperature intelligence
- **HeatSafe Model** — our deterministic analytical model
- **AI Advisor** — AI-generated explanation based on supplied facts
- **Routing Data** — external public road-network data
- **Scenario Estimate** — forward-looking calculation using assumptions

Status states always name the source and timestamp: `● LIVE FortyGuard · Updated 14:32`, `● CACHED … Cache age 18 min`, `● DEMO DATA`.

## 10. Limitations

- FortyGuard API coverage is U.S.-only.
- HeatSafe Risk is a prototype model; weights are reasoned, not empirically validated against health outcomes.
- Routing depends on external public road data and its availability.
- Scenario estimates are not engineering cost estimates.
- AI output is decision support only.
- Results depend on available API capabilities and data coverage at request time.

**Important:** HeatSafe is an experimental decision-support product. HeatSafe Risk is not a medical diagnosis, emergency warning, or engineering certification. Recommendations should not replace official public-safety guidance or professional judgment.
