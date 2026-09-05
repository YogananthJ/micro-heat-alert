import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "HeatSafe AI — Hyperlocal Heat Intelligence" },
      { name: "description", content: "Hyperlocal heat intelligence turned into explainable risk insights." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "HeatSafe AI" },
      { property: "og:description", content: "Hyperlocal heat risk intelligence" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col">
        <SiteNav />
        <div className="grow">
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
        </div>
        <SiteFooter />
      </div>
    </QueryClientProvider>
  );
}

const NAV_LINKS = [
  { to: "/dashboard", label: "Heat Dashboard" },
  { to: "/routes", label: "Heat-Aware Routes" },
  { to: "/planner", label: "City Heat Planner" },
  { to: "/how-it-works", label: "How It Works" },
] as const;

const MODES = [
  { id: "citizen", label: "Citizen", to: "/dashboard" },
  { id: "planner", label: "Planner", to: "/planner" },
] as const;

function ModeToggle({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = pathname.startsWith("/planner") ? "planner" : "citizen";
  return (
    <div
      role="group"
      aria-label="Audience mode"
      className="flex items-center rounded-full border border-border p-0.5"
    >
      {MODES.map((m) => (
        <Link
          key={m.id}
          to={m.to}
          onClick={onNavigate}
          aria-current={active === m.id ? "true" : undefined}
          className={`rounded-full px-3 py-1 text-xs transition-colors ${
            active === m.id
              ? "bg-secondary font-semibold text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {m.label}
        </Link>
      ))}
    </div>
  );
}

function SiteNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-[900] border-b border-border bg-background/85 backdrop-blur">
      <nav
        aria-label="Primary"
        className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6 lg:flex lg:justify-between"
      >
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <img
            src="/favicon.png"
            alt=""
            width={24}
            height={24}
            className="h-6 w-6 shrink-0"
            aria-hidden="true"
          />
          <span className="truncate text-base font-bold tracking-tight">HeatSafe AI</span>
          <span className="hidden text-[10px] uppercase tracking-[0.2em] text-muted-foreground xl:inline">
            Hyperlocal Heat Intelligence
          </span>
        </Link>

        <div className="hidden items-center gap-1 text-sm lg:flex">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "rounded-md px-3 py-1.5 text-foreground font-semibold" }}
            >
              {item.label}
            </Link>
          ))}
          <span className="ml-2">
            <ModeToggle />
          </span>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="hs-mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border text-foreground lg:hidden"
        >
          <span aria-hidden="true" className="text-lg leading-none">
            {open ? "✕" : "☰"}
          </span>
        </button>
      </nav>

      {open && (
        <div id="hs-mobile-nav" className="border-t border-border bg-background lg:hidden">
          <ul className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
            {NAV_LINKS.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-2 py-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                  activeProps={{
                    className: "block rounded-md px-2 py-3 text-sm font-semibold text-foreground",
                  }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="px-2 py-3">
              <ModeToggle onNavigate={() => setOpen(false)} />
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-10 text-sm">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <p className="font-semibold">HeatSafe AI</p>
            <p className="text-muted-foreground">
              See the heat. Understand the risk. Act with confidence.
            </p>
            <p className="text-muted-foreground">
              <Link to="/about" className="hover:text-foreground">
                About &amp; contact
              </Link>
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Product
            </p>
            <ul className="space-y-1">
              {NAV_LINKS.slice(0, 3).map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="text-muted-foreground hover:text-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Resources
            </p>
            <ul className="space-y-1 text-muted-foreground">
              <li>
                <Link to="/how-it-works" className="hover:text-foreground">
                  Documentation &amp; methodology
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-foreground">
                  Privacy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-foreground">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Data
            </p>
            <ul className="space-y-1 text-muted-foreground">
              <li>Powered by FortyGuard Temperature Intelligence</li>
              <li>HeatSafe Risk · Model v1.0</li>
              <li>Map tiles © OpenStreetMap, © CARTO</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 space-y-2 border-t border-border pt-6">
          <p className="text-xs text-muted-foreground">
            HeatSafe Risk is an experimental decision-support model and is not medical, emergency, or
            engineering advice.
          </p>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Hackathon Prototype · 2026 · v0.1.0 · Built for FortyGuard Hackathon '26
          </p>
        </div>
      </div>
    </footer>
  );
}

