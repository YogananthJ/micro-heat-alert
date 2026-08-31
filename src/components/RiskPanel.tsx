import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { analyzeRisk } from "@/lib/analysis.functions";
import { RISK_LEVEL_TOKEN } from "@/lib/risk";
import SourceBadge from "./SourceBadge";

interface Props {
  locationId: string;
  temperatureC: number;
  persistenceHours?: number;
}

/**
 * HeatSafe Risk — our own model output. FortyGuard supplies the measurements;
 * the score, level and drivers below are computed by HeatSafe Risk v1.0.
 */
export default function RiskPanel({ locationId, temperatureC, persistenceHours }: Props) {
  const run = useServerFn(analyzeRisk);
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["risk", locationId, Math.round(temperatureC), persistenceHours ?? null],
    queryFn: () =>
      run({
        data: {
          locationId,
          temperatureC,
          ...(typeof persistenceHours === "number" ? { persistenceHours } : {}),
        },
      }),
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  if (isPending) {
    return (
      <section className="bg-card p-5">
        <Header />
        <p className="mt-4 text-sm text-muted-foreground">Calculating heat risk…</p>
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="bg-card p-5">
        <Header />
        <p className="mt-3 text-sm text-muted-foreground">
          Heat risk is unavailable for this area right now.
        </p>
        <button
          onClick={() => void refetch()}
          className="mt-3 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary"
        >
          Retry Analysis
        </button>
      </section>
    );
  }

  const { risk } = data;

  return (
    <section className="bg-card p-5">
      <Header />
      <div className="mt-4 flex items-end gap-4">
        <p className={`text-5xl font-bold tabular-nums tracking-tight ${RISK_LEVEL_TOKEN[risk.level]}`}>
          {risk.score}
        </p>
        <div className="pb-1">
          <p className={`text-sm font-semibold ${RISK_LEVEL_TOKEN[risk.level]}`}>{risk.level}</p>
          <p className="text-[11px] text-muted-foreground">{risk.modelVersion}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-border">
        <Mini label="Thermal severity" value={`${risk.thermalSeverity}`} />
        <Mini label="Exposure severity" value={`${risk.exposureSeverity}`} />
      </div>

      <ul className="mt-4 space-y-2">
        {risk.drivers.map((d) => (
          <li key={d.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{d.label}</span>
            <span className="tabular-nums">{d.value}</span>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-[11px] text-muted-foreground">
        Data completeness: {risk.dataCompleteness}
        {risk.missingInputs.length ? ` · missing: ${risk.missingInputs.join(", ")}` : ""}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <SourceBadge state={data.freshness} updated={data.displayTime} />
      </div>

      <details className="mt-4 rounded-lg border border-border p-3">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Data &amp; Method
        </summary>
        <ul className="mt-3 space-y-2 text-[12px]">
          {data.provenance.map((p) => (
            <li key={p.layer} className="flex flex-col">
              <span className="font-medium">{p.layer}</span>
              <span className="text-muted-foreground">
                {p.source} · {p.detail} · {p.status}
              </span>
            </li>
          ))}
        </ul>
        {data.notes.length > 0 && (
          <ul className="mt-3 list-disc space-y-1 pl-4 text-[12px] text-muted-foreground">
            {data.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-[11px] text-muted-foreground">Analysis {data.analysisId}</p>
      </details>
    </section>
  );
}

function Header() {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-[0.16em]">HeatSafe Risk</h2>
      <span className="text-[11px] text-muted-foreground">Our model · FortyGuard data</span>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card p-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
