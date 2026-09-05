import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy | HeatSafe AI" },
      {
        name: "description",
        content:
          "How HeatSafe AI handles location input, API requests and analytics. No accounts, no tracking, no personal data storage.",
      },
      { property: "og:title", content: "Privacy — HeatSafe AI" },
      {
        property: "og:description",
        content: "No accounts, no tracking, no personal data storage in the HeatSafe AI prototype.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://micro-heat-alert.lovable.app/privacy" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://micro-heat-alert.lovable.app/privacy" }],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="text-3xl font-bold tracking-tight">Privacy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated 5 September 2026</p>

      <Section title="What we collect">
        HeatSafe AI has no accounts and no sign-in. We do not collect names, email addresses or
        payment details. The locations you select are used only to build the request sent to the
        temperature provider for that analysis.
      </Section>
      <Section title="What leaves your browser">
        A selected location (latitude and longitude of a public area, not your device location) is
        sent to our server, which calls the FortyGuard Temperature API using a key held server-side.
        Your browser never sees or holds that key.
      </Section>
      <Section title="Storage">
        Temperature responses are cached briefly in server memory so repeated requests stay fast and
        stay within provider limits. Nothing is written to a user-linked database.
      </Section>
      <Section title="Third parties">
        Map tiles are served by CARTO/OpenStreetMap, temperature data by FortyGuard, and AI guidance
        by the model provider behind the AI Advisor. Their own terms and privacy policies apply to
        those requests.
      </Section>
      <Section title="Contact">
        This is a hackathon prototype built for FortyGuard Hackathon '26. Questions about data
        handling can be raised through the project's submission channel.
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
