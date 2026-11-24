"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { dateParts } from "@/components/events/format";
import { balanceOf } from "@/lib/chain/contract";
import { getServerSnapshot, getSnapshot, subscribe } from "@/lib/chain/store";
import type { Ticket } from "@/lib/chain/types";
import { ChainError } from "./chain-error";

/** Today in the same UTC calendar the contract uses. */
const today = () => new Date().toISOString().slice(0, 10);

export function MyTickets() {
  const node = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (node.status === "loading") return <p className="text-lg text-zinc-600">Checking your blockchain…</p>;
  if (node.status === "error") {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-6">
        <ChainError message={node.message} />
      </div>
    );
  }

  const { state, wallet, chain } = node;
  const now = today();
  const mine = state.tickets.filter((t) => t.owner === wallet.address);
  const isPast = (t: Ticket) => t.event.date !== null && t.event.date < now;
  const byDate = (a: Ticket, b: Ticket) => (a.event.date ?? "9999").localeCompare(b.event.date ?? "9999") || a.serial - b.serial;
  const upcoming = mine.filter((t) => !isPast(t)).sort(byDate);
  const past = mine.filter(isPast).sort((a, b) => byDate(b, a));

  return (
    <div className="space-y-10">
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Tickets" value={String(mine.length)} />
        <Stat label="Balance" value={`${balanceOf(state, wallet.address)} TIX`} />
        <Stat label="Blockchain" value={`Valid · ${chain.length} ${chain.length === 1 ? "block" : "blocks"}`} />
        <Stat label="Your wallet" value={wallet.address} mono />
      </dl>

      <Link href="/explorer" className="inline-block font-bold text-[#024bde] underline">
        View the blockchain in the Block Explorer
      </Link>

      {mine.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center">
          <h2 className="text-xl font-black">No tickets yet</h2>
          <p className="mt-2 text-zinc-600">Pick a concert and get your first demo ticket.</p>
          <Link
            href="/discover/concerts"
            className="mt-5 inline-block rounded-md bg-[#024bde] px-5 py-3 font-bold text-white transition hover:bg-[#0139a8]"
          >
            Find concerts
          </Link>
        </div>
      ) : (
        <>
          <TicketList title="Upcoming" tickets={upcoming} />
          <TicketList title="Past" tickets={past} />
        </>
      )}
    </div>
  );
}

function Stat({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-zinc-200">
      <dt className="text-sm text-zinc-500">{label}</dt>
      <dd className={`mt-1 ${mono ? "font-mono text-sm break-all" : "text-xl font-black"}`}>{value}</dd>
    </div>
  );
}

function TicketList({ title, tickets }: { title: string; tickets: Ticket[] }) {
  if (tickets.length === 0) return null;
  return (
    <section>
      <h2 className="mb-5 text-2xl font-black">
        {title} ({tickets.length})
      </h2>
      <ul className="grid gap-5 lg:grid-cols-2">
        {tickets.map((t) => (
          <TicketCard key={t.id} ticket={t} />
        ))}
      </ul>
    </section>
  );
}

function TicketCard({ ticket }: { ticket: Ticket }) {
  const d = dateParts(ticket.event.date);
  return (
    <li className="flex overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-zinc-200">
      <div className="flex w-24 shrink-0 flex-col items-center justify-center bg-[#024bde] p-3 text-center text-white">
        {d ? (
          <>
            <span className="text-sm font-bold uppercase">{d.month}</span>
            <span className="text-4xl font-black leading-none">{d.day}</span>
            <span className="mt-1 text-sm">{d.year}</span>
          </>
        ) : (
          <span className="font-bold">TBA</span>
        )}
      </div>
      <div className="min-w-0 flex-1 p-5">
        <h3 className="text-lg font-bold">
          {/* No prefetch: event pages call rate-limited APIs. */}
          <Link href={`/events/${ticket.event.id}`} prefetch={false} className="hover:underline">
            {ticket.event.name}
          </Link>
        </h3>
        <p className="text-zinc-600">{ticket.event.venue ?? "Venue TBA"}</p>
        <p className="mt-3 text-sm font-bold">
          Ticket #{ticket.serial} · Block #{ticket.blockIndex}
        </p>
        <details className="mt-1 text-sm">
          <summary className="cursor-pointer text-zinc-500">Blockchain record</summary>
          <dl className="mt-2 space-y-2 font-mono text-xs break-all">
            <div>
              <dt className="text-zinc-500">Transaction</dt>
              <dd>{ticket.txHash}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Owner</dt>
              <dd>{ticket.owner}</dd>
            </div>
          </dl>
        </details>
      </div>
    </li>
  );
}
