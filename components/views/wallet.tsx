"use client";

import Link from "next/link";
import { useState } from "react";
import { ACCOUNTS, accountOf } from "@/lib/chain/accounts";
import { maxResalePrice } from "@/lib/chain/contract";
import type { Address, Ticket } from "@/lib/chain/types";
import { useChain } from "../chain-provider";
import { Container, eventHref } from "../event-parts";
import { Badge, Button, Card, Empty, EventArt, formatDate, Hash, Input, Label, PageHeader, Select, Tix, Who } from "../ui";

export function WalletView() {
  const { pendingState, account, chain, mempool } = useChain();
  const me = accountOf(account)!;
  const [tab, setTab] = useState<"upcoming" | "used">("upcoming");
  const all = Object.values(pendingState.tickets).filter((t) => t.owner === account);
  const mine = all.filter((t) => (tab === "used" ? t.usedAt !== null : t.usedAt === null));
  const pendingHashes = new Set(mempool.map((t) => t.hash));
  const myTxs = [...chain.flatMap((b) => b.txs.map((tx) => ({ tx, block: b.index as number | null }))), ...mempool.map((tx) => ({ tx, block: null }))]
    .filter(({ tx }) => tx.from === account || ("to" in tx.payload && tx.payload.to === account))
    .reverse();

  return (
    <Container>
      <PageHeader
        title="My Tickets"
        subtitle={
          <>
            {me.emoji} {me.name} · <code className="text-zinc-700">{account}</code>. Ownership comes from replaying the ledger. There is no central database.
          </>
        }
      >
        <Card className="py-3">
          <div className="text-xs font-semibold uppercase text-zinc-500">Wallet balance</div>
          <Tix amount={pendingState.balances[account] ?? 0} className="text-2xl" />
        </Card>
      </PageHeader>

      <div className="mb-5 flex gap-6 border-b border-zinc-300 text-sm font-semibold">
        {(["upcoming", "used"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 pb-2 ${tab === t ? "border-violet-600 text-violet-700" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}
          >
            {t === "upcoming" ? "Upcoming" : "Used"} ({all.filter((x) => (t === "used" ? x.usedAt !== null : x.usedAt === null)).length})
          </button>
        ))}
      </div>

      {mine.length === 0 ? (
        <Empty>
          No {tab} tickets.{" "}
          <Link href="/events" className="font-semibold text-violet-700 underline">
            Find events →
          </Link>
        </Empty>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {mine.map((t) => (
            <TicketCard key={t.id} ticket={t} pending={t.history.some((h) => pendingHashes.has(h.txHash))} />
          ))}
        </div>
      )}

      <h2 className="mb-3 mt-12 text-xl font-extrabold">Transaction history</h2>
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Tx hash</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Details</th>
              <th className="px-4 py-3">Block</th>
            </tr>
          </thead>
          <tbody>
            {myTxs.map(({ tx, block }) => (
              <tr key={tx.hash} className="border-t border-zinc-100">
                <td className="px-4 py-2.5">
                  <Hash value={tx.hash} />
                </td>
                <td className="px-4 py-2.5">
                  <Badge color="violet">{tx.type}</Badge>
                </td>
                <td className="max-w-md truncate px-4 py-2.5 font-mono text-xs text-zinc-500">{JSON.stringify(tx.payload)}</td>
                <td className="px-4 py-2.5">{block === null ? <Badge color="amber">pending</Badge> : `#${block}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Container>
  );
}

/** Deterministic pseudo-barcode from the ticket id + owner (visual only). */
function Barcode({ seed }: { seed: string }) {
  const bars = Array.from(seed.replace(/[^a-z0-9]/gi, "").slice(0, 48), (c) => (parseInt(c, 36) % 3) + 1);
  return (
    <div className="flex h-10 items-stretch gap-[2px]" aria-hidden>
      {bars.map((w, i) => (
        <span key={i} className={i % 2 ? "bg-transparent" : "bg-zinc-900"} style={{ width: w * 2 }} />
      ))}
    </div>
  );
}

function TicketCard({ ticket, pending }: { ticket: Ticket; pending: boolean }) {
  const { pendingState, submit, account } = useChain();
  const ev = pendingState.events[ticket.eventId];
  const cap = maxResalePrice(ev.price, ev.maxMarkupBps);
  const [price, setPrice] = useState(cap);
  const others = ACCOUNTS.filter((a) => a.address !== account);
  const [to, setTo] = useState<Address>(others[0].address);
  const [panel, setPanel] = useState<"none" | "sell" | "transfer" | "history">("none");
  const used = ticket.usedAt !== null;

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-zinc-200">
      <div className="relative">
        <EventArt ev={ev} className="h-32 w-full" sizes="(max-width: 1024px) 100vw, 50vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 text-white">
          <Link href={eventHref(ev)} className="line-clamp-1 text-lg font-extrabold hover:underline">
            {ev.name}
          </Link>
          <div className="text-xs text-white/80">
            {formatDate(ev.date)} · {ev.venue}
          </div>
        </div>
        <div className="absolute right-3 top-3 flex gap-1">
          {pending && <Badge color="amber">pending</Badge>}
          {used ? <Badge color="red">used</Badge> : <Badge color="green">valid</Badge>}
          {ticket.listing && <Badge color="sky">listed @ {ticket.listing.price}</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-zinc-200 border-b border-dashed border-zinc-300 text-center text-xs">
        <div className="py-2.5">
          <div className="text-zinc-500">Section</div>
          <div className="font-bold">GA</div>
        </div>
        <div className="py-2.5">
          <div className="text-zinc-500">Ticket</div>
          <div className="font-bold">#{ticket.serial}</div>
        </div>
        <div className="py-2.5">
          <div className="text-zinc-500">Paid</div>
          <div className="font-bold">{ticket.history.filter((h) => h.price > 0).at(-1)?.price ?? 0} TIX</div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <div>
          <Barcode seed={`${ticket.id}${ticket.owner}${ticket.history.at(-1)?.txHash ?? ""}`} />
          <div className="mt-1 font-mono text-[10px] text-zinc-500">token {ticket.id}</div>
        </div>
        {!used && (
          <div className="flex flex-wrap justify-end gap-1.5">
            <Button size="sm" variant={panel === "sell" ? "primary" : "ghost"} onClick={() => setPanel(panel === "sell" ? "none" : "sell")}>
              Sell
            </Button>
            <Button size="sm" variant={panel === "transfer" ? "primary" : "ghost"} onClick={() => setPanel(panel === "transfer" ? "none" : "transfer")}>
              Transfer
            </Button>
          </div>
        )}
        <button className="text-xs font-semibold text-violet-700 hover:underline" onClick={() => setPanel(panel === "history" ? "none" : "history")}>
          History
        </button>
      </div>

      {panel === "sell" && !used && (
        <form
          className="space-y-2 bg-zinc-50 px-4 py-3"
          onSubmit={(e) => {
            e.preventDefault();
            void submit("LIST_TICKET", { ticketId: ticket.id, price: Math.round(price) });
          }}
        >
          <Label hint={`contract cap ${cap} TIX`}>Resale price</Label>
          <div className="flex gap-2">
            <Input type="number" min={1} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
            <Button type="submit">List</Button>
          </div>
          <div className="flex gap-4 text-xs">
            <button type="button" onClick={() => setPrice(ev.price * 5)} className="font-semibold text-rose-700 hover:underline">
              🦈 Try scalping at 5× ({ev.price * 5})
            </button>
            {ticket.listing && (
              <button type="button" onClick={() => void submit("CANCEL_LISTING", { ticketId: ticket.id })} className="text-zinc-600 hover:underline">
                Cancel listing
              </button>
            )}
          </div>
        </form>
      )}

      {panel === "transfer" && !used && (
        <form
          className="space-y-2 bg-zinc-50 px-4 py-3"
          onSubmit={(e) => {
            e.preventDefault();
            void submit("TRANSFER", { ticketId: ticket.id, to });
          }}
        >
          <Label>Send to a friend</Label>
          <div className="flex gap-2">
            <Select value={to} onChange={(e) => setTo(e.target.value as Address)}>
              {others.map((a) => (
                <option key={a.address} value={a.address}>
                  {a.emoji} {a.name}
                </option>
              ))}
            </Select>
            <Button type="submit">Send</Button>
          </div>
        </form>
      )}

      {panel === "history" && (
        <ol className="space-y-1.5 bg-zinc-50 px-4 py-3 text-xs text-zinc-700">
          {ticket.history.map((h) => (
            <li key={h.txHash}>
              <Badge>{h.type}</Badge> {h.from && <Who address={h.from} />} → <Who address={h.to} />
              {h.price > 0 && <> · {h.price} TIX</>}
              {h.royalty > 0 && <span className="text-emerald-700"> · royalty {h.royalty}</span>} ·{" "}
              {h.block === null ? <span className="text-amber-700">pending</span> : `block #${h.block}`} · <Hash value={h.txHash} chars={4} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
