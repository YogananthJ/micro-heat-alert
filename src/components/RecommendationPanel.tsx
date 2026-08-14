import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getRecommendation } from "@/lib/recommend.functions";
import type { Activity, Recommendation, RecommendInput } from "@/lib/recommend-prompt";

const ACTIVITIES: Activity[] = ["walk", "cycle", "commute", "outdoor work"];

const RISK_STYLE: Record<Recommendation["risk_level"], string> = {
  low: "border-cool/50 bg-cool/10 text-cool",
  moderate: "border-primary/50 bg-primary/10 text-primary",
  high: "border-heat/60 bg-heat/10 text-heat",
  extreme: "border-destructive/60 bg-destructive/15 text-destructive",
};

export default function RecommendationPanel({
  buildInput,
}: {
  buildInput: (activity: Activity) => RecommendInput;
}) {
  const call = useServerFn(getRecommendation);
  const [activity, setActivity] = useState<Activity>("walk");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rec, setRec] = useState<Recommendation | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      setRec(await call({ data: buildInput(activity) }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        AI heat guidance
      </h2>

      <div className="mt-3 flex flex-wrap gap-2">
        {ACTIVITIES.map((a) => (
          <button
            key={a}
            onClick={() => setActivity(a)}
            className={`rounded-full border px-3 py-1 text-xs capitalize transition-colors ${
              activity === a
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary/60"
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      <button
        onClick={run}
        disabled={loading}
        className="mt-3 w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Reading the grid…" : "Analyze my risk"}
      </button>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      {rec && !loading && (
        <div className="mt-4 space-y-3 text-sm">
          <span
            className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-widest ${RISK_STYLE[rec.risk_level]}`}
          >
            {rec.risk_level} risk
          </span>
          <p>{rec.summary}</p>
          <div className="rounded-lg border border-border/60 p-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Safer window</p>
            <p className="mt-1 font-display text-xl">{rec.safer_window}</p>
          </div>
          {rec.zones_to_avoid?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Zones to avoid
              </p>
              <ul className="mt-2 space-y-2">
                {rec.zones_to_avoid.map((z) => (
                  <li key={z.zone_id} className="rounded-lg border border-heat/40 bg-heat/5 p-2">
                    <span className="font-semibold text-heat">
                      Tile {z.zone_id} · +{Number(z.delta_f).toFixed(1)}°F
                    </span>
                    <p className="text-muted-foreground">{z.reason}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {rec.cooler_route_tip && (
            <p className="text-muted-foreground">{rec.cooler_route_tip}</p>
          )}
        </div>
      )}
    </div>
  );
}
