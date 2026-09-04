import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useMemo, useState } from "react";
import { getHeatmapData, heatColor, type HeatCell } from "@/lib/heatmap";
import { fetchHeatmap } from "@/lib/heatmap.functions";
import RecommendationPanel from "@/components/RecommendationPanel";
import RiskPanel from "@/components/RiskPanel";
import type { Activity, RecommendInput } from "@/lib/recommend-prompt";

const HeatLeafletMap = lazy(() => import("@/components/HeatLeafletMap"));

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Heat Dashboard | HeatSafe AI" },
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
      { property: "og:url", content: "https://micro-heat-alert.lovable.app/dashboard" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "https://micro-heat-alert.lovable.app/og-image.jpg" },
      { name: "twitter:image", content: "https://micro-heat-alert.lovable.app/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://micro-heat-alert.lovable.app/dashboard" }],
  }),
  // Instant mock render; the live FortyGuard feed is fetched client-side
  // because its polling flow can exceed the loader request budget.
  loader: () => getHeatmapData(6),
  component: Index,
});

function Index() {
  const initial = Route.useLoaderData();
  const loadLive = useServerFn(fetchHeatmap);
  const { data: live, isPending: liveLoading } = useQuery({
    queryKey: ["heatmap", 6],
    queryFn: () => loadLive({ data: { startHour: 6 } }),
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
  const data = live ?? initial;
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<HeatCell | null>(null);

  const frame = data.frames[idx]!;
  const stats = useMemo(() => {
    const temps = frame.cells.map((c) => c.temp_f);
    const min = Math.min(...temps);
    const max = Math.max(...temps);
    const hottest = frame.cells.find((c) => c.temp_f === max)!;
    const coolest = frame.cells.find((c) => c.temp_f === min)!;
    const avg = temps.reduce((a, b) => a + b, 0) / temps.length;
    return { min, max, avg, hottest, coolest, delta: max - min };
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
    <main className="min-h-screen bg-background text-foreground lg:grid lg:h-[calc(100vh-3.5rem)] lg:grid-cols-[1fr_minmax(360px,34vw)] lg:overflow-hidden">
      {/* ── LEFT: sticky full-height map ─────────────────────── */}
      <section className="hs-scan relative h-[62vh] border-b border-border lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:border-b-0 lg:border-r">
        <ClientOnly
          fallback={
            <div className="grid h-full place-items-center font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Initializing grid…
            </div>
          }
        >
          <Suspense
            fallback={
              <div className="grid h-full place-items-center font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
                Initializing grid…
              </div>
            }
          >
            <HeatLeafletMap frame={frame} onSelect={setSelected} selectedId={selected?.id} />
          </Suspense>
        </ClientOnly>

        {/* floating header over the map */}
        <div className="pointer-events-none absolute left-0 top-0 z-[500] flex w-full items-start justify-between gap-3 p-5">
          <div className="hs-rise">
            <h1 className="font-display text-2xl font-bold tracking-tight">
              HEATSAFE<span className="text-caution">.AI</span>
            </h1>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {data.city} · 2M AGL
            </p>
          </div>
          <span
            className={`hs-rise border bg-background/80 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em] backdrop-blur ${
              data.source === "fortyguard"
                ? "border-cool/40 text-cool"
                : liveLoading
                  ? "border-border text-muted-foreground"
                  : "border-caution/40 text-caution"
            }`}
            style={{ animationDelay: "120ms" }}
            title={live?.error ?? undefined}
          >
            <span className="hs-blink">●</span>{" "}
            {data.source === "fortyguard"
              ? "FortyGuard live"
              : liveLoading
                ? "syncing live feed…"
                : "mock fallback"}
          </span>
        </div>

        {/* thermal legend bar, floating bottom */}
        <div className="pointer-events-none absolute bottom-0 left-0 z-[500] w-full p-5">
          <div className="hs-rise border border-border bg-background/85 p-3 backdrop-blur" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
              <span>{stats.min.toFixed(1)}°F</span>
              <div
                className="h-1.5 flex-1"
                style={{
                  background: `linear-gradient(90deg, ${[0, 0.25, 0.5, 0.75, 1]
                    .map((t) => heatColor(stats.min + t * (stats.max - stats.min), stats.min, stats.max))
                    .join(",")})`,
                }}
              />
              <span className="text-critical">{stats.max.toFixed(1)}°F</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── RIGHT: scrolling insight column ──────────────────── */}
      <aside className="flex flex-col gap-px bg-border lg:h-[calc(100vh-3.5rem)] lg:overflow-y-auto">
        {/* stat readouts */}
        <div className="grid grid-cols-3 gap-px bg-border">
          <Stat label="Spread" value={`${stats.delta.toFixed(1)}°`} tone="text-critical" />
          <Stat label="Peak" value={`${stats.max.toFixed(1)}°`} tone="text-danger" />
          <Stat label="Mean" value={`${stats.avg.toFixed(1)}°`} tone="text-caution" />
        </div>

        {/* forecast scrubber */}
        <div className="bg-background p-5">
          <div className="flex items-baseline justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Forecast hour
            </p>
            <p className="font-mono text-2xl font-bold tracking-tight text-foreground">{frame.label}</p>
          </div>
          <input
            type="range"
            min={0}
            max={data.frames.length - 1}
            value={idx}
            onChange={(e) => setIdx(Number(e.target.value))}
            className="mt-3 w-full accent-caution"
            aria-label="Forecast hour"
          />
          <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
            {data.frames.map((f, i) => (
              <span key={f.timestamp} className={i === idx ? "text-caution" : ""}>
                {f.label}
              </span>
            ))}
          </div>
        </div>

        {/* tile inspector */}
        <div className="bg-background p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Tile inspector
          </p>
          {selected ? (
            <div className="mt-3 space-y-3">
              <p className="font-mono text-4xl font-bold tracking-tight text-danger">
                {selected.temp_f.toFixed(1)}°F
              </p>
              <p className="font-mono text-[11px] text-muted-foreground">
                {selected.id} · {selected.lat.toFixed(4)}, {selected.lng.toFixed(4)}
              </p>
              <ContextRow label="Surface" value={selected.surface_type} />
              <ContextRow label="Shade" value={`${Math.round(selected.shade_index * 100)}%`} />
              <ContextRow label="Vegetation" value={`${Math.round(selected.vegetation_index * 100)}%`} />
              <p className="border-l-2 border-caution/60 pl-3 text-xs text-muted-foreground">
                {selected.temp_f - stats.min > 0
                  ? `${(selected.temp_f - stats.min).toFixed(1)}°F hotter than the coolest block on screen.`
                  : "Coolest block on screen."}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Tap any tile on the grid to read its surface, shade and vegetation context.
            </p>
          )}
        </div>

        {/* surface extremes */}
        <div className="grid grid-cols-2 gap-px bg-border">
          <Stat label="Hottest surface" value={stats.hottest.surface_type} tone="text-danger" small />
          <Stat label="Coolest surface" value={stats.coolest.surface_type} tone="text-cool" small />
        </div>

        <div className="bg-background">
          <RiskPanel
            locationId="phoenix"
            temperatureC={Math.round((((stats.max - 32) * 5) / 9) * 10) / 10}
            persistenceHours={data.frames.length}
          />
        </div>

        <div className="bg-background">
          <RecommendationPanel buildInput={buildInput} />
        </div>

        <div className="grow bg-background p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            HeatSafe AI · FortyGuard Hackathon '26
          </p>
        </div>
      </aside>
    </main>
  );
}

function Stat({
  label,
  value,
  tone,
  small,
}: {
  label: string;
  value: string;
  tone: string;
  small?: boolean;
}) {
  return (
    <div className="bg-background p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p
        className={`mt-1 font-mono font-bold tracking-tight ${tone} ${
          small ? "text-sm capitalize" : "text-2xl"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-t border-border pt-2 text-sm">
      <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="capitalize">{value}</span>
    </div>
  );
}
