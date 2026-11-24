import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EventImage } from "@/components/events/event-image";
import { dateParts, formatPlace, formatTime } from "@/components/events/format";
import { TicketPanel } from "@/components/events/ticket-panel";
import { getEvent } from "@/lib/catalog";
import { getSection } from "@/lib/sections";

export const metadata: Metadata = { title: "Event · TicketLedger" };

export default function EventPage({ params }: PageProps<"/events/[id]">) {
  return (
    <main>
      <Suspense fallback={<p className="mx-auto max-w-384 px-5 py-20 text-lg text-zinc-600">Loading event…</p>}>
        {params.then(({ id }) => (
          <EventDetail id={id} />
        ))}
      </Suspense>
    </main>
  );
}

async function EventDetail({ id }: { id: string }) {
  const result = await getEvent(id);
  if (result.status === "not_found") notFound();
  if (result.status === "unavailable") {
    return (
      <div className="mx-auto max-w-384 px-5 py-20">
        <h1 className="text-2xl font-black">Couldn&apos;t load this event</h1>
        <p className="mt-2 text-zinc-600">The event source is busy or unreachable. Please try again in about a minute.</p>
        <Link href="/" className="mt-4 inline-block font-bold text-[#024bde] underline">
          Back to home
        </Link>
      </div>
    );
  }

  const { event } = result;
  const d = dateParts(event.localDate);
  const when = [d ? `${d.weekday}, ${d.month} ${d.day}, ${d.year}` : "Date TBA", formatTime(event.localTime, event.timeZone)].filter(Boolean).join(" · ");
  const where = [event.venue, formatPlace(event)].filter(Boolean).join(" · ");
  const off = event.status === "cancelled" || event.status === "postponed" ? event.status : null;
  const section = getSection(event.section);

  return (
    <>
      <section className="bg-[#121212] text-white">
        <div className="mx-auto flex max-w-384 flex-col gap-8 px-5 py-10 md:flex-row md:items-center">
          <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg md:w-96">
            <EventImage event={event} sizes="(max-width: 768px) 100vw, 384px" />
          </div>
          <div>
            <nav aria-label="Breadcrumb" className="text-sm text-white/60">
              <Link href={section.href} className="hover:text-white hover:underline">
                {section.label}
              </Link>{" "}
              / <span className="text-white">Event</span>
            </nav>
            <h1 className="mt-3 text-3xl font-black md:text-4xl">{event.name}</h1>
            <p className="mt-3 text-lg text-white/85">{when}</p>
            <p className="text-lg text-white/85">{where || "Venue TBA"}</p>
            {off && <span className="mt-3 inline-block rounded bg-red-600 px-2 py-1 text-sm font-bold uppercase">{off}</span>}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-384 gap-8 px-5 py-10 lg:grid-cols-[1fr_24rem]">
        <section className="text-base text-zinc-700">
          <h2 className="mb-3 text-xl font-black text-[#121212]">How this ticket works</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Your browser creates a wallet with its own private key.</li>
            <li>That key signs a transaction to buy the ticket for TIX.</li>
            <li>The contract checks the price, supply, limit per wallet and event date.</li>
            <li>Your browser mines a block (proof-of-work) that records the ticket.</li>
          </ol>
          <p className="mt-6 text-sm text-zinc-500">
            {event.url ? (
              <>
                Event data from{" "}
                <a href={event.url} target="_blank" rel="noreferrer" className="underline">
                  {event.provider === "thesportsdb" ? "TheSportsDB" : "MusicBrainz"}
                </a>
                , maintained by volunteers. The organizer is not involved in this demo.
              </>
            ) : (
              "This is a fictional sample event."
            )}
          </p>
        </section>
        <TicketPanel event={{ id: event.id, name: event.name, date: event.localDate, venue: event.venue }} notice={off && `This event was ${off}.`} />
      </div>
    </>
  );
}
