"use client";

import { maxResalePrice } from "@/lib/chain/contract";
import { useChain } from "../chain-provider";
import { Badge, Button, CATEGORY_EMOJI, Card, PageHeader, Tix, Who } from "../ui";

export function MarketplaceView() {
  const { pendingState, submit, account } = useChain();
  const listings = Object.values(pendingState.tickets).filter((t) => t.listing);
  const events = Object.values(pendingState.events);
  const resales = Object.values(pendingState.tickets).flatMap((t) => t.history.filter((h) => h.type === "RESALE").map((h) => ({ ...h, ticket: t })));

  return (
    <>
      <PageHeader
        title="Resale Market"
        subtitle="Peer-to-peer secondary market with no middleman. When you buy, the contract pays the seller, sends the royalty to the organizer and moves the ticket token in one atomic transaction."
      />

      {listings.length === 0 ? (
        <Card className="text-center text-sm text-zinc-400">No tickets listed right now. List one from “My Tickets”.</Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {listings.map((t) => {
            const ev = pendingState.events[t.eventId];
            const price = t.listing!.price;
            const royalty = Math.floor((price * ev.royaltyBps) / 10_000);
            const markup = ((price - ev.price) / ev.price) * 100;
            return (
              <Card key={t.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">
                      {CATEGORY_EMOJI[ev.category]} {ev.name}
                    </div>
                    <div className="mt-0.5 font-mono text-xs text-zinc-500">{t.id}</div>
                  </div>
                  <Badge color={markup > 0 ? "amber" : "green"}>
                    {markup >= 0 ? "+" : ""}
                    {markup.toFixed(0)}% vs face
                  </Badge>
                </div>
                <div className="mt-3 space-y-1 text-xs text-zinc-400">
                  <div>
                    Seller: <Who address={t.owner} />
                  </div>
                  <div>
                    Split: seller {price - royalty} · organizer royalty <span className="text-emerald-300">{royalty}</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <Tix amount={price} />
                  <Button disabled={t.owner === account} onClick={() => void submit("BUY_RESALE", { ticketId: t.id })}>
                    {t.owner === account ? "Your listing" : "Buy"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-xl font-semibold">Rules enforced by the contract</h2>
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-zinc-500">
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Face</th>
                  <th className="px-4 py-3">Max resale</th>
                  <th className="px-4 py-3">Royalty</th>
                  <th className="px-4 py-3">Earned</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="border-b border-white/5">
                    <td className="px-4 py-2.5">{e.name}</td>
                    <td className="px-4 py-2.5">{e.price}</td>
                    <td className="px-4 py-2.5">{maxResalePrice(e.price, e.maxMarkupBps)}</td>
                    <td className="px-4 py-2.5">{e.royaltyBps / 100}%</td>
                    <td className="px-4 py-2.5 text-emerald-300">{e.royaltiesEarned}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
        <div>
          <h2 className="mb-3 text-xl font-semibold">Recent resales</h2>
          <Card className="space-y-2 text-sm">
            {resales.length === 0 && <p className="text-zinc-400">No resales yet.</p>}
            {resales.reverse().map((r) => (
              <div key={r.txHash} className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2 text-xs">
                <span>
                  <span className="font-mono text-zinc-500">{r.ticket.id}</span> · <Who address={r.from} /> → <Who address={r.to} />
                </span>
                <span>
                  {r.price} TIX · <span className="text-emerald-300">royalty {r.royalty}</span>
                </span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </>
  );
}
