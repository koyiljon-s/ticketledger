import type { Metadata } from "next";
import Link from "next/link";
import { EventCard } from "@/components/events/event-card";
import { EventRow } from "@/components/events/event-row";
import { SampleDataBanner } from "@/components/events/sample-data-banner";
import { getConcerts, type ConcertResult } from "@/lib/concerts";

export const metadata: Metadata = {
  title: "Concerts · TicketLedger",
  description: "Upcoming concerts around the world, powered by MusicBrainz.",
};

export default async function ConcertsPage() {
  const result = await getConcerts(60);

  return (
    <main>
      <section className="bg-[#121212] text-white">
        <div className="mx-auto max-w-384 px-5 py-10">
          <nav aria-label="Breadcrumb" className="text-sm text-white/60">
            <Link href="/" className="hover:text-white hover:underline">
              Home
            </Link>{" "}
            / <span className="text-white">Concerts</span>
          </nav>
          <h1 className="mt-3 text-4xl font-black md:text-5xl">Concerts</h1>
          <p className="mt-2 max-w-2xl text-lg text-white/75">
            Live music around the world, from arena tours to club nights.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-384 space-y-12 px-5 py-10">
        {result.source === "sample" && <SampleDataBanner reason={result.sampleReason} />}
        {result.events.length === 0 ? (
          <p className="text-lg text-zinc-600">No upcoming concerts found.</p>
        ) : (
          <ConcertList result={result} />
        )}
      </div>
    </main>
  );
}

function ConcertList({ result }: { result: ConcertResult }) {
  const { events, totalElements: total, source } = result;
  // Featured: the first 4 distinct shows (tours repeat the same name), preferring ones with artwork.
  const seen = new Set<string>();
  const distinct = events.filter((e) => !seen.has(e.name) && seen.add(e.name));
  const featured = [...distinct.filter((e) => e.image), ...distinct.filter((e) => !e.image)].slice(0, 4);

  return (
    <>
      {featured.length > 0 && (
        <section>
          <h2 className="mb-5 text-2xl font-black text-[#121212]">Featured concerts</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-2xl font-black text-[#121212]">{source === "live" ? "Concerts this week" : "Upcoming concerts"}</h2>
          <span className="text-base text-zinc-600">
            Showing {events.length} of {total.toLocaleString("en-US")} events
          </span>
        </div>
        <ul className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-zinc-200">
          {events.map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
        </ul>
        {source === "live" && (
          <p className="mt-4 text-sm text-zinc-500">
            Event data from{" "}
            <a href="https://musicbrainz.org/" target="_blank" rel="noreferrer" className="underline">
              MusicBrainz
            </a>
            , maintained by volunteers, so details may be incomplete or out of date. Check with the venue before you go.
          </p>
        )}
      </section>
    </>
  );
}
