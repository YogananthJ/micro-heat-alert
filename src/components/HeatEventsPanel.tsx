import { useMemo, useState } from "react";
import type { HeatmapResponse } from "@/lib/heatmap";
import SourceBadge from "./SourceBadge";

const THRESHOLDS = [95, 100, 105];

/**
 * Heat Events — exceedance and persistence expressed as their own surface.
 * Exceedance = share of blocks above the threshold in each forecast hour.
 * Persistence = longest run of consecutive hours a block stays above it.
 */
export default function HeatEventsPanel({ data }: { data: HeatmapResponse }) {
  const [threshold, setThreshold] = useState(100);

  const events = useMemo(() => {
    const frames = data.frames;
    const perFrame = frames.map((f) => {
      const over = f.cells.filter((c) => c.temp_f >= threshold).length;
      return { label: f.label, over, total: f.cells.length, share: over / f.cells.length };
    });

    const runs = new Map<string, number>();
    const best = new Map<string, number>();
    frames.forEach((f) => {
      f.cells.forEach((c) => {
        const next = c.temp_f >= threshold ? (runs.get(c.id) ?? 0) + 1 : 0;
        runs.set(c.id, next);
        best.set(c.id, Math.max(best.get(c.id) ?? 0, next));
      });
    });
    const longest = Math.max(0, ...best.values());
    const persistentCells = [...best.values()].filter((v) => v >= 3).length;
    const peak = perFrame.reduce((a, b) => (b.share > a.share ? b : a), perFrame[0]!);
    const window = perFrame.filter((f) => f.over > 0);

    return { perFrame, longest, persistentCells, peak, window };
  }, [data, threshold]);

  const hasEvent = events.longest > 0;

  return (
    <section className="bg-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em]">Heat Events</h2>
        <span className="text-[11px] text-muted-foreground">Exceedance &amp; persistence</span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span id="hs-threshold-label" className="text-[11px] text-muted-foreground">
          Threshold
        </span>
        <div role="group" aria-labelledby="hs-threshold-label" className="flex gap-1">
          {THRESHOLDS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setThreshold(t)}
              aria-pressed={threshold === t}
              className={`rounded-md border px-2.5 py-1 text-xs tabular-nums transition-colors ${
                threshold === t
                  ? "border-caution/60 bg-secondary font-semibold text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}°F
            </button>
          ))}
        </div>
      </div>

      {hasEvent ? (
        <>
          <p className="mt-4 text-sm">
            <span className="font-semibold">
              {events.persistentCells} block{events.persistentCells === 1 ? "" : "s"}
            </span>{" "}
            stay above {threshold}°F for 3 hours or more. Longest continuous run:{" "}
            <span className="font-semibold tabular-nums">{events.longest}h</span>.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Peak exceedance at {events.peak.label} — {Math.round(events.peak.share * 100)}% of the
            grid. Event window {events.window[0]?.label} → {events.window.at(-1)?.label}.
          </p>

          <ul className="mt-4 space-y-1.5">
            {events.perFrame.map((f) => (
              <li key={f.label} className="flex items-center gap-3 text-xs">
                <span className="w-12 shrink-0 tabular-nums text-muted-foreground">{f.label}</span>
                <span className="h-1.5 flex-1 rounded-full bg-secondary">
                  <span
                    className="block h-1.5 rounded-full bg-caution"
                    style={{ width: `${Math.round(f.share * 100)}%` }}
                  />
                </span>
                <span className="w-16 shrink-0 text-right tabular-nums text-muted-foreground">
                  {f.over}/{f.total}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          No block in this area crosses {threshold}°F during the forecast window — no heat event
          detected.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <SourceBadge state={data.source === "fortyguard" ? "LIVE" : "DEMO"} />
        <span className="text-[11px] text-muted-foreground">
          Derived from the {data.granularity}m FortyGuard grid · HeatSafe Risk v1.0 event logic
        </span>
      </div>
    </section>
  );
}
