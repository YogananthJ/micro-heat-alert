# HeatSafe AI — Brand Specification (frozen v1.0)

Single source of truth. Do not invent alternate names, taglines, or colors.

## Identity

- **Product:** HeatSafe AI
- **Descriptor:** Hyperlocal Heat Intelligence
- **Primary tagline:** Turn heat intelligence into action.
- **Supporting line:** See the heat. Predict the risk. Make better decisions.
- **Hero headline:** Know where heat becomes a problem.
- **Hero subline:** HeatSafe AI transforms hyperlocal temperature intelligence into explainable insights for people, businesses, and cities.
- **Footer quote:** See the heat. Understand the risk. Act with confidence.
- **Credibility line:** Powered by FortyGuard Temperature Intelligence
- **Build label:** Hackathon Prototype · 2026 · v0.1.0

## Four steps

SEE — Identify where heat is concentrated.
PREDICT — Understand when heat will peak and persist.
DECIDE — Compare exposure and prioritize responses.
ACT — Choose lower-heat routes and intervention priorities.

## Calls to action

- Primary: `Analyze Heat`
- Secondary: `Explore How It Works`
- Tertiary (text link): `View methodology →`

Button language names the result: `Compare Routes`, `Ask HeatSafe AI`, `Retry Analysis`.
Never: Submit, Run, Go, Click Here, Calculate.

## Feature naming

Only the AI Advisor is called AI.

| Use | Never |
| --- | --- |
| Heat Intelligence | AI Heat Map |
| HeatSafe Risk | AI Risk Score |
| Heat Events | AI Alerts |
| Heat-Aware Routes | AI Route |
| City Heat Planner | AI City Planner |
| AI Advisor | AI Everything |

## Logo

- Mark: geometric location pin containing a simplified sun/heat-wave glyph. Single accent color on navy, or mono black/white.
- Full lockup: `[MARK] HeatSafe AI` with `Hyperlocal Heat Intelligence` beneath.
- Compact: mark only — favicon, mobile header, app icon, map controls.
- Must read at 24px and 512px. No skylines, globes, gradients, multi-color, or small text inside the mark.

Assets: `favicon.ico`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `og-image.png` (1200×630).

## Color

Brand is restrained; the map carries the heat. The interface must not look like an emergency siren.

| Role | Token | Value |
| --- | --- | --- |
| Primary surface | `--background` / `--card` | deep navy `#08192E` / `#0C2340` |
| Accent (CTA, active) | `--primary` | warm orange `#FF6B35` |
| Secondary (data, forecast) | `--accent` | cool cyan `#2D8A9E` |
| Neutral text | `--foreground` / `--muted-foreground` | `#E8F1F8` / `#8FB0C9` |

Risk scale (data visualization only, always paired with text):

LOW green · MODERATE yellow · HIGH orange · EXTREME red

Never encode risk by color alone. Always print the label.

## Typography

One family: **Inter**. Weights: headings 600–700, body 400, labels 500, numeric readouts 600–700 (tabular figures).

## Personality

Professional · Scientific · Trustworthy · Modern · Climate-tech · Action-oriented.
Not gaming, crypto, social, or AI-toy.

## Attribution hierarchy

Three visually distinct levels everywhere data appears:

1. **FORTYGUARD** — source measurement (e.g. `38.2°C`)
2. **HEATSAFE RISK** — our model output (e.g. `82`, `Model v1.0`)
3. **AI ADVISOR** — generated explanation of supplied facts

Correct: "Powered by FortyGuard temperature intelligence." / "HeatSafe Risk is our own model built using FortyGuard data."
Incorrect: "FortyGuard calculates our HeatSafe Risk Score."

## Status states

- `● LIVE` — FortyGuard · Updated HH:MM
- `● CACHED` — FortyGuard · Updated HH:MM · Cache age N min
- `● DEMO DATA` — previously captured response, for demonstration

Always name the source next to the state.

## Page titles

- `HeatSafe AI — Hyperlocal Heat Intelligence`
- `Heat Dashboard | HeatSafe AI`
- `Heat-Aware Routes | HeatSafe AI`
- `City Heat Planner | HeatSafe AI`
- `How HeatSafe Works | HeatSafe AI`

## Disclaimer

**Important:** HeatSafe is an experimental decision-support product. HeatSafe Risk is not a medical diagnosis, emergency warning, or engineering certification. Recommendations should not replace official public-safety guidance or professional judgment.

Footer short form: *HeatSafe Risk is an experimental decision-support model and is not medical, emergency, or engineering advice.*

## Hygiene rules

No visible "Lovable", "localhost", "TODO", "test", "mock", or "debug" strings in the UI. Debug controls only behind `?debug=true`. Never surface `activity_id` in normal UX.
