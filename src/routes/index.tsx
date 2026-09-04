import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HeatSafe AI — Hyperlocal Heat Intelligence" },
      {
        name: "description",
        content:
          "HeatSafe AI turns hyperlocal temperature intelligence into explainable heat risk insights for people, businesses, and cities.",
      },
      { property: "og:title", content: "HeatSafe AI — Hyperlocal Heat Intelligence" },
      {
        property: "og:description",
        content: "See the heat. Predict the risk. Make better decisions.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://micro-heat-alert.lovable.app/" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "https://micro-heat-alert.lovable.app/og-image.jpg" },
      { name: "twitter:image", content: "https://micro-heat-alert.lovable.app/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://micro-heat-alert.lovable.app/" }],
  }),
  component: Landing,
});

const STEPS = [
  { key: "SEE", body: "Identify where heat is concentrated." },
  { key: "PREDICT", body: "Understand when heat will peak and persist." },
  { key: "DECIDE", body: "Compare exposure and prioritize responses." },
  { key: "ACT", body: "Choose lower-heat routes and intervention priorities." },
];

const USE_CASES = [
  {
    title: "Individuals",
    body: "Pedestrians, cyclists and outdoor workers making short-horizon exposure decisions.",
  },
  {
    title: "Businesses",
    body: "Operators who need to understand heat exposure around specific sites and shifts.",
  },
  {
    title: "Cities",
    body: "Planners prioritizing heat-adaptation interventions with limited budget.",
  },
];

export default function Landing() {
  return (
    <main className="bg-background text-foreground">
      {/* Hero */}
      <section className="hs-scan border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <p className="hs-rise font-mono text-[11px] uppercase tracking-[0.24em] text-accent">
            Hyperlocal Heat Intelligence
          </p>
          <h1
            className="hs-rise mt-5 max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl"
            style={{ animationDelay: "80ms" }}
          >
            Know where heat becomes a problem.
          </h1>
          <p
            className="hs-rise mt-5 max-w-2xl text-base text-muted-foreground md:text-lg"
            style={{ animationDelay: "160ms" }}
          >
            HeatSafe AI transforms hyperlocal temperature intelligence into explainable insights for
            people, businesses, and cities.
          </p>
          <div className="hs-rise mt-8 flex flex-wrap gap-3" style={{ animationDelay: "240ms" }}>
            <Link
              to="/dashboard"
              className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Analyze Heat
            </Link>
            <Link
              to="/how-it-works"
              className="rounded-lg border border-border px-5 py-3 text-sm font-semibold transition-colors hover:bg-secondary"
            >
              Explore How It Works
            </Link>
          </div>
          <div className="mt-8 h-1.5 w-full max-w-md rounded-full thermal-bar" aria-hidden />
          <p className="mt-4 text-xs text-muted-foreground">
            Powered by FortyGuard Temperature Intelligence
          </p>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-px bg-border md:grid-cols-2">
          <div className="bg-background p-8">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              The problem
            </h2>
            <p className="mt-4 text-lg leading-relaxed">
              A single city-wide temperature hides significant variation across neighborhoods,
              streets and hours. A shaded path can be far cooler than the adjacent asphalt lot at the
              same reported "city temperature."
            </p>
          </div>
          <div className="bg-background p-8">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              The solution
            </h2>
            <p className="mt-4 text-lg leading-relaxed">
              HeatSafe normalizes FortyGuard hyperlocal temperature intelligence into a deterministic
              risk model, surfaces heat events over time, and turns the result into explainable
              decisions.
            </p>
          </div>
        </div>
      </section>

      {/* Four steps */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-bold tracking-tight">See. Predict. Decide. Act.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {STEPS.map((s, i) => (
              <article key={s.key} className="rounded-xl border border-border bg-card p-5">
                <p className="font-mono text-[11px] tabular-nums text-accent">0{i + 1}</p>
                <h3 className="mt-2 text-base font-semibold tracking-[0.08em]">{s.key}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-bold tracking-tight">Who it is for</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {USE_CASES.map((u) => (
              <article key={u.title} className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-lg font-semibold">{u.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{u.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & data */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-bold tracking-tight">Trust &amp; data</h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            <li className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                FortyGuard
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Source measurements: surface-level temperature and environmental parameters.
              </p>
            </li>
            <li className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                HeatSafe Risk
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Our own deterministic model (v1.0), built using FortyGuard data.
              </p>
            </li>
            <li className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                AI Advisor
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Plain-language explanation of supplied facts — it never invents values.
              </p>
            </li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Turn heat intelligence into action.</h2>
          <p className="mt-3 text-muted-foreground">
            See the heat. Predict the risk. Make better decisions.
          </p>
          <Link
            to="/dashboard"
            className="mt-8 inline-flex rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Analyze Heat
          </Link>
        </div>
      </section>
    </main>
  );
}
