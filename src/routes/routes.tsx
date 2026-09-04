import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { getHeatmapData, type HeatCell, type HeatFrame } from "@/lib/heatmap";
import SourceBadge from "@/components/SourceBadge";

export const Route = createFileRoute("/routes")({
  head: () => ({
    meta: [
      { title: "Heat-Aware Routes | HeatSafe AI" },
      {
        name: "description",
        content:
          "Compare walking routes by cumulative heat exposure and choose the cooler path across the same city blocks.",
      },
      { property: "og:title", content: "Heat-Aware Routes | HeatSafe AI" },
      {
        property: "og:description",
        content: "Rank real walking options by cumulative heat exposure, not distance alone.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://micro-heat-alert.lovable.app/routes" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "https://micro-heat-alert.lovable.app/og-image.jpg" },
      { name: "twitter:image", content: "https://micro-heat-alert.lovable.app/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://micro-heat-alert.lovable.app/routes" }],
  }),
  loader: () => getHeatmapData(6),
  component: RoutesPage,
});

interface Waypoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

const WAYPOINTS: Waypoint[] = [
  { id: "conv", name: "Convention Center", lat: 33.4453, lng: -112.0714 },
  { id: "capitol", name: "State Capitol", lat: 33.4483, lng: -112.0968 },
  { id: "hance", name: "Hance Park", lat: 33.4602, lng: -112.0736 },
  { id: "chase", name: "Chase Field", lat: 33.4455, lng: -112.0667 },
  { id: "roosevelt", name: "Roosevelt Row", lat: 33.4581, lng: -112.0705 },
];

type Sample = { lat: number; lng: number };

/** Straight-line samples with a lateral offset, standing in for road geometry variants. */
function buildPath(a: Waypoint, b: Waypoint, bend: number, steps = 24): Sample[] {
  const out: Sample[] = [];
  const dx = b.lng - a.lng;
  const dy = b.lat - a.lat;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const arc = Math.sin(Math.PI * t) * bend;
    out.push({ lat: a.lat + dy * t - dx * arc, lng: a.lng + dx * t + dy * arc });
  }
  return out;
}

function nearestCell(cells: HeatCell[], p: Sample): HeatCell {
  let best = cells[0]!;
  let bestD = Infinity;
  for (const c of cells) {
    const d = (c.lat - p.lat) ** 2 + (c.lng - p.lng) ** 2;
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

function haversineKm(a: Sample, b: Sample) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

interface ScoredRoute {
  id: string;
  label: string;
  distanceKm: number;
  minutes: number;
  avgF: number;
  peakF: number;
  shadeShare: number;
  exposure: number;
  samples: Sample[];
}

function scoreRoute(
  id: string,
  label: string,
  samples: Sample[],
  frame: HeatFrame,
): ScoredRoute {
  let distanceKm = 0;
  for (let i = 1; i < samples.length; i++) distanceKm += haversineKm(samples[i - 1]!, samples[i]!);
  const cells = samples.map((s) => nearestCell(frame.cells, s));
  const temps = cells.map((c) => c.temp_f);
  const avgF = temps.reduce((a, b) => a + b, 0) / temps.length;
  const peakF = Math.max(...temps);
  const shadeShare =
    cells.reduce((a, c) => a + c.shade_index, 0) / cells.length;
  const minutes = (distanceKm / 4.8) * 60;
  // Exposure = degree-minutes above a 95°F comfort threshold.
  const exposure = temps.reduce((a, t) => a + Math.max(0, t - 95), 0) * (minutes / temps.length);
  return { id, label, distanceKm, minutes, avgF, peakF, shadeShare, exposure, samples };
}

function RoutesPage() {
  const data = Route.useLoaderData();
  const [fromId, setFromId] = useState("conv");
  const [toId, setToId] = useState("hance");
  const [hour, setHour] = useState(0);

  const frame = data.frames[hour]!;
  const from = WAYPOINTS.find((w) => w.id === fromId)!;
  const to = WAYPOINTS.find((w) => w.id === toId)!;

  const routes = useMemo(() => {
    if (fromId === toId) return [];
    const variants: [string, string, number][] = [
      ["direct", "Direct corridor", 0],
      ["west", "Shaded west detour", 0.16],
      ["east", "East side streets", -0.16],
    ];
    return variants
      .map(([id, label, bend]) => scoreRoute(id, label, buildPath(from, to, bend), frame))
      .sort((a, b) => a.exposure - b.exposure);
  }, [fromId, toId, frame, from, to]);

  const best = routes[0];

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <header className="max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-accent">
          Heat-Aware Routes
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
          Take the cooler way there.
        </h1>
        <p className="mt-3 text-muted-foreground">
          Every candidate path is sampled against the hyperlocal heat grid and ranked by cumulative
          exposure — degree-minutes above 95°F — not by distance alone.
        </p>
        <div className="mt-5">
          <SourceBadge
            state={data.source === "fortyguard" ? "LIVE" : "DEMO"}
            updated={frame.label}
          />
        </div>
      </header>

      <section className="mt-8 grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1.5 block font-medium text-muted-foreground">Start</span>
          <select
            value={fromId}
            onChange={(e) => setFromId(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2"
          >
            {WAYPOINTS.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1.5 block font-medium text-muted-foreground">Destination</span>
          <select
            value={toId}
            onChange={(e) => setToId(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2"
          >
            {WAYPOINTS.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1.5 block font-medium text-muted-foreground">
            Departure · {frame.label}
          </span>
          <input
            type="range"
            min={0}
            max={data.frames.length - 1}
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
            className="w-full accent-[var(--primary)]"
            aria-label="Departure hour"
          />
        </label>
      </section>

      {routes.length === 0 ? (
        <p className="mt-8 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Choose two different points to compare routes.
        </p>
      ) : (
        <>
          <ol className="mt-8 space-y-4">
            {routes.map((r, i) => (
              <li
                key={r.id}
                className={`rounded-xl border bg-card p-5 ${
                  i === 0 ? "border-primary/60" : "border-border"
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h2 className="text-lg font-semibold">
                    {i === 0 ? "Recommended · " : ""}
                    {r.label}
                  </h2>
                  <span className="font-mono text-sm text-muted-foreground">
                    {r.distanceKm.toFixed(2)} km · {Math.round(r.minutes)} min walk
                  </span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                  <Metric label="Exposure index" value={Math.round(r.exposure).toString()} />
                  <Metric label="Average temp" value={`${r.avgF.toFixed(1)}°F`} />
                  <Metric label="Peak temp" value={`${r.peakF.toFixed(1)}°F`} />
                  <Metric label="Shade coverage" value={`${Math.round(r.shadeShare * 100)}%`} />
                </dl>
                {best && r.id !== best.id ? (
                  <p className="mt-4 text-sm text-muted-foreground">
                    {Math.round(r.exposure - best.exposure)} more exposure points than the
                    recommended route.
                  </p>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Lowest cumulative exposure for a {frame.label} departure.
                  </p>
                )}
              </li>
            ))}
          </ol>
          <p className="mt-6 text-xs text-muted-foreground">
            Route geometry is a prototype corridor model over the FortyGuard grid, not turn-by-turn
            navigation. Temperatures: FortyGuard · exposure ranking: HeatSafe Risk v1.0.
          </p>
        </>
      )}

      <div className="mt-10">
        <Link to="/how-it-works" className="text-sm font-medium text-primary hover:underline">
          View methodology →
        </Link>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-mono text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
