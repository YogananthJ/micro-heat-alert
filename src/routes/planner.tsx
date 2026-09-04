import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { getHeatmapData, type HeatCell } from "@/lib/heatmap";
import SourceBadge from "@/components/SourceBadge";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "City Heat Planner | HeatSafe AI" },
      {
        name: "description",
        content:
          "Rank city zones by heat severity, persistence and paved area, then test intervention budgets against modeled cooling.",
      },
      { property: "og:title", content: "City Heat Planner | HeatSafe AI" },
      {
        property: "og:description",
        content: "Evidence-gated zone priorities and illustrative budget scenarios for heat adaptation.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://micro-heat-alert.lovable.app/planner" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "https://micro-heat-alert.lovable.app/og-image.jpg" },
      { name: "twitter:image", content: "https://micro-heat-alert.lovable.app/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://micro-heat-alert.lovable.app/planner" }],
  }),
  loader: () => getHeatmapData(6),
  component: PlannerPage,
});

interface Zone {
  id: string;
  name: string;
  cells: HeatCell[];
  avgF: number;
  peakF: number;
  pavedShare: number;
  shadeShare: number;
  persistence: number;
  priority: number;
}

const INTERVENTIONS = [
  {
    id: "canopy",
    name: "Street tree canopy",
    unitCost: 420_000,
    coolingF: 4.2,
    rule: "Applies where paved share is above 60% and shade coverage is below 25%.",
  },
  {
    id: "coolroof",
    name: "Cool roof / high-albedo surfacing",
    unitCost: 260_000,
    coolingF: 2.6,
    rule: "Applies where paved share is above 55%.",
  },
  {
    id: "shade",
    name: "Shade structures at transit stops",
    unitCost: 95_000,
    coolingF: 1.4,
    rule: "Applies where peak temperature exceeds 104°F.",
  },
] as const;

function eligible(zone: Zone) {
  return INTERVENTIONS.filter((i) => {
    if (i.id === "canopy") return zone.pavedShare > 0.6 && zone.shadeShare < 0.25;
    if (i.id === "coolroof") return zone.pavedShare > 0.55;
    return zone.peakF > 104;
  });
}

const ZONE_NAMES = [
  "Northwest Quarter",
  "North Core",
  "Northeast Quarter",
  "West Corridor",
  "Central Business District",
  "East Corridor",
  "Southwest Quarter",
  "South Rail District",
  "Southeast Quarter",
];

