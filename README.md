# HeatSafe Guide

HeatSafe AI — Build Prompt (FortyGuard Hackathon'26)

Copy everything below the line into Claude Code, Cowork, or another AI coding assistant to build the project. Fill in the [bracketed] placeholders first (API key, exact endpoint, target city).

Context

I'm building HeatSafe AI for FortyGuard Hackathon'26 (build sprint runs through Aug 17, 2026 — I'm working under a tight deadline, so favor a working demo over a complete product). It's a solo/small-team hackathon project, so keep the stack simple, beginner-friendly, and fast to ship.

Problem: City-level temperature reports (a single number for a whole metro area) hide dangerous local variation — a shaded park path can be 9°F+ cooler than an adjacent asphalt lot with no tree cover, even at the same reported "city temperature." People walking, cycling, commuting, or working outdoors have no way to know which specific blocks or times are actually risky.

Solution: HeatSafe AI pulls hyperlocal temperature data from FortyGuard's Temperature API, layers AI-based risk interpretation on top of it, and outputs plain-language guidance: which micro-areas are dangerous right now/soon, and safer time windows or routes for a given activity.

Hackathon track fit: primarily Dashboards and Interactive Maps (combine both if time allows — FortyGuard allows combining tracks). Judging will reward: real use of the Temperature API (not just decoration), genuine AI reasoning (not a static lookup table), and a clear, demoable end-to-end flow — not scope.

Data source: FortyGuard Temperature API

Base pattern (confirm exact fields against my API key's docs — this may differ slightly per endpoint):

POST https://api.fortyguard.com/v1/heatmap
Headers: { "api-key": "[YOUR_API_KEY]", "Content-Type": "application/json" }
Body: {
  "polygon_aoi": { "type": "Polygon", "coordinates": [[[lng,lat], ...]] },
  "date_time": { "start_date": "YYYY-MM-DD", "start_time": "HH:MM", "filter_type": 1 },
  "granularity": 100
}


This returns an activity_id for an async job — poll/fetch the result afterward. There is also a point-based "Heat Intelligence Report" endpoint that takes coordinates directly (no polygon) and returns a report with ~5 contextual layers (surface type, shade, etc.) for a single location — use this for per-location detail views since it's simpler than polling a polygon job.

Measurement: ~2 meters above ground, hyperlocal resolution (city-block scale).

I have [insert: trial key / not yet — flag this]. If I don't have a working key yet, build the app against a small mocked JSON fixture shaped exactly like the real response, isolated behind a single getHeatmapData() function, so swapping in the real API later is a one-line change.

What to build (MVP scope — 4 days, beginner developer)

Cut ruthlessly to this for a working demo. Everything else is a stretch goal.

One target city/neighborhood, hardcoded — e.g. [insert: your city or a well-known hot city like Phoenix, AZ]. Don't build a location search UI.

A grid or hex overlay on a simple map (Leaflet.js + OpenStreetMap tiles is free, no API key, beginner-friendly) showing FortyGuard temperature data as colored tiles — cool (blue/teal) to dangerous (deep red).

A time slider (uses FortyGuard's forecast data, e.g. next 12 hours) so the map animates how heat risk shifts through the day — this is a strong demo moment, don't skip it.

An AI recommendation panel: given (a) the user's stated activity — walk / cycle / commute / outdoor work — and (b) the current heatmap + forecast, call an LLM (Claude via the Anthropic API) with the structured temperature data and get back:

A plain-language risk summary for right now

The safer time window today (e.g. "before 9am or after 6pm")

Which visible zones on the map to avoid and why (cite the actual temperature delta, not a vague warning)

A "why is this hot?" explainer on tap/click of a tile, using FortyGuard's contextual layers (surface type, shade, vegetation) if the point-report endpoint is available — this is what makes it feel like real intelligence instead of a paint-by-numbers heatmap.

Explicitly cut for time: user accounts, route-optimization pathfinding (approximate this with "avoid the red zones between X and Y" text instead of real routing), multi-city support, notifications/alerts, mobile app packaging.

Architecture

Frontend: single-page app. Plain HTML/CSS/JS with Leaflet.js is fastest for a beginner; React only if you're already comfortable with it.

Backend: a thin serverless function (or a small Node/Express or Python/Flask server) that (a) calls the FortyGuard API server-side so the API key never sits in client JS, and (b) calls the Anthropic API for the recommendation text. Keep it to 2–3 endpoints: /heatmap, /point-report, /recommend.

AI layer prompt shape: send the LLM structured JSON (grid of temps + coordinates + surface context + user's stated activity + time of day), and explicitly instruct it to return strict JSON (risk_level, summary, safer_window, zones_to_avoid) so the frontend can render it directly without parsing free text.

No database needed — everything is fetched live or cached in memory for the demo.

4-day plan

Day 1: Get one real FortyGuard API call working end-to-end (or the mocked fixture if key isn't ready) and render raw tiles on a Leaflet map. No AI yet. Goal: see real/realistic data on a real map.

Day 2: Add the time slider and forecast data. Add the point-detail click-through with contextual layers.

Day 3: Wire up the Anthropic API call for the recommendation panel; design the strict JSON prompt/response contract; render it in the UI.

Day 4: Polish the UI pass (visual design, empty/loading states), record the demo video, write the submission writeup (problem → data → AI reasoning → impact), buffer for API flakiness.

Deliverables to produce

Working deployed demo (or a very smooth localhost recording if deploy time runs out)

Short demo video per FortyGuard's submission requirements

Submission writeup: problem statement, how FortyGuard's Temperature API is used (be specific about which endpoints/fields), how AI adds reasoning beyond raw data, and one concrete real-world impact example (e.g. outdoor worker safety, elderly commuters)

Now build

Start with Day 1: scaffold the project, set up the Leaflet map centered on [insert city], and write the getHeatmapData() function against the FortyGuard /v1/heatmap endpoint (or the mock fixture, clearly labeled MOCK — replace with real API in a comment). Show me the map rendering before moving to the AI layer.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/48c63d9f-b211-4722-b191-5250a33adf51).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
