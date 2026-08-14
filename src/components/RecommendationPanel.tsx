import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getRecommendation } from "@/lib/recommend.functions";
import type { Activity, Recommendation, RecommendInput } from "@/lib/recommend-prompt";

const ACTIVITIES: Activity[] = ["walk", "cycle", "commute", "outdoor work"];

const RISK: Record<Recommendation["risk_level"], { text: string; border: string; bg: string }> = {
  low: { text: "text-cool", border: "border-cool", bg: "bg-cool/10" },
  moderate: { text: "text-caution", border: "border-caution", bg: "bg-caution/10" },
  high: { text: "text-danger", border: "border-danger", bg: "bg-danger/10" },
  extreme: { text: "text-critical", border: "border-critical", bg: "bg-critical/10" },
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

  const risk = rec ? RISK[rec.risk_level] : null;

  return (
    <section
      className={`border-l-[3px] bg-card/70 p-5 transition-colors duration-500 ${
        risk ? risk.border : "border-muted-foreground/40"
      }`}
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        AI BRIEF <span className="hs-blink text-cool">⌁</span>
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {ACTIVITIES.map((a) => (
          <button
            key={a}
            onClick={() => setActivity(a)}
            className={`border px-3 py-1 font-mono text-[11px] uppercase tracking-wider transition-all duration-200 ${
              activity === a
                ? "border-caution bg-caution/15 text-caution"
                : "border-border text-muted-foreground hover:border-cool/60 hover:text-foreground"
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      <button
        onClick={run}
        disabled={loading}
        className="group mt-4 w-full overflow-hidden border border-caution/60 bg-caution/10 px-4 py-2.5 font-mono text-xs font-medium uppercase tracking-[0.18em] text-caution transition-all duration-300 hover:bg-caution hover:text-primary-foreground disabled:opacity-60"
      >
        {loading ? "Reading the grid…" : "Analyze my risk →"}
      </button>

      {loading && (
        <div className="mt-4 space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="hs-shimmer h-2.5 rounded-full opacity-25"
              style={{ width: `${100 - i * 18}%`, animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      )}

      {error && <p className="mt-3 font-mono text-xs text-critical">{error}</p>}

      {rec && !loading && risk && (
        <div className="mt-5 space-y-4 text-sm">
          <span
            className={`hs-rise inline-block border px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.18em] ${risk.border} ${risk.bg} ${risk.text} ${
              rec.risk_level === "extreme" ? "hs-glow" : ""
            }`}
          >
            {rec.risk_level} risk
          </span>
          <p className="hs-rise leading-relaxed text-foreground/90" style={{ animationDelay: "60ms" }}>
            {rec.summary}
          </p>
          <div
            className="hs-rise border border-border bg-surface-raised/60 p-3"
            style={{ animationDelay: "120ms" }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Safer window
            </p>
            <p className="mt-1 font-mono text-2xl font-bold tracking-tight text-cool">
              {rec.safer_window}
            </p>
          </div>
          {rec.zones_to_avoid?.length > 0 && (
            <div className="hs-rise" style={{ animationDelay: "180ms" }}>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Zones to avoid
              </p>
              <ul className="mt-2 space-y-2">
                {rec.zones_to_avoid.map((z, i) => (
                  <li
                    key={z.zone_id}
                    className="hs-rise border-l-2 border-critical bg-critical/5 p-2.5"
                    style={{ animationDelay: `${220 + i * 70}ms` }}
                  >
                    <span className="font-mono text-xs font-bold text-critical">
                      TILE {z.zone_id} · +{Number(z.delta_f).toFixed(1)}°F
                    </span>
                    <p className="mt-1 text-xs text-muted-foreground">{z.reason}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {rec.cooler_route_tip && (
            <p
              className="hs-rise border-l-2 border-cool/60 pl-3 text-xs text-muted-foreground"
              style={{ animationDelay: "300ms" }}
            >
              {rec.cooler_route_tip}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
