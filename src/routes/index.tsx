import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useState } from "react";
import { getHeatmapData, heatColor, type HeatCell } from "@/lib/heatmap";
import RecommendationPanel from "@/components/RecommendationPanel";
import type { Activity, RecommendInput } from "@/lib/recommend-prompt";

const HeatLeafletMap = lazy(() => import("@/components/HeatLeafletMap"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HeatSafe AI — Hyperlocal Heat Risk for Phoenix" },
      {
        name: "description",
        content:
          "Block-level heat risk map for downtown Phoenix with a 12-hour forecast slider and plain-language safety guidance.",
      },
      { property: "og:title", content: "HeatSafe AI — Hyperlocal Heat Risk" },
      {
        property: "og:description",
        content: "See which blocks are dangerously hot right now, and when it's safe to go outside.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => getHeatmapData(6),
  component: Index,
});

function Index() {
  const data = Route.useLoaderData();
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<HeatCell | null>(null);

  const frame = data.frames[idx]!;
  const stats = useMemo(() => {
    const temps = frame.cells.map((c) => c.temp_f);
    const min = Math.min(...temps);
    const max = Math.max(...temps);
    const hottest = frame.cells.find((c) => c.temp_f === max)!;
    const coolest = frame.cells.find((c) => c.temp_f === min)!;
    return { min, max, hottest, coolest, delta: max - min };
  }, [frame]);

  const buildInput = (activity: Activity): RecommendInput => {
    const sorted = [...frame.cells].sort((a, b) => b.temp_f - a.temp_f);
    const slim = (c: HeatCell) => ({
      id: c.id,
      lat: Number(c.lat.toFixed(4)),
      lng: Number(c.lng.toFixed(4)),
      temp_f: c.temp_f,
      surface_type: c.surface_type,
      shade_index: c.shade_index,
      vegetation_index: c.vegetation_index,
    });
    return {
      activity,
      city: data.city,
      current_time_label: frame.label,
      forecast: data.frames.map((f) => {
        const t = f.cells.map((c) => c.temp_f);
        return {
          label: f.label,
          min_f: Math.min(...t),
          avg_f: Math.round((t.reduce((a, b) => a + b, 0) / t.length) * 10) / 10,
          max_f: Math.max(...t),
        };
      }),
      hottest_zones: sorted.slice(0, 6).map(slim),
      coolest_zones: sorted.slice(-6).map(slim),
    };
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 px-6 py-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl tracking-tight">
              HeatSafe<span className="text-primary"> AI</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Hyperlocal heat risk · {data.city} · ~2m above ground
            </p>
          </div>
          <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-primary">
            {data.source} data · FortyGuard shape
          </span>
        </div>
      </header>

      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-4">
          <div className="relative h-[520px] overflow-hidden rounded-xl border border-border/60 shadow-elev">
            <ClientOnly fallback={<div className="grid h-full place-items-center text-sm text-muted-foreground">Loading map…</div>}>
              <Suspense fallback={<div className="grid h-full place-items-center text-sm text-muted-foreground">Loading map…</div>}>
                <HeatLeafletMap frame={frame} onSelect={setSelected} selectedId={selected?.id} />
              </Suspense>
            </ClientOnly>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Forecast hour</span>
              <span className="font-display text-xl">{frame.label}</span>
            </div>
            <input
              type="range"
              min={0}
              max={data.frames.length - 1}
              value={idx}
              onChange={(e) => setIdx(Number(e.target.value))}
              className="mt-3 w-full accent-primary"
              aria-label="Forecast hour"
            />
            <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
              {data.frames.map((f) => (
                <span key={f.timestamp}>{f.label}</span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4 text-xs text-muted-foreground">
            <span>{stats.min.toFixed(1)}°F</span>
            <div
              className="h-2 flex-1 rounded-full"
              style={{
                background: `linear-gradient(90deg, ${[0, 0.25, 0.5, 0.75, 1]
                  .map((t) => heatColor(stats.min + t * (stats.max - stats.min), stats.min, stats.max))
                  .join(",")})`,
              }}
            />
            <span>{stats.max.toFixed(1)}°F</span>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Right now on the grid
            </h2>
            <p className="mt-3 font-display text-4xl text-heat">{stats.delta.toFixed(1)}°F</p>
            <p className="text-sm text-muted-foreground">
              spread between the hottest and coolest block at {frame.label}.
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Hottest surface</dt>
                <dd>{stats.hottest.surface_type}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Coolest surface</dt>
                <dd>{stats.coolest.surface_type}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Why is this hot?
            </h2>
            {selected ? (
              <div className="mt-3 space-y-3 text-sm">
                <p className="font-display text-3xl">{selected.temp_f.toFixed(1)}°F</p>
                <p className="text-muted-foreground">
                  Tile {selected.id} · {selected.lat.toFixed(4)}, {selected.lng.toFixed(4)}
                </p>
                <ContextRow label="Surface type" value={selected.surface_type} />
                <ContextRow label="Shade" value={`${Math.round(selected.shade_index * 100)}%`} />
                <ContextRow label="Vegetation" value={`${Math.round(selected.vegetation_index * 100)}%`} />
                <p className="text-muted-foreground">
                  {selected.temp_f - stats.min > 0
                    ? `${(selected.temp_f - stats.min).toFixed(1)}°F hotter than the coolest block on screen.`
                    : "This is the coolest block on screen."}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Tap any tile to see its surface, shade and vegetation context.
              </p>
            )}
          </div>

          <RecommendationPanel buildInput={buildInput} />
        </aside>
      </div>
    </main>
  );
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-t border-border/50 pt-2">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
