import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How HeatSafe Works | HeatSafe AI" },
      {
        name: "description",
        content:
          "Methodology, data provenance and limitations behind HeatSafe Risk v1.0 and the FortyGuard temperature intelligence it is built on.",
      },
      { property: "og:title", content: "How HeatSafe Works | HeatSafe AI" },
      {
        property: "og:description",
        content: "The HeatSafe Risk v1.0 model, its inputs, provenance and limitations.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://micro-heat-alert.lovable.app/how-it-works" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "https://micro-heat-alert.lovable.app/og-image.jpg" },
      { name: "twitter:image", content: "https://micro-heat-alert.lovable.app/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://micro-heat-alert.lovable.app/how-it-works" }],
  }),
  component: HowItWorks,
});

function HowItWorks() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">How HeatSafe works</h1>
      <p className="mt-3 text-muted-foreground">
        HeatSafe Risk is our own model built using FortyGuard data. FortyGuard supplies the
        measurements; every derived number below is computed by HeatSafe.
      </p>

      <Section title="1. Data acquisition">
        <p>
          Heat grids come from the FortyGuard heatmap workflow: an area of interest is submitted as a
          GeoJSON polygon, the resulting activity is polled until it completes, and the returned
          GeoJSON is normalized into a Celsius grid. Environmental parameters — heat index, relative
          humidity and wet-bulb temperature — are requested for the same point and hour.
        </p>
        <p>
          Requests are cached by their full request shape. When live data is unavailable we fall back
          to the most recent real response (<strong>CACHED</strong>) or a previously captured response
          (<strong>DEMO DATA</strong>). The state is always shown next to the source and timestamp.
        </p>
      </Section>

      <Section title="2. HeatSafe Risk v1.0">
        <p>
          The model is deterministic and has two stages. <em>Thermal severity</em> combines normalized
          heat index (50%), wet-bulb temperature (30%) and surface-level temperature (20%). When an
          environmental input is missing, its weight is redistributed across the available inputs and
          the result is reported with a lower data-completeness rating.
        </p>
        <p>
          <em>Exposure severity</em> normalizes how many consecutive hours the location stays above
          the exceedance threshold. The final 0–100 score is <strong>80% thermal severity and 20%
          exposure severity</strong>, mapped to LOW, MODERATE, HIGH and EXTREME bands. Levels are
          always printed as text, never encoded by color alone.
        </p>
      </Section>

      <Section title="3. Heat events">
        <p>
          Exceedance and persistence come from FortyGuard's native analytics over the forecast window
          rather than being reconstructed from projected frames, so event timing reflects the source
          data directly.
        </p>
      </Section>

      <Section title="4. AI Advisor">
        <p>
          The advisor receives only compact, already-computed facts and returns a schema-validated
          explanation. It cannot compute risk, alter source values, or invent measurements. If the
          response fails validation, a deterministic fallback explanation is shown instead.
        </p>
      </Section>

      <Section title="5. Limitations">
        <ul className="list-disc space-y-2 pl-5">
          <li>FortyGuard API coverage is U.S.-only.</li>
          <li>HeatSafe Risk is a prototype model, not a validated clinical or engineering index.</li>
          <li>Routing depends on external public road-network data.</li>
          <li>Budget scenarios are illustrative, not engineering cost estimates.</li>
          <li>AI output is decision support and cannot alter or invent source values.</li>
        </ul>
      </Section>

      <p className="mt-12 rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
        <strong className="text-foreground">Important:</strong> HeatSafe is an experimental
        decision-support product. HeatSafe Risk is not a medical diagnosis, emergency warning, or
        engineering certification. Recommendations should not replace official public-safety guidance
        or professional judgment.
      </p>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}
