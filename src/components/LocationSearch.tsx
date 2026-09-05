import { useMemo, useState } from "react";
import { DEMO_LOCATIONS } from "@/lib/geo";
import type { GeoLocation } from "@/types/analysis";

/**
 * Searchable U.S. location field. Coverage is United States only, so anything
 * outside the demo list is reported as "not yet available" rather than guessed.
 */
export default function LocationSearch({
  value,
  onSelect,
}: {
  value: GeoLocation;
  onSelect: (loc: GeoLocation) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DEMO_LOCATIONS;
    return DEMO_LOCATIONS.filter((l) =>
      `${l.name} ${l.region}`.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="relative">
      <label htmlFor="hs-location" className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        Location
      </label>
      <input
        id="hs-location"
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls="hs-location-list"
        autoComplete="off"
        placeholder={`${value.name}, ${value.region}`}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {open && (
        <ul
          id="hs-location-list"
          role="listbox"
          className="absolute z-[800] mt-1 w-full overflow-hidden rounded-md border border-border bg-card shadow-lg"
        >
          {matches.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                role="option"
                aria-selected={l.id === value.id}
                onMouseDown={() => {
                  onSelect(l);
                  setQuery("");
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-secondary ${
                  l.id === value.id ? "font-semibold" : ""
                }`}
              >
                <span>
                  {l.name}, {l.region}
                </span>
                <span className="tabular-nums text-[11px] text-muted-foreground">
                  {l.lat.toFixed(2)}, {l.lng.toFixed(2)}
                </span>
              </button>
            </li>
          ))}
          {matches.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              No covered location matches “{query}”. FortyGuard coverage is United States only.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
