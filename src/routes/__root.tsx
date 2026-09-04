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

function SiteNav() {
  return (
    <header className="sticky top-0 z-[900] border-b border-border bg-background/85 backdrop-blur">
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6"
      >
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/favicon.png"
            alt=""
            width={24}
            height={24}
            className="h-6 w-6"
            aria-hidden="true"
          />
          <span className="text-base font-bold tracking-tight">HeatSafe AI</span>
          <span className="hidden text-[10px] uppercase tracking-[0.2em] text-muted-foreground lg:inline">
            Hyperlocal Heat Intelligence
          </span>
        </Link>
        <div className="flex flex-wrap items-center gap-1 text-sm">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:px-3"
              activeProps={{
                className: "rounded-md px-2.5 py-1.5 sm:px-3 text-foreground font-semibold",
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-10 text-sm">
        <div className="grid gap-8 sm:grid-cols-3">
          <div className="space-y-2">
            <p className="font-semibold">HeatSafe AI</p>
            <p className="text-muted-foreground">See the heat. Understand the risk. Act with confidence.</p>
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
              Data
            </p>
            <ul className="space-y-1 text-muted-foreground">
              <li>
                <Link to="/how-it-works" className="hover:text-foreground">
                  How HeatSafe works
                </Link>
              </li>
              <li>Powered by FortyGuard Temperature Intelligence</li>
              <li>HeatSafe Risk · Model v1.0</li>
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
