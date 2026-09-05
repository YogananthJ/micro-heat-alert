import { useEffect, useState } from "react";

const DEFAULT_STEPS = [
  "Location identified",
  "Fetching FortyGuard temperature layer",
  "Reading environmental parameters",
  "Scoring with HeatSafe Risk v1.0",
];

/**
 * Branded step-by-step loading state. Steps advance on a timer purely as a
 * progress indication — they describe the pipeline, not confirmed API results.
 */
export default function AnalysisSteps({
  steps = DEFAULT_STEPS,
  intervalMs = 900,
}: {
  steps?: string[];
  intervalMs?: number;
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = window.setInterval(
      () => setActive((i) => Math.min(i + 1, steps.length - 1)),
      intervalMs,
    );
    return () => window.clearInterval(id);
  }, [steps.length, intervalMs]);

  return (
    <ul className="mt-4 space-y-2" aria-live="polite" aria-busy="true">
      {steps.map((label, i) => {
        const done = i < active;
        const current = i === active;
        return (
          <li
            key={label}
            className={`flex items-center gap-2 text-sm ${
              done || current ? "text-foreground" : "text-muted-foreground/70"
            }`}
          >
            <span
              aria-hidden="true"
              className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                done
                  ? "border-cool/60 text-cool"
                  : current
                    ? "animate-pulse border-caution/70 text-caution"
                    : "border-border text-transparent"
              }`}
            >
              {done ? "✓" : current ? "•" : ""}
            </span>
            <span>
              {label}
              {current ? "…" : ""}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
