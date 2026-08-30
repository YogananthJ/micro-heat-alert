# HeatSafe AI — Product Specification (frozen)

## Target users

- **Individuals** — pedestrians, cyclists, commuters, outdoor workers making short-horizon exposure decisions.
- **Businesses** — operators who need to understand heat exposure around specific sites and shifts.
- **Cities** — planners prioritizing heat-adaptation interventions with limited budget.

## Problem

A single city-wide temperature hides significant variation across neighborhoods, streets, and hours. A shaded path can be far cooler than the adjacent asphalt lot at the same reported "city temperature." People and cities have no block-level view of when and where heat actually becomes dangerous.

## Solution

HeatSafe AI normalizes FortyGuard hyperlocal temperature intelligence into a deterministic risk model, surfaces heat events over time, and turns the result into explainable decisions: where to avoid, when to go, which route to take, and which zones to treat first.

## Core features

| Feature | Purpose |
| --- | --- |
| Heat Intelligence | Hyperlocal heatmap grid + 12-hour forecast, FortyGuard-sourced |
| HeatSafe Risk | Deterministic 0–100 score with thermal severity and persistence components |
| Heat Events | Native FortyGuard exceedance and persistence analytics over the forecast window |
| Heat-Aware Routes | Real road routes scored by cumulative heat exposure |
| City Heat Planner | Zone prioritization, evidence-gated interventions, budget scenarios |
| AI Advisor | Plain-language explanation of supplied facts, schema-validated |

## Modes

- **Citizen** — personal heat decisions (risk, forecast, routes, advisor).
- **Planner** — city-scale decisions (zones, priorities, interventions, budget).

## Information architecture

```
/              Landing
/dashboard     Heat Dashboard
/routes        Heat-Aware Routes
/planner       City Heat Planner
/how-it-works  Methodology, provenance, limitations
```

Landing order: Navigation → Hero → Problem → Solution → SEE/PREDICT/DECIDE/ACT → Product demo preview → Use cases → How it works → Trust & data → CTA → Footer.

## Non-goals (frozen out of scope)

User accounts, notifications/alerts, multi-country support, native mobile packaging, turn-by-turn navigation, engineering-grade cost estimating, storing user location profiles.

## User journeys

1. **Citizen:** land → Analyze Heat → location → map + risk card → inspect hottest cell → forecast → heat event → ask AI Advisor → compare routes.
2. **Planner:** switch to Planner → zone priorities → open evidence for priority #1 → apply intervention → budget scenario → export/read methodology.

## Business value

Heat exposure is a measurable operational and public-health cost. HeatSafe converts an existing hyperlocal data feed into decisions that reduce that exposure — a thin, defensible layer between raw temperature intelligence and the people who must act on it.

## Limitations

- FortyGuard API coverage is U.S.-only.
- HeatSafe Risk is a prototype model, not a validated clinical or engineering index.
- Routing depends on external public road-network data.
- Budget scenarios are illustrative, not engineering cost estimates.
- AI output is decision support and cannot alter or invent source values.
- Results degrade to CACHED or DEMO when live data or capabilities are unavailable; the state is always shown.
