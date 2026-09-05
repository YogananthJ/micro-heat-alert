import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About the team | HeatSafe AI" },
      {
        name: "description",
        content:
          "Who builds HeatSafe AI, why hyperlocal heat intelligence matters, and how to get in touch about the FortyGuard Hackathon '26 submission.",
      },
      { property: "og:title", content: "About HeatSafe AI" },
      {
        property: "og:description",
        content: "The team and mission behind hyperlocal heat intelligence.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://micro-heat-alert.lovable.app/about" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "https://micro-heat-alert.lovable.app/og-image.jpg" },
      { name: "twitter:image", content: "https://micro-heat-alert.lovable.app/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://micro-heat-alert.lovable.app/about" }],
  }),
  component: About,
});

function About() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="text-3xl font-bold tracking-tight">About HeatSafe AI</h1>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">
        City-level forecasts hide the difference between a shaded park path and an asphalt parking
        lot two minutes away — a gap that can reach 15°F. HeatSafe AI reads hyperlocal temperature
        from FortyGuard, scores it with a transparent risk model, and turns it into a decision a
        person or a city can act on.
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Team</h2>
        <div className="mt-3 rounded-lg border border-border p-4">
          <p className="font-semibold">J. Yogananth</p>
          <p className="text-sm text-muted-foreground">
            Solo builder — product, data integration, risk model, interface.
          </p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Contact</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Reach us through the FortyGuard Hackathon '26 submission channel for questions, feedback or
          pilot interest. Data questions are answered on the{" "}
          <Link to="/how-it-works" className="underline underline-offset-4 hover:text-foreground">
            How It Works
          </Link>{" "}
          page.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Attribution</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Temperature intelligence powered by FortyGuard. Risk scoring, heat-event detection, routing
          and planner logic are HeatSafe Risk v1.0. Map tiles © OpenStreetMap contributors, © CARTO.
        </p>
      </section>
    </article>
  );
}
