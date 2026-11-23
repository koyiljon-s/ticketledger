"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { EventCategory } from "@/lib/chain/types";
import { useChain } from "../chain-provider";
import { byDate, Container, EventRow } from "../event-parts";
import { Empty, Input } from "../ui";

const CATEGORIES: (EventCategory | "All")[] = ["All", "Concert", "Sports", "Theatre", "Festival", "Film", "eSports"];

export function EventsView() {
  const { pendingState } = useChain();
  const sp = useSearchParams();
  const router = useRouter();
  const q = sp.get("q") ?? "";
  const category = (sp.get("category") ?? "All") as EventCategory | "All";

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(sp.toString());
    if (value && value !== "All") next.set(key, value);
    else next.delete(key);
    router.replace(`/events${next.size ? `?${next}` : ""}`);
  };

  const needle = q.toLowerCase();
  const events = Object.values(pendingState.events)
    .filter((e) => category === "All" || e.category === category)
    .filter((e) => !needle || `${e.name} ${e.venue}`.toLowerCase().includes(needle))
    .sort(byDate);

  return (
    <>
      <div className="bg-[#1d1240] text-white">
        <Container className="py-8">
          <div className="text-xs text-white/60">
            <Link href="/" className="hover:underline">
              Home
            </Link>{" "}
            / Events
          </div>
          <h1 className="mt-2 text-3xl font-extrabold">{q ? `Results for “${q}”` : category === "All" ? "All events" : `${category} events`}</h1>
          <p className="mt-1 text-sm text-white/70">Every ticket is minted on-chain with a resale cap and an artist royalty.</p>
        </Container>
      </div>

      <Container>
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1 rounded-lg bg-white p-1 shadow-sm ring-1 ring-zinc-200">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setParam("category", c)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${category === c ? "bg-violet-600 text-white" : "text-zinc-700 hover:bg-zinc-100"}`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="ml-auto w-full max-w-xs">
            <Input defaultValue={q} placeholder="Filter by name or venue…" onChange={(e) => setParam("q", e.target.value)} />
          </div>
        </div>

        <div className="mb-3 text-sm text-zinc-600">
          {events.length} event{events.length === 1 ? "" : "s"}
        </div>
        {events.length === 0 ? (
          <Empty>
            No events match. Organizers can import real events from Ticketmaster on the{" "}
            <Link href="/organizer" className="font-semibold text-violet-700 underline">
              Organizer
            </Link>{" "}
            page.
          </Empty>
        ) : (
          <div className="overflow-hidden rounded-xl shadow-sm ring-1 ring-zinc-200">
            {events.map((ev) => (
              <EventRow key={ev.id} ev={ev} />
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