function PlannerPage() {
  const data = Route.useLoaderData();
  const [budget, setBudget] = useState(1_500_000);

  const zones = useMemo<Zone[]>(() => {
    const frames = data.frames;
    const base = frames[0]!;
    const lats = base.cells.map((c) => c.lat);
    const lngs = base.cells.map((c) => c.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const band = (v: number, lo: number, hi: number) =>
      Math.min(2, Math.floor(((v - lo) / (hi - lo + 1e-9)) * 3));

    const buckets: HeatCell[][] = Array.from({ length: 9 }, () => []);
    for (const c of base.cells) {
      const row = 2 - band(c.lat, minLat, maxLat);
      const col = band(c.lng, minLng, maxLng);
      buckets[row * 3 + col]!.push(c);
    }

    return buckets
      .map((cells, i) => {
        if (cells.length === 0) return null;
        const ids = new Set(cells.map((c) => c.id));
        const temps = cells.map((c) => c.temp_f);
        const avgF = temps.reduce((a, b) => a + b, 0) / temps.length;
        const peakF = Math.max(...temps);
        const pavedShare =
          cells.filter((c) => c.surface_type === "asphalt" || c.surface_type === "concrete")
            .length / cells.length;
        const shadeShare = cells.reduce((a, c) => a + c.shade_index, 0) / cells.length;
        // Persistence: share of forecast hours the zone stays above 100°F.
        const hot = frames.filter((f) => {
          const zc = f.cells.filter((c) => ids.has(c.id));
          const m = zc.reduce((a, c) => a + c.temp_f, 0) / Math.max(1, zc.length);
          return m > 100;
        }).length;
        const persistence = hot / frames.length;
        const priority =
          0.45 * Math.min(100, ((avgF - 90) / 25) * 100) +
          0.3 * persistence * 100 +
          0.25 * pavedShare * 100;
        return {
          id: `zone-${i}`,
          name: ZONE_NAMES[i]!,
          cells,
          avgF,
          peakF,
          pavedShare,
          shadeShare,
          persistence,
          priority: Math.round(Math.max(0, Math.min(100, priority))),
        } satisfies Zone;
      })
      .filter((z): z is Zone => z !== null)
      .sort((a, b) => b.priority - a.priority);
  }, [data]);

  const plan = useMemo(() => {
    let remaining = budget;
    const items: { zone: string; intervention: string; cost: number; coolingF: number }[] = [];
    for (const z of zones) {
      for (const i of eligible(z)) {
        if (i.unitCost <= remaining) {
          remaining -= i.unitCost;
          items.push({ zone: z.name, intervention: i.name, cost: i.unitCost, coolingF: i.coolingF });
        }
      }
    }
    const spent = budget - remaining;
    const avgCooling = items.length
      ? items.reduce((a, i) => a + i.coolingF, 0) / new Set(items.map((i) => i.zone)).size
      : 0;
    return { items, spent, remaining, avgCooling };
  }, [zones, budget]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <header className="max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-accent">
          City Heat Planner
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
          Treat the blocks that matter first.
        </h1>
        <p className="mt-3 text-muted-foreground">
          Zones are ranked by thermal severity, persistence across the forecast window, and paved
          area. Interventions are gated by evidence rules, then fitted to a budget scenario.
        </p>
        <div className="mt-5">
          <SourceBadge
            state={data.source === "fortyguard" ? "LIVE" : "DEMO"}
            updated={data.frames[0]!.label}
          />
        </div>
      </header>

      <section className="mt-8 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Zone priorities
        </h2>
        {zones.slice(0, 5).map((z, i) => (
          <details
            key={z.id}
            className="rounded-xl border border-border bg-card p-5"
            open={i === 0}
          >
            <summary className="flex cursor-pointer flex-wrap items-baseline justify-between gap-3">
              <span className="text-lg font-semibold">
                Priority #{i + 1} · {z.name}
              </span>
              <span className="font-mono text-sm tabular-nums text-muted-foreground">
                Priority {z.priority} · avg {z.avgF.toFixed(1)}°F
              </span>
            </summary>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <Metric label="Peak temp" value={`${z.peakF.toFixed(1)}°F`} />
              <Metric label="Persistence" value={`${Math.round(z.persistence * 100)}%`} />
              <Metric label="Paved area" value={`${Math.round(z.pavedShare * 100)}%`} />
              <Metric label="Shade coverage" value={`${Math.round(z.shadeShare * 100)}%`} />
            </dl>
            <div className="mt-4 space-y-2 text-sm">
              <p className="font-medium">Eligible interventions</p>
              {eligible(z).length === 0 ? (
                <p className="text-muted-foreground">
                  No intervention rule is met — monitor this zone only.
                </p>
              ) : (
                <ul className="space-y-1 text-muted-foreground">
                  {eligible(z).map((i) => (
                    <li key={i.id}>
                      <span className="text-foreground">{i.name}</span> — {i.rule} Modeled cooling{" "}
                      −{i.coolingF.toFixed(1)}°F · ${(i.unitCost / 1000).toFixed(0)}k
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </details>
        ))}
      </section>

      <section className="mt-10 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Budget scenario
        </h2>
        <label className="mt-4 block text-sm">
          <span className="mb-1.5 block text-muted-foreground">
            Available budget · ${(budget / 1_000_000).toFixed(2)}M
          </span>
          <input
            type="range"
            min={250_000}
            max={6_000_000}
            step={250_000}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="w-full accent-[var(--primary)]"
            aria-label="Available budget"
          />
        </label>
        <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <Metric label="Allocated" value={`$${(plan.spent / 1_000_000).toFixed(2)}M`} />
          <Metric label="Unallocated" value={`$${(plan.remaining / 1_000_000).toFixed(2)}M`} />
          <Metric label="Zones treated" value={String(new Set(plan.items.map((i) => i.zone)).size)} />
          <Metric label="Modeled cooling" value={`−${plan.avgCooling.toFixed(1)}°F`} />
        </dl>
        {plan.items.length > 0 && (
          <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
            {plan.items.map((i, n) => (
              <li key={n} className="flex flex-wrap justify-between gap-2 border-t border-border pt-2">
                <span className="text-foreground">
                  {i.zone} — {i.intervention}
                </span>
                <span className="font-mono tabular-nums">${(i.cost / 1000).toFixed(0)}k</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-5 text-xs text-muted-foreground">
          Scenario estimate — illustrative unit costs and modeled cooling, not an engineering cost
          estimate. Temperatures: FortyGuard · prioritization: HeatSafe Risk v1.0.
        </p>
      </section>

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
