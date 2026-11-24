import Link from "next/link";
import { EventCard } from "@/components/events/event-card";
import { pickFeatured } from "@/components/events/featured";
import { SampleDataBanner } from "@/components/events/sample-data-banner";
import { DIFFICULTY } from "@/lib/chain/blockchain";
import { MAX_PER_WALLET, START_BALANCE, SUPPLY_PER_EVENT, TICKET_PRICE } from "@/lib/chain/contract";
import { getEvents } from "@/lib/catalog";
import { SECTIONS } from "@/lib/sections";

const PROBLEMS = [
  {
    problem: "Fake tickets",
    answer: "Every ticket is signed with its owner's private key. Changing a ticket breaks the signature, and the chain rejects it.",
  },
  {
    problem: "Bulk buying",
    answer: `The contract allows ${MAX_PER_WALLET} tickets per wallet and ${SUPPLY_PER_EVENT} per event. Nobody can skip the rules, although one person could create several wallets.`,
  },
  {
    problem: "Hidden history",
    answer: "Every purchase is recorded in a block linked to the one before it. Anyone with the chain can check all of it.",
  },
];

const STEPS = [
  { title: "Pick a concert", text: "Browse upcoming shows.", href: "/discover/concerts", link: "Browse concerts" },
  {
    title: "Get a demo ticket",
    text: `Your browser creates a wallet with ${START_BALANCE.toLocaleString("en-US")} TIX of play money. A ticket costs ${TICKET_PRICE}.`,
  },
  {
    title: "See it on the chain",
    text: `Your ticket is mined into a block whose hash starts with ${DIFFICULTY} zeros.`,
    href: "/my-tickets",
    link: "Open My Tickets",
  },
  { title: "Try to cheat", text: "Tamper with a block and watch the chain catch it.", href: "/explorer", link: "Open Block Explorer" },
];

export default async function Home() {
  const result = await getEvents("concerts");
  const featured = pickFeatured(result.events, 8);

  return (
    <main className="text-[#121212]">
      <section className="bg-[#121212] text-white">
        <div className="mx-auto max-w-384 px-5 py-16 md:py-24">
          <h1 className="max-w-4xl text-4xl font-black leading-tight md:text-6xl">Concert tickets you can verify</h1>
          <p className="mt-5 max-w-2xl text-lg text-white/75">
            A student demo of blockchain ticketing. Choose a concert, get a demo ticket, and check every step of how it was recorded.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/discover/concerts" className="rounded-md bg-[#024bde] px-6 py-3 font-bold text-white transition hover:bg-[#0139a8]">
              Find concerts
            </Link>
            <Link href="/explorer" className="rounded-md border border-white/40 px-6 py-3 font-bold text-white transition hover:bg-white/10">
              Explore the blockchain
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-384 space-y-16 px-5 py-12">
        {result.sampleReason && <SampleDataBanner reason={result.sampleReason} />}

        {featured.length > 0 && (
          <section>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
              <h2 className="text-2xl font-black">{result.source === "live" ? "Concerts this week" : "Upcoming concerts"}</h2>
              <Link href="/discover/concerts" className="font-bold text-[#024bde] hover:underline">
                See all concerts
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-5 text-2xl font-black">Browse by section</h2>
          <ul className="flex flex-wrap gap-3">
            {SECTIONS.map((s) => (
              <li key={s.slug}>
                <Link href={s.href} className="block rounded-md bg-white px-5 py-3 font-bold shadow-sm ring-1 ring-zinc-200 hover:text-[#024bde]">
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-5 text-2xl font-black">Try the demo</h2>
          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex flex-col rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-200">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#024bde] font-bold text-white">{i + 1}</span>
                <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
                <p className="mt-1 flex-1 text-zinc-600">{s.text}</p>
                {s.href && (
                  <Link href={s.href} className="mt-4 font-bold text-[#024bde] hover:underline">
                    {s.link}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="mb-5 text-2xl font-black">Why use a blockchain for tickets?</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {PROBLEMS.map((p) => (
              <div key={p.problem} className="border-l-4 border-[#024bde] pl-5">
                <h3 className="text-lg font-bold">{p.problem}</h3>
                <p className="mt-1 text-zinc-600">{p.answer}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-zinc-500">
            This demo runs on a single computer. A real blockchain is checked by many independent nodes, and a real ticket would need the organizer to
            accept it.
          </p>
        </section>
      </div>
    </main>
  );
}
