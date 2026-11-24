"use client";

import Link from "next/link";
import { useState } from "react";
import { EventImage } from "@/components/events/event-image";
import { HealthIcon, Icon } from "./icons";
import { PanelHeader } from "./panel";
import { artOf, healthOf, titleOf, type ChainView } from "./types";

const FILTERS = ["All", "Tickets", "Problems"] as const;

/** Panel view 1: searchable list of blocks, newest first. */
export function BlockList({ view, onSelect }: { view: ChainView; onSelect: (index: number) => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const needle = query.trim().toLowerCase();

  const rows = view.chain
    .map((block, index) => ({ block, index }))
    .filter(({ block, index }) => {
      if (filter === "Tickets" && block.txs.length === 0) return false;
      if (filter === "Problems" && healthOf(view, index) !== "bad") return false;
      const text = [`block ${index}`, `#${index}`, titleOf(block), block.hash, block.txs[0]?.body.event.venue, block.txs[0]?.hash];
      return !needle || text.some((t) => t?.toLowerCase().includes(needle));
    })
    .reverse();

  return (
    <>
      <PanelHeader title="Blocks" note="Newest first" />
      <div className="border-b border-zinc-200 px-5 pb-4">
        <label className="flex items-center gap-3 rounded border border-zinc-400 px-3 focus-within:border-[#024bde] focus-within:ring-1 focus-within:ring-[#024bde]">
          <Icon name="search" className="h-5 w-5 shrink-0 text-zinc-500" />
          <span className="sr-only">Search blocks</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Event, venue or hash"
            className="min-w-0 flex-1 bg-transparent py-2.5 outline-none"
          />
        </label>
        <div role="group" aria-label="Filter blocks" className="mt-3 flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-4 py-1.5 text-sm font-bold transition ${
                filter === f ? "border-[#121212] bg-[#121212] text-white" : "border-zinc-400 hover:border-[#121212]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {rows.length === 0 && <p className="px-5 py-10 text-center text-zinc-600">{filter === "Problems" && !needle ? "No problems found." : "No blocks match."}</p>}
        <ul>
          {rows.map(({ block, index }) => {
            const art = artOf(block, view.photos);
            return (
              <li key={index} className="border-b border-zinc-200">
                <button
                  type="button"
                  onClick={() => onSelect(index)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-[#f2f6ff] focus-visible:bg-[#f2f6ff] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#024bde]"
                >
                  <span className="relative grid h-14 w-20 shrink-0 place-items-center overflow-hidden rounded bg-[#121212] text-white/70">
                    {art ? <EventImage event={art} sizes="80px" /> : <Icon name="shield" className="h-7 w-7" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">{titleOf(block)}</span>
                    <span className="block truncate text-sm text-zinc-600">
                      Block {index} · {block.txs[0]?.body.event.venue ?? (index === 0 ? "Start of the chain" : "Venue TBA")}
                    </span>
                  </span>
                  <HealthIcon state={healthOf(view, index)} />
                  <Icon name="next" className="h-5 w-5 shrink-0 text-zinc-400" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      {view.chain.length === 1 && (
        <div className="border-t border-zinc-200 p-5">
          <p className="mb-3 text-sm text-zinc-600">Get a ticket to add your first block.</p>
          <Link href="/discover/concerts" className="block rounded bg-[#024bde] px-5 py-3.5 text-center font-bold text-white transition hover:bg-[#0139a8]">
            Find concerts
          </Link>
        </div>
      )}
    </>
  );
}
