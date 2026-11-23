"use client";

import Link from "next/link";
import { maxResalePrice } from "@/lib/chain/contract";
import { useChain } from "../chain-provider";
import { Container, eventHref } from "../event-parts";
import { Badge, Button, Card, Empty, EventArt, formatDate, PageHeader, Tix, Who } from "../ui";

export function MarketplaceView() {
  const { pendingState, submit, account } = useChain();
  const listings = Object.values(pendingState.tickets).filter((t) => t.listing);
  const events = Object.values(pendingState.events);
  const resales = Object.values(pendingState.tickets)
    .flatMap((t) => t.history.filter((h) => h.type === "RESALE").map((h) => ({ ...h, ticket: t })))
    .sort((a, b) => b.timestamp - a.timestamp);

  return (
    <Container>
      <PageHeader
        title="Verified Fan Resale"
        subtitle="Peer-to-peer resale with no middleman. When you buy, the contract pays the seller, sends the royalty to the organizer and moves the ticket token in one atomic transaction. Prices can never exceed the event's cap."
      />

      {listings.length === 0 ? (
        <Empty>No tickets listed right now. List one from My Tickets → Sell.</Empty>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {listings.map((t) => {
            const ev = pendingState.events[t.eventId];
            const price = t.listing!.price;
            const royalty = Math.floor((price * ev.royaltyBps) / 10_000);
            const markup = ((price - ev.price) / ev.price) * 100;
            return (
              <div key={t.id} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-zinc-200">
                <EventArt ev={ev} className="h-28 w-full" />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={eventHref(ev)} className="line-clamp-1 font-bold hover:text-violet-700">
                        {ev.name}
                      </Link>
                      <div className="text-xs text-zinc-500">
                        {formatDate(ev.date)} · Ticket #{t.serial}
                      </div>
                    </div>
                    <Badge color={markup > 0 ? "amber" : "green"}>
                      {markup >= 0 ? "+" : ""}
                      {markup.toFixed(0)}% vs face
                    </Badge>
                  </div>
                  <div className="mt-3 space-y-0.5 text-xs text-zinc-600">
                    <div>
                      Seller <Who address={t.owner} />
                    </div>
                    <div>
                      Seller gets {price - royalty} · organizer royalty <span className="font-semibold text-emerald-700">{royalty}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <Tix amount={price} className="text-lg" />
                    <Button disabled={t.owner === account} onClick={() => void submit("BUY_RESALE", { ticketId: t.id })}>
                      {t.owner === account ? "Your listing" : "Buy"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-xl font-extrabold">Rules enforced by the contract</h2>
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Face</th>
                  <th className="px-4 py-3">Max resale</th>
                  <th className="px-4 py-3">Royalty</th>
                  <th className="px-4 py-3">Earned</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="border-t border-zinc-100">
                    <td className="max-w-[14rem] truncate px-4 py-2.5">{e.name}</td>
                    <td className="px-4 py-2.5">{e.price}</td>
                    <td className="px-4 py-2.5">{maxResalePrice(e.price, e.maxMarkupBps)}</td>
                    <td className="px-4 py-2.5">{e.royaltyBps / 100}%</td>
                    <td className="px-4 py-2.5 font-semibold text-emerald-700">{e.royaltiesEarned}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
        <div>
          <h2 className="mb-3 text-xl font-extrabold">Recent resales</h2>
          <Card className="space-y-2 text-sm">
            {resales.length === 0 && <p className="text-zinc-500">No resales yet.</p>}
            {resales.map((r) => (
              <div key={r.txHash} className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-2 text-xs last:border-b-0">
                <span>
                  <span className="font-mono text-zinc-500">{r.ticket.id}</span> · <Who address={r.from} /> → <Who address={r.to} />
                </span>
                <span>
                  {r.price} TIX · <span className="font-semibold text-emerald-700">royalty {r.royalty}</span>
                </span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </Container>
  );
}
