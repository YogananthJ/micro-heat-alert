# HeatSafe AI — Hyperlocal Heat Intelligence

**Turn heat intelligence into action.**

HeatSafe AI transforms hyperlocal temperature intelligence into explainable insights for people,
businesses, and cities. Built for FortyGuard Hackathon '26.

## Problem

City-level temperature reports hide dangerous local variation. A shaded park path can be several
degrees cooler than the asphalt lot next to it at the same reported "city temperature". People
walking, commuting, or working outdoors have no way to know which blocks and which hours are
actually risky.

## What HeatSafe does

| Step | Surface |
| --- | --- |
| SEE — where heat concentrates | Heat Dashboard (`/dashboard`) |
| PREDICT — when heat peaks and persists | Forecast slider + persistence analytics |
| DECIDE — compare exposure | HeatSafe Risk panel, City Heat Planner (`/planner`) |
| ACT — choose cooler options | Heat-Aware Routes (`/routes`) |

Methodology and limitations are documented in-product at `/how-it-works`.

## Data source

FortyGuard Temperature Intelligence, called server-side only:

- `POST /v1/heatmap` — hyperlocal ~2 m air temperature grid over a GeoJSON AOI, with async
  activity polling.
- Native analytics — threshold exceedance and persistence over the forecast window.
- Environmental parameters — heat index, relative humidity, wet-bulb temperature where available.

Coverage is U.S.-only. Requests are cached by full request shape; every reading carries a
`LIVE` / `CACHED` / `DEMO DATA` state naming the source and timestamp.

## HeatSafe Risk (Model v1.0)

Our own deterministic two-stage model built *using* FortyGuard data — FortyGuard does not compute
it.

1. Thermal severity = `0.5 × heat index + 0.3 × wet-bulb + 0.2 × air temperature`
   (weights renormalize when an input is unavailable).
2. Final risk = `0.8 × thermal severity + 0.2 × persistence`, banded LOW / MODERATE / HIGH /
   EXTREME with the drivers and input completeness shown alongside the score.

The AI Advisor only explains facts supplied to it; it never invents temperatures.

## Architecture

- TanStack Start (React 19, Vite 7), Tailwind v4, Leaflet + OpenStreetMap tiles.
- Server functions in `src/lib/*.functions.ts`; FortyGuard orchestration in
  `src/lib/fortyguard/*.server.ts` (client, activity polling, cache, typed errors).
- Risk engine `src/lib/risk.ts` with unit tests in `src/lib/risk.test.ts`.
- No database — live fetches with in-memory caching.

## Local development

```sh
npm i
npm run dev
```

Requires `FORTYGUARD_API_KEY` (and optionally `FORTYGUARD_BASE_URL`) in the server environment. The
key is never exposed to the browser. Without a key the app serves clearly-labelled demo data.

## Documentation

- `docs/brand.md` — frozen brand specification
- `docs/product.md` — product scope
- `docs/methodology.md` — model detail
- `docs/demo.md` — judging run-through

## Disclaimer

HeatSafe is an experimental decision-support product. HeatSafe Risk is not a medical diagnosis,
emergency warning, or engineering certification. Recommendations should not replace official
public-safety guidance or professional judgment.
