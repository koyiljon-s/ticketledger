import Link from "next/link";
import { getEvents, type EventList } from "@/lib/catalog";
import { getSection, type Section, type SectionSlug } from "@/lib/sections";
import { EventCard } from "./event-card";
import { EventRow } from "./event-row";
import { pickFeatured } from "./featured";
import { SampleDataBanner } from "./sample-data-banner";

const CREDITS: Partial<Record<SectionSlug, { name: string; href: string }>> = {
  concerts: { name: "MusicBrainz", href: "https://musicbrainz.org/" },
  sports: { name: "TheSportsDB", href: "https://www.thesportsdb.com/" },
};

/** The page body shared by all five /discover sections. */
export async function SectionPage({ slug }: { slug: SectionSlug }) {
  const section = getSection(slug);
  const result = await getEvents(slug);

  return (
    <main>
      <section className="bg-[#121212] text-white">
        <div className="mx-auto max-w-384 px-5 py-10">
          <nav aria-label="Breadcrumb" className="text-sm text-white/60">
            <Link href="/" className="hover:text-white hover:underline">
              Home
            </Link>{" "}
            / <span className="text-white">{section.label}</span>
          </nav>
          <h1 className="mt-3 text-4xl font-black md:text-5xl">{section.label}</h1>
          <p className="mt-2 max-w-2xl text-lg text-white/75">
            {section.tagline}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-384 space-y-12 px-5 py-10">
        {result.sampleReason && <SampleDataBanner reason={result.sampleReason} />}
        {result.events.length === 0 ? (
          <p className="text-lg text-zinc-600">No upcoming {section.noun} found.</p>
        ) : (
          <Events section={section} result={result} />
        )}
      </div>
    </main>
  );
}

function Events({ section, result }: { section: Section; result: EventList }) {
  const { events, totalElements: total, source } = result;
  const credit = CREDITS[section.slug];
  const featured = pickFeatured(events, 4);

  return (
    <>
      {featured.length > 0 && (
        <section>
          <h2 className="mb-5 text-2xl font-black text-[#121212]">Featured {section.noun}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-2xl font-black text-[#121212]">Upcoming {section.noun}</h2>
          <span className="text-base text-zinc-600">
            Showing {events.length} of {total.toLocaleString("en-US")} events
          </span>
        </div>
        <ul className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-zinc-200">
          {events.map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
        </ul>
        {source === "live" && credit && (
          <p className="mt-4 text-sm text-zinc-500">
            Event data from{" "}
            <a href={credit.href} target="_blank" rel="noreferrer" className="underline">
              {credit.name}
            </a>
            . Details may be incomplete or out of date.
          </p>
        )}
      </section>
    </>
  );
}
