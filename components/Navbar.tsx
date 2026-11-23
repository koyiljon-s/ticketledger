import Link from "next/link";
import { SearchBar } from "./ui/search-bar";

export const BRAND = "BC Tickets";

/**
 * The 5 main sections. `segment` / `classification` are the matching
 * Ticketmaster Discovery API filters, for use when the section pages are built.
 */
export const SECTIONS = [
  { label: "Concerts", href: "/discover/concerts", segment: "Music" },
  { label: "Sports", href: "/discover/sports", segment: "Sports" },
  { label: "Arts & Theater", href: "/discover/arts-theater", segment: "Arts & Theatre" },
  { label: "Family", href: "/discover/family", classification: "Family" },
  { label: "Film", href: "/discover/film", segment: "Film" },
] as const;

export function Navbar() {
  return (
    <header className="bg-[#024bde] text-white">
      {/* Top row: logo · sections · My Tickets */}
      <div className="mx-auto flex max-w-384 items-center justify-between gap-6 px-5 py-4">
        <h1 className="text-2xl  font-bold">
          <Link href="/">{BRAND}</Link>
        </h1>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-2">
            {SECTIONS.map((s) => (
              <li key={s.href}>
                <Link href={s.href} className="rounded-md px-3 py-2 text-md font-bold text-white/90 transition hover:bg-white/10 hover:text-white">
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Link
          href="/my-tickets"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-md font-bold transition hover:bg-white/10"
        >
          <TicketIcon />
          My Tickets
        </Link>
      </div>

      {/* Sections on small screens: horizontally scrollable */}
      <nav aria-label="Main mobile" className="border-t border-white/10 md:hidden">
        <ul className="flex gap-1 overflow-x-auto px-3 py-1">
          {SECTIONS.map((s) => (
            <li key={s.href}>
              <Link href={s.href} className="block whitespace-nowrap px-3 py-2 text-sm font-bold text-white/90">
                {s.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Search row */}
      <div className="mx-auto max-w-6xl px-5 pb-6 pt-2">
        <SearchBar />
      </div>
    </header>
  );
}



function TicketIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" aria-hidden>
      <path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z" />
      <path d="M14 6v12" strokeDasharray="2 2" />
    </svg>
  );
}
