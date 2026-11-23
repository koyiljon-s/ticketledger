"use client";

import Link from "next/link";
import { maxResalePrice } from "@/lib/chain/contract";
import type { ShowEvent } from "@/lib/chain/types";
import { useChain } from "./chain-provider";
import { Badge, DateBlock, EventArt, formatDate, timeOf } from "./ui";

export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-7xl px-5 py-10 ${className}`}>{children}</div>;
}

export function eventHref(ev: Pick<ShowEvent, "id">) {
  return `/events/${encodeURIComponent(ev.id)}`;
}

/** Sort helper: soonest first, events without a valid date last. */
export function byDate(a: ShowEvent, b: ShowEvent) {
  const ta = new Date(a.date).getTime() || Infinity;
  const tb = new Date(b.date).getTime() || Infinity;
  return ta - tb;
}

function useEventStats(ev: ShowEvent) {
  const { pendingState } = useChain();
  const tickets = Object.values(pendingState.tickets).filter((t) => t.eventId === ev.id);
  const resale = tickets.filter((t) => t.listing).length;
  return { left: ev.supply - ev.sold, resale };
}

export function EventBadges({ ev }: { ev: ShowEvent }) {
  const { left, resale } = useEventStats(ev);
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge color="violet">⛓ On-chain tickets</Badge>
      {ev.source?.provider === "ticketmaster" && <Badge color="sky">Imported · Ticketmaster</Badge>}
      {resale > 0 && <Badge color="green">{resale} fan resale</Badge>}
      {left === 0 ? <Badge color="red">Sold out</Badge> : left <= 5 ? <Badge color="amber">Only {left} left</Badge> : null}
    </div>
  );
}

/** Horizontal list row: date · details · CTA. */
export function EventRow({ ev }: { ev: ShowEvent }) {
  const { left } = useEventStats(ev);
  return (
    <div className="flex items-center gap-4 border-b border-zinc-200 bg-white px-4 py-4 last:border-b-0 hover:bg-zinc-50 sm:gap-6 sm:px-6">
      <DateBlock date={ev.date} />
      <EventArt ev={ev} className="hidden h-16 w-28 shrink-0 rounded-md sm:block" sizes="112px" />
      <div className="min-w-0 flex-1">
        <div className="text-xs text-zinc-500">
          {timeOf(ev.date) && <>{timeOf(ev.date)} · </>}
          {ev.category}
        </div>
        <Link href={eventHref(ev)} className="block truncate text-base font-bold text-zinc-900 hover:text-violet-700">
          {ev.name}
        </Link>
        <div className="truncate text-sm text-zinc-600">{ev.venue}</div>
        <div className="mt-1.5">
          <EventBadges ev={ev} />
        </div>
      </div>
      <div className="hidden text-right text-sm md:block">
        <div className="text-xs text-zinc-500">from</div>
        <div className="font-bold">{ev.price} TIX</div>
        <div className="text-[11px] text-zinc-500">resale cap {maxResalePrice(ev.price, ev.maxMarkupBps)}</div>
      </div>
      <Link
        href={eventHref(ev)}
        className={`shrink-0 rounded-md px-4 py-2.5 text-sm font-semibold ${
          left === 0 ? "border border-zinc-300 text-zinc-700 hover:bg-zinc-100" : "bg-violet-600 text-white hover:bg-violet-700"
        }`}
      >
        {left === 0 ? "View resale" : "Find tickets"}
      </Link>
    </div>
  );
}

/** Image-first card for grids. */
export function EventTile({ ev }: { ev: ShowEvent }) {
  return (
    <Link href={eventHref(ev)} className="group block overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-zinc-200 transition hover:shadow-md">
      <EventArt ev={ev} className="aspect-[16/9] w-full transition group-hover:brightness-110" />
      <div className="p-4">
        <div className="text-xs font-semibold uppercase text-violet-700">{formatDate(ev.date)}</div>
        <div className="mt-1 line-clamp-2 font-bold text-zinc-900 group-hover:text-violet-700">{ev.name}</div>
        <div className="mt-0.5 truncate text-sm text-zinc-600">{ev.venue}</div>
      </div>
    </Link>
  );
}
