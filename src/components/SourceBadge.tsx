import type { Freshness } from "@/types/analysis";

const COPY: Record<Freshness, { label: string; tone: string }> = {
  LIVE: { label: "LIVE", tone: "border-accent/50 text-accent" },
  CACHED: { label: "CACHED", tone: "border-primary/50 text-primary" },
  DEMO: { label: "DEMO DATA", tone: "border-border text-muted-foreground" },
};

interface Props {
  state: Freshness;
  source?: string;
  updated?: string;
  ageMinutes?: number;
}

export default function SourceBadge({ state, source = "FortyGuard", updated, ageMinutes }: Props) {
  const { label, tone } = COPY[state];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border bg-card/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] backdrop-blur ${tone}`}
    >
      <span aria-hidden>●</span>
      <span>{label}</span>
      <span className="font-normal normal-case tracking-normal text-muted-foreground">
        {state === "DEMO" ? "Previously captured response" : source}
        {updated ? ` · Updated ${updated}` : ""}
        {state === "CACHED" && typeof ageMinutes === "number" ? ` · Cache age ${ageMinutes} min` : ""}
      </span>
    </span>
  );
}
