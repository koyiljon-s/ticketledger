import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EventRow } from "@/components/events/event-row";
import { dateParts } from "@/components/events/format";
import { PhotoCredits } from "@/components/events/photo-credits";
import { parseQuery, searchEvents } from "@/lib/search";
import { SECTIONS } from "@/lib/sections";

export const metadata: Metadata = { title: "Search · TicketLedger" };

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <main className="text-[#121212]">
      <section className="bg-[#121212] text-white">
        <div className="mx-auto max-w-384 px-5 py-10">
          <h1 className="text-4xl font-black md:text-5xl">Search results</h1>
        </div>
      </section>
      <div className="mx-auto max-w-384 px-5 py-10">
        <Suspense fallback={<p className="text-lg text-zinc-600">Searching…</p>}>
          {searchParams.then((params) => (
            <Results params={params} />
          ))}
        </Suspense>
      </div>
    </main>
  );
}

async function Results({ params }: { params: Awaited<PageProps<"/search">["searchParams"]> }) {
  const q = parseQuery(params);
  const events = await searchEvents(q);
  const d = dateParts(q.startDate);
  const filters = [q.keyword && `“${q.keyword}”`, q.city && `in ${q.city}`, d && `from ${d.month} ${d.day}, ${d.year}`].filter(Boolean).join(" ");

  return (
    <>
      <p role="status" className="mb-5 text-lg text-zinc-700">
        {events.length} {events.length === 1 ? "event" : "events"} {filters || "in all sections"}
      </p>
      {events.length > 0 ? (
        <ul className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-zinc-200">
          {events.map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
        </ul>
      ) : (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center">
          <h2 className="text-xl font-black">No events found</h2>
          <p className="mt-2 text-zinc-600">Try fewer words, another place or an earlier date, or browse a section:</p>
          <ul className="mt-4 flex flex-wrap justify-center gap-4">
            {SECTIONS.map((s) => (
              <li key={s.slug}>
                <Link href={s.href} className="font-bold text-[#024bde] underline">
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <PhotoCredits events={events} />
      <p className="mt-4 text-sm text-zinc-500">Search covers the events currently listed in our five sections, not every event in the world.</p>
    </>
  );
}
