"use client";

import Link from "next/link";
import { useState } from "react";
import { ACCOUNTS, accountOf } from "@/lib/chain/accounts";
import { maxResalePrice } from "@/lib/chain/contract";
import type { Address, Ticket } from "@/lib/chain/types";
import { useChain } from "../chain-provider";
import { Badge, Button, CATEGORY_EMOJI, CATEGORY_GRADIENT, Card, formatDate, Hash, Input, Label, PageHeader, Tix, Who } from "../ui";

export function WalletView() {
  const { pendingState, account, chain, mempool } = useChain();
  const me = accountOf(account)!;
  const mine = Object.values(pendingState.tickets).filter((t) => t.owner === account);
  const pendingHashes = new Set(mempool.map((t) => t.hash));
  const myTxs = [...chain.flatMap((b) => b.txs.map((tx) => ({ tx, block: b.index as number | null }))), ...mempool.map((tx) => ({ tx, block: null }))]
    .filter(({ tx }) => tx.from === account || ("to" in tx.payload && tx.payload.to === account))
    .reverse();

  return (
    <>
      <PageHeader
        title={`${me.emoji} ${me.name}'s wallet`}
        subtitle={
          <>
            Address <code className="text-zinc-300">{account}</code>. Ticket ownership comes from replaying the ledger. There is no central database.
          </>
        }
      >
        <Card className="py-3">
          <div className="text-xs text-zinc-500">Balance</div>
          <div className="text-2xl">
            <Tix amount={pendingState.balances[account] ?? 0} />
          </div>
        </Card>
      </PageHeader>

      {mine.length === 0 ? (
        <Card className="text-center text-sm text-zinc-400">
          You don&apos;t own any tickets yet.{" "}
          <Link href="/events" className="text-fuchsia-300 underline">
            Buy one →
          </Link>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {mine.map((t) => (
            <TicketCard key={t.id} ticket={t} pending={t.history.some((h) => pendingHashes.has(h.txHash))} />
          ))}
        </div>
      )}

      <h2 className="mb-3 mt-12 text-xl font-semibold">My transactions</h2>
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-zinc-500">
            <tr className="border-b border-white/10">
              <th className="px-4 py-3">Tx hash</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Details</th>
              <th className="px-4 py-3">Block</th>
            </tr>
          </thead>
          <tbody>
            {myTxs.map(({ tx, block }) => (
              <tr key={tx.hash} className="border-b border-white/5">
                <td className="px-4 py-2.5">
                  <Hash value={tx.hash} />
                </td>
                <td className="px-4 py-2.5">
                  <Badge color="fuchsia">{tx.type}</Badge>
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-zinc-400">{JSON.stringify(tx.payload).slice(0, 80)}</td>
                <td className="px-4 py-2.5">{block === null ? <Badge color="amber">pending</Badge> : `#${block}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

function TicketCard({ ticket, pending }: { ticket: Ticket; pending: boolean }) {
  const { pendingState, submit, account } = useChain();
  const ev = pendingState.events[ticket.eventId];
  const cap = maxResalePrice(ev.price, ev.maxMarkupBps);
  const [price, setPrice] = useState(cap);
  const others = ACCOUNTS.filter((a) => a.address !== account);
  const [to, setTo] = useState<Address>(others[0].address);
  const used = ticket.usedAt !== null;

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex">
        <div className={`flex w-28 shrink-0 flex-col items-center justify-center gap-1 bg-gradient-to-br ${CATEGORY_GRADIENT[ev.category]} p-3`}>
          <span className="text-4xl">{CATEGORY_EMOJI[ev.category]}</span>
          <span className="font-mono text-xs font-bold">#{ticket.serial}</span>
        </div>
        <div className="flex-1 border-l border-dashed border-white/20 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="font-semibold">{ev.name}</div>
              <div className="text-xs text-zinc-400">
                {ev.venue} · {formatDate(ev.date)}
              </div>
            </div>
            <div className="flex gap-1">
              {pending && <Badge color="amber">pending</Badge>}
              {used ? <Badge color="red">used</Badge> : <Badge color="green">valid</Badge>}
              {ticket.listing && <Badge color="sky">listed @ {ticket.listing.price}</Badge>}
            </div>
          </div>
          <div className="mt-2 font-mono text-[11px] text-zinc-500">Token ID: {ticket.id}</div>

          {!used && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <form
                className="space-y-1.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit("LIST_TICKET", { ticketId: ticket.id, price: Math.round(price) });
                }}
              >
                <Label hint={`cap ${cap}`}>Resell</Label>
                <div className="flex gap-2">
                  <Input type="number" min={1} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
                  <Button type="submit" variant="ghost">
                    List
                  </Button>
                </div>
                <button type="button" onClick={() => setPrice(ev.price * 5)} className="text-[11px] text-rose-300 hover:underline">
                  🦈 Try scalping at 5× ({ev.price * 5})
                </button>
                {ticket.listing && (
                  <button
                    type="button"
                    onClick={() => void submit("CANCEL_LISTING", { ticketId: ticket.id })}
                    className="ml-3 text-[11px] text-zinc-400 hover:underline"
                  >
                    Cancel listing
                  </button>
                )}
              </form>
              <form
                className="space-y-1.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit("TRANSFER", { ticketId: ticket.id, to });
                }}
              >
                <Label>Gift / transfer</Label>
                <div className="flex gap-2">
                  <select
                    value={to}
                    onChange={(e) => setTo(e.target.value as Address)}
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-sm"
                  >
                    {others.map((a) => (
                      <option key={a.address} value={a.address} className="bg-zinc-900">
                        {a.emoji} {a.name}
                      </option>
                    ))}
                  </select>
                  <Button type="submit" variant="ghost">
                    Send
                  </Button>
                </div>
              </form>
            </div>
          )}

          <details className="mt-4 text-xs">
            <summary className="cursor-pointer text-zinc-400">Provenance ({ticket.history.length} events)</summary>
            <ol className="mt-2 space-y-1.5 border-l border-white/10 pl-3">
              {ticket.history.map((h) => (
                <li key={h.txHash} className="text-zinc-400">
                  <Badge>{h.type}</Badge> {h.from && <Who address={h.from} />} → <Who address={h.to} />
                  {h.price > 0 && <> · {h.price} TIX</>}
                  {h.royalty > 0 && <span className="text-emerald-300"> · royalty {h.royalty}</span>} ·{" "}
                  {h.block === null ? <span className="text-amber-300">pending</span> : `block #${h.block}`} · <Hash value={h.txHash} chars={4} />
                </li>
              ))}
            </ol>
          </details>
        </div>
      </div>
    </Card>
  );
}
