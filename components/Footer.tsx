import Link from "next/link";
import { BRAND, SECTIONS } from "./Navbar";

export function Footer() {
  return (
    <footer className="bg-[#121212] text-white/70">
      {/* Academic disclaimer banner */}
      <div className="bg-[#024bde] text-white">
        <div className="mx-auto flex max-w-384 flex-col gap-1 px-5 py-4 text-base md:flex-row md:items-center md:gap-3">
          <span className="w-fit rounded bg-white px-2 py-0.5 text-sm font-bold uppercase tracking-wide text-[#024bde]">Academic project</span>
          <p>
            This is a student case study for a blockchain course, <strong>not a real ticketing service</strong>. No real tickets are sold and no
            payments are processed.
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-384 gap-10 px-5 py-12 md:grid-cols-[1.5fr_1fr_1.5fr]">
        <div>
          <Link href="/" className="text-3xl font-bold text-white">
            {BRAND}
          </Link>
          <p className="mt-3 max-w-sm text-base">
            A demo of how blockchain technology could be used in the entertainment industry: verifiable tickets, fair resale and transparent
            ownership.
          </p>
        </div>

        <nav aria-label="Footer">
          <h2 className="mb-3 text-base font-bold uppercase tracking-wide text-white">Explore</h2>
          <ul className="space-y-2 text-base">
            {SECTIONS.map((s) => (
              <li key={s.href}>
                <Link href={s.href} className="transition hover:text-white">
                  {s.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/my-tickets" className="transition hover:text-white">
                My Tickets
              </Link>
            </li>
          </ul>
        </nav>

        <div className="text-base">
          <h2 className="mb-3 font-bold uppercase tracking-wide text-white">Data &amp; attribution</h2>
          <p>
            Event information is provided by the public Ticketmaster Discovery API and belongs to Ticketmaster and/or the event organizers. This
            project is not affiliated with, endorsed by or sponsored by Ticketmaster.
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-384 flex-col gap-2 px-5 py-5 text-sm md:flex-row md:justify-between">
          <span>
            © <CopyrightYear /> {BRAND}: academic project for educational purposes only.
          </span>
          <span>Not a real company. No real transactions.</span>
        </div>
      </div>
    </footer>
  );
}

/** Cached so the year is computed at build/revalidation time, not on every request. */
async function CopyrightYear() {
  "use cache";
  return new Date().getFullYear();
}
