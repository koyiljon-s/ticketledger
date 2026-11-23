"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useChain } from "../chain-provider";
import { byDate, Container, EventRow, EventTile, eventHref } from "../event-parts";
import { CATEGORY_EMOJI, EventArt, formatDate } from "../ui";

const CATEGORIES = ["Concert", "Sports", "Theatre", "Festival", "Film", "eSports"] as const;

const WHY = [
  { icon: "🛡️", title: "No counterfeits", text: "Every ticket is a unique token. The gate checks the blockchain, not a screenshot." },
  { icon: "⚖️", title: "Fair resale", text: "The contract caps resale prices, so scalpers can't charge 5× face value." },
  { icon: "🎶", title: "Artists get paid", text: "A royalty on every resale goes straight to the organizer." },
  { icon: "🔍", title: "Full transparency", text: "Anyone can audit every sale and transfer in the block explorer." },
];

export function Overview() {
  const { pendingState } = useChain();
  const events = Object.values(pendingState.events).sort(byDate);
  // Featured: prefer events with artwork, newest imports first.
  const featured = [...events].sort((a, b) => Number(Boolean(b.imageUrl)) - Number(Boolean(a.imageUrl))).slice(0, 4);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (featured.length < 2) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % featured.length), 6000);
    return () => clearInterval(t);
  }, [featured.length]);

  const hero = featured[slide % Math.max(featured.length, 1)];

  return (
    <>
      {hero && (
        <section className="relative h-[26rem] overflow-hidden bg-black text-white">
          <EventArt key={hero.id} ev={hero} priority sizes="100vw" className="absolute inset-0 opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
          <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-5 pb-12">
            <span className="mb-3 w-fit rounded bg-fuchsia-500 px-2 py-0.5 text-xs font-bold uppercase">Featured · {hero.category}</span>
            <h1 className="max-w-2xl text-4xl font-extrabold leading-tight md:text-5xl">{hero.name}</h1>
            <p className="mt-2 text-white/80">
              {formatDate(hero.date)} · {hero.venue}
            </p>
            <div className="mt-6 flex items-center gap-4">
              <Link href={eventHref(hero)} className="rounded-md bg-violet-600 px-6 py-3 font-semibold hover:bg-violet-500">
                Find tickets
              </Link>
              <div className="flex gap-2">
                {featured.map((f, i) => (
                  <button
                    key={f.id}
                    aria-label={`Show ${f.name}`}
                    onClick={() => setSlide(i)}
                    className={`h-2 rounded-full transition-all ${i === slide % featured.length ? "w-6 bg-white" : "w-2 bg-white/40"}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <Container className="space-y-12">
        <section>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Link
                key={c}
                href={`/events?category=${c}`}
                className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:border-violet-500 hover:text-violet-700"
              >
                {CATEGORY_EMOJI[c]} {c === "Concert" ? "Concerts" : c === "Theatre" ? "Arts & Theatre" : c}
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-2xl font-extrabold">Trending events</h2>
            <Link href="/events" className="text-sm font-semibold text-violet-700 hover:underline">
              See all events →
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {events.slice(0, 8).map((ev) => (
              <EventTile key={ev.id} ev={ev} />
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-gradient-to-r from-[#140a2c] to-violet-900 p-8 text-white">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold">Why tickets on a blockchain?</h2>
              <p className="mt-1 text-sm text-white/70">The rules are written into a smart contract that every node enforces, so no single company has to be trusted.</p>
            </div>
            <Link href="/how-it-works" className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100">
              How it works
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {WHY.map((w) => (
              <div key={w.title} className="rounded-xl bg-white/10 p-4">
                <div className="text-2xl">{w.icon}</div>
                <div className="mt-2 font-bold">{w.title}</div>
                <p className="mt-1 text-xs text-white/75">{w.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-extrabold">Upcoming events</h2>
          <div className="overflow-hidden rounded-xl shadow-sm ring-1 ring-zinc-200">
            {events.slice(0, 6).map((ev) => (
              <EventRow key={ev.id} ev={ev} />
            ))}
          </div>
        </section>
      </Container>
    </>
  );
}
