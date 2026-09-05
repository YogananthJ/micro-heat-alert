import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms | HeatSafe AI" },
      {
        name: "description",
        content:
          "Terms of use for the HeatSafe AI prototype: decision support only, not medical, emergency or engineering advice.",
      },
      { property: "og:title", content: "Terms — HeatSafe AI" },
      {
        property: "og:description",
        content: "HeatSafe AI is experimental decision support, not medical or emergency advice.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://micro-heat-alert.lovable.app/terms" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://micro-heat-alert.lovable.app/terms" }],
  }),
  component: Terms,
});

function Terms() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="text-3xl font-bold tracking-tight">Terms of use</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated 5 September 2026</p>

      <Section title="Prototype status">
        HeatSafe AI is an experimental prototype built for FortyGuard Hackathon '26. It is provided
        as-is, without warranty, and may be unavailable or inaccurate at any time.
      </Section>
      <Section title="Not advice">
        HeatSafe Risk is a decision-support model. It is not medical advice, emergency guidance, or
        engineering certification. In a heat emergency, contact local emergency services and follow
        official public-health direction.
      </Section>
      <Section title="Data accuracy">
        Temperature and environmental values come from the FortyGuard Temperature API and are
        subject to that provider's accuracy and coverage. Coverage is United States only. Route
        corridors and planner scenarios are modelled estimates, clearly labelled as such in the
        interface.
      </Section>
      <Section title="Acceptable use">
        Do not use HeatSafe AI as the sole basis for safety-critical decisions, and do not attempt to
        scrape, resell, or redistribute the underlying provider data.
      </Section>
      <Section title="Attribution">
        Temperature intelligence is powered by FortyGuard. Risk scoring, event detection, routing and
        planner logic are HeatSafe Risk v1.0.
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </section>
  );
}
