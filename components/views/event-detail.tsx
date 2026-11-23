"use client";

import Link from "next/link";
import { useState } from "react";
import { maxResalePrice } from "@/lib/chain/contract";
import { useChain } from "../chain-provider";
import { Container, EventBadges } from "../event-parts";
import { Badge, Button, Card, Empty, EventArt, formatDate, Hash, Tix, Who } from "../ui";

export function EventDetailView({ id }: { id: string }) {
  const { pendingState, chain, submit, account } = useChain();
  const ev = pendingState.events[id];
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);

  if (!ev) {
    return (
      <Container>
        <Empty>
          Event <code>{id}</code> does not exist on this chain.{" "}
          <Link href="/events" className="font-semibold text-violet-700 underline">
            Browse events
          </Link>
        </Empty>
      </Container>
    );
  }

  const tickets = Object.values(pendingState.tickets).filter((t) => t.eventId === ev.id);
  const listings = tickets.filter((t) => t.listing).sort((a, b) => a.listing!.price - b.listing!.price);
  const mine = tickets.filter((t) => t.owner === account).length;
  const left = ev.supply - ev.sold;
  const cap = maxResalePrice(ev.price, ev.maxMarkupBps);
  const balance = pendingState.balances[account] ?? 0;
  const maxQty = Math.max(1, Math.min(4, left));
  // EVT-n is created by the n-th CREATE_EVENT tx on the chain (reverted txs never enter blocks).
  const n = Number(ev.id.split("-")[1]);
  const createdIn = chain
    .flatMap((b) => b.txs.filter((tx) => tx.type === "CREATE_EVENT").map(() => b))
    .at(n - 1);

  async function buy() {
    setBusy(true);
    for (let i = 0; i < qty; i++) {
      const r = await submit("BUY_TICKET", { eventId: ev.id });
      if (!r.ok) break;
    }
    setBusy(false);
    setQty(1);
  }

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#140a2c] text-white">
        {ev.imageUrl && <EventArt ev={ev} sizes="100vw" className="absolute inset-0 scale-110 opacity-30 blur-2xl" />}
        <Container className="relative flex flex-col gap-6 md:flex-row md:items-center">
          <EventArt ev={ev} priority sizes="(max-width: 768px) 100vw, 420px" className="aspect-[16/9] w-full shrink-0 rounded-xl shadow-2xl md:w-[420px]" />
          <div>
            <div className="text-xs text-white/60">
              <Link href="/events" className="hover:underline">
                Events
              </Link>{" "}
              / {ev.category}
            </div>
            <h1 className="mt-2 text-3xl font-extrabold leading-tight md:text-4xl">{ev.name}</h1>
            <div className="mt-3 space-y-1 text-white/85">
              <div>🗓️ {formatDate(ev.date)}</div>
              <div>📍 {ev.venue}</div>
              <div className="text-sm text-white/60">
                Presented by <Who address={ev.organizer} /> · Contract ID <span className="font-mono">{ev.id}</span>
              </div>
            </div>
            <div className="mt-4">
              <EventBadges ev={ev} />
            </div>
          </div>
        </Container>
      </section>

      <Container className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* Primary tickets */}
          <Card className="p-0">
            <div className="border-b border-zinc-200 px-5 py-4">
              <h2 className="text-lg font-extrabold">Tickets</h2>
              <p className="text-sm text-zinc-600">Sold directly by the organizer at face value. Each ticket is minted to your wallet.</p>
            </div>
            <div className="flex flex-wrap items-center gap-4 px-5 py-5">
              <div className="flex-1">
                <div className="font-bold">Standard Admission</div>
                <div className="text-sm text-zinc-600">
                  {left > 0 ? `${left} of ${ev.supply} remaining` : "Sold out. Check fan resale below."}
                </div>
                <div className="mt-2 h-1.5 w-full max-w-xs rounded-full bg-zinc-200">
                  <div className="h-full rounded-full bg-violet-600" style={{ width: `${(ev.sold / ev.supply) * 100}%` }} />
                </div>
              </div>
              <Tix amount={ev.price} className="text-xl" />
              <div className="flex items-center rounded-md border border-zinc-300">
                <button className="px-3 py-2 text-lg disabled:opacity-30" disabled={qty <= 1} onClick={() => setQty((q) => q - 1)} aria-label="Fewer">
                  −
                </button>
                <span className="w-8 text-center font-semibold tabular-nums">{qty}</span>
                <button className="px-3 py-2 text-lg disabled:opacity-30" disabled={qty >= maxQty} onClick={() => setQty((q) => q + 1)} aria-label="More">
                  +
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-xl bg-zinc-50 px-5 py-4">
              <div className="text-sm">
                Total <Tix amount={ev.price * qty} /> · your balance <Tix amount={balance} className={balance < ev.price * qty ? "text-rose-600" : ""} />
              </div>
              <Button size="lg" disabled={busy || left === 0} onClick={() => void buy()}>
                {busy ? "Submitting…" : left === 0 ? "Sold out" : `Buy ${qty} ticket${qty > 1 ? "s" : ""}`}
              </Button>
            </div>
          </Card>

          {/* Resale */}
          <Card className="p-0">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-extrabold">Verified fan resale</h2>
                <p className="text-sm text-zinc-600">
                  Max price {cap} TIX (face + {ev.maxMarkupBps / 100}%). {ev.royaltyBps / 100}% of each sale goes to the organizer.
                </p>
              </div>
              <Badge color="green">{listings.length} listed</Badge>
            </div>
            {listings.length === 0 ? (
              <p className="px-5 py-6 text-sm text-zinc-500">No resale tickets right now.</p>
            ) : (
              listings.map((t) => (
                <div key={t.id} className="flex flex-wrap items-center gap-4 border-b border-zinc-100 px-5 py-3 last:border-b-0">
                  <div className="flex-1">
                    <div className="font-semibold">Ticket #{t.serial}</div>
                    <div className="text-xs text-zinc-500">
                      Seller <Who address={t.owner} /> · {t.history.length - 1} previous transfer(s)
                    </div>
                  </div>
                  <Tix amount={t.listing!.price} />
                  <Button size="sm" disabled={t.owner === account} onClick={() => void submit("BUY_RESALE", { ticketId: t.id })}>
                    {t.owner === account ? "Your listing" : "Buy"}
                  </Button>
                </div>
              ))
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {mine > 0 && (
            <Card className="border-emerald-300 bg-emerald-50">
              <div className="font-bold text-emerald-900">You have {mine} ticket{mine > 1 ? "s" : ""}</div>
              <Link href="/wallet" className="text-sm font-semibold text-emerald-800 underline">
                View in My Tickets →
              </Link>
            </Card>
          )}
          <Card>
            <h3 className="mb-3 font-extrabold">Smart-contract rules</h3>
            <dl className="space-y-2 text-sm">
              {[
                ["Face value", `${ev.price} TIX`],
                ["Supply", `${ev.sold} / ${ev.supply} minted`],
                ["Resale cap", `${cap} TIX`],
                ["Artist royalty", `${ev.royaltyBps / 100}%`],
                ["Royalties earned", `${ev.royaltiesEarned} TIX`],
                ["Primary revenue", `${ev.primaryRevenue} TIX`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-zinc-500">{k}</dt>
                  <dd className="font-semibold">{v}</dd>
                </div>
              ))}
              {createdIn && (
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-500">Created in</dt>
                  <dd>
                    block #{createdIn.index} · <Hash value={createdIn.hash} chars={4} />
                  </dd>
                </div>
              )}
            </dl>
            <p className="mt-3 text-xs text-zinc-500">These values are immutable once the event is on-chain. Not even the organizer can raise the cap later.</p>
          </Card>
          {ev.source?.provider === "ticketmaster" && (
            <Card>
              <h3 className="font-extrabold">Event data source</h3>
              <p className="mt-1 text-sm text-zinc-600">
                Event details and artwork were imported from the Ticketmaster Discovery API. StageChain tickets are demo tokens, not real tickets.
              </p>
              <a href={ev.source.url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-violet-700 underline">
                View the original on Ticketmaster ↗
              </a>
            </Card>
          )}
        </aside>
      </Container>
    </>
  );
}
