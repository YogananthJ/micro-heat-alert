# HeatSafe AI — Full Build Plan (FortyGuard Hackathon '26)

## Where we are today
Working already: live FortyGuard `/v1/heatmap` → `activity_id` → `/v1/status` polling, server-side key, hourly cache, mock fallback, Leaflet grid map, 12-hour scrubber, tile inspector, AI advisor panel (Lovable AI Gateway).

Gap vs. the target product: single hardcoded Phoenix view, no landing page, no risk score, no environmental parameters, no heat-event (exceedance/persistence) analysis, no safe routes, no city-planner mode, no explainability, no provenance labels.

## Target scope (frozen — nothing beyond this)
1. Landing page (problem → solution → SEE/PREDICT/DECIDE/ACT)
2. Dashboard: US location search → heatmap + stat cards + forecast timeline
3. HeatSafe Risk Engine (our model, clearly labelled)
4. Heat Event analysis (exceedance hours + longest persistence run)
5. AI Advisor (structured data in, explainable recommendation out)
6. Safe Routes (fastest / balanced / coolest with exposure delta)
7. City Planner mode (hotspot ranking + intervention priorities + budget split)
8. Explainability + provenance chips on every number
9. How It Works page

## Pages and routes
```
/                  Landing — problem, solution, 4-step story, CTA "Analyze Heat"
/dashboard         Citizen mode: search, map, cards, forecast, heat events, AI advisor
/routes            Safe Routes: A→B, three candidates ranked by heat exposure
/planner           City Planner: hotspot ranking, intervention priorities, budget
/how-it-works      Architecture diagram, data provenance, limitations
```
Shared header with mode toggle (Citizen | Planner) and a live/cached data badge.

## Data + API flow
```
User picks location (US-only presets + geocode search)
        ↓
POST /v1/heatmap  { polygon_aoi, date_time, granularity: 100 }
        ↓ activity_id
GET /v1/status/{id}  → poll → Completed → GeoJSON + stats
        ↓
POST /v1/env_params (heat index, humidity, wet-bulb; optional, degrades gracefully)
        ↓
Risk Engine (ours) → Heat Events (ours) → Route Exposure (ours)
        ↓
AI Advisor (structured JSON facts only, never invents numbers)
        ↓
UI: map + cards + recommendation + action
```
Progress is streamed to the UI as a checklist (Location identified → Requesting temperature intelligence → Processing heat distribution → Calculating risk → Generating recommendations).

## Risk engine (transparent, testable)
```
risk = 0.40*normTemp + 0.25*normHeatIndex + 0.15*normHumidity
     + 0.10*normWetBulb + 0.10*normPersistence      → 0..100
0-25 LOW · 26-50 MODERATE · 51-75 HIGH · 76-100 EXTREME
```
Each term is min-max normalised against documented comfort/danger bounds; missing
env inputs re-weight the remaining terms rather than defaulting to zero.
Labelled everywhere as "HeatSafe model", never as FortyGuard output.

## Heat events
From the 12-hour projected frames per grid cell: hours above a user-set threshold
(exceedance) and longest continuous run (persistence). Rendered as a second map
layer plus a per-zone table.

## Safe routes
Straight-line + two waypoint-offset candidates between A and B, sampled every
~100 m, each sample snapped to the nearest heat cell. Score =
`avg_temp*0.5 + peak_temp*0.3 + minutes_in_extreme*0.2`. Output: fastest /
balanced / coolest with time delta and "% lower estimated exposure".

## City planner
Cluster the grid into named districts, rank by risk + persistence + exposure,
recommend interventions from a rules table (low vegetation → tree canopy; high
solar + paved → shade/cool roofs; high persistence + residential → cooling
station), and split a user-entered budget proportionally to risk-weighted area.
All forward-looking numbers labelled "Scenario estimate".

## Reliability (the hackathon-failure list)
- Instant first paint from a cached/demo grid; live feed upgrades in the background
- Server-side hourly cache keyed by (aoi, hour) — repeat clicks are free
- Typed error mapping for 400/401/403/429/500 with a Retry button and "last successful analysis" timestamp
- Never a raw 500 on screen; badge always states LIVE / CACHED / DEMO honestly
- AI never asserts medical outcomes and may answer "not enough data"
- Unit tests for `calculateRisk`, `getRiskLevel`, `routeExposure`, `heatEvents`
- US-only coverage enforced in the location picker with an explanatory note

## Technical notes
- Stays on the current TanStack Start stack (server functions hold the API key; nothing client-side).
- New modules: `src/lib/risk-engine.ts`, `src/lib/heat-events.ts`, `src/lib/route-exposure.ts`, `src/lib/env-params.server.ts`, `src/lib/planner.ts`, plus thin `*.functions.ts` wrappers.
- Existing `fortyguard.server.ts` gains an AOI parameter so the grid is no longer Phoenix-only.
- AI advisor upgraded to tool-style structured input (temperature, heat index, risk, persistence, route options) with strict JSON output.
- Each route file gets its own SEO head metadata.

## Build order
1. Location/AOI parameterisation + progress-streamed analyze flow
2. Risk engine + stat cards + provenance chips (+ tests)
3. Heat events layer and table
4. Landing page and How It Works
5. AI Advisor upgrade (explainable, tool-aware)
6. Safe Routes
7. City Planner
8. Polish, error states, mobile, README + demo script
