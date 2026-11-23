"use client";

import Link from "next/link";
import { ACCOUNTS } from "@/lib/chain/accounts";
import { useChain } from "../chain-provider";
import { Container } from "../event-parts";
import { Card, PageHeader } from "../ui";

const PROBLEMS = [
  {
    icon: "🦈",
    problem: "Scalping & price gouging",
    solution: "The smart contract enforces a maximum resale markup. A listing above the cap is reverted, so no node will include it in a block.",
  },
  {
    icon: "🪪",
    problem: "Counterfeit & duplicate tickets",
    solution: "Each ticket is a unique token on a shared ledger. At the gate, staff check on-chain ownership. A ticket can be checked in only once.",
  },
  {
    icon: "💸",
    problem: "Artists earn nothing on resales",
    solution: "A royalty in basis points is written into the event. Every secondary sale automatically sends that share to the organizer or artist.",
  },
  {
    icon: "🔍",
    problem: "Opaque ownership history",
    solution: "Every mint, resale, transfer and check-in is a transaction in a hash-linked block that anyone can audit in the explorer.",
  },
];

const TOUR = [
  { step: "Import a real event", how: "Switch to Aurora Live → Organizer. Search Ticketmaster and mint a real event on StageChain.", href: "/organizer" },
  { step: "Buy a ticket", how: "Act as Alice or Bob, open an event and buy tickets. Each ticket token is minted to your address.", href: "/events" },
  { step: "Try to scalp", how: "Switch to Sam the Scalper and buy a ticket. In My Tickets, list it at 5× face value and watch it revert.", href: "/wallet" },
  { step: "Resell fairly", how: "List within the cap, switch wallet and buy it on Fan Resale. Check the organizer's royalty.", href: "/marketplace" },
  { step: "Check in at the gate", how: "As Aurora Live, open Gate Check-in. Verify and admit a ticket, then try to admit it again.", href: "/gate" },
  { step: "Tamper with history", how: "Open the Block Explorer, edit a mined block and see every later block become invalid.", href: "/explorer" },
];

export function HowItWorksView() {
  const { state, chain } = useChain();
  const events = Object.values(state.events);
  const royalties = events.reduce((s, e) => s + e.royaltiesEarned, 0);
  const txCount = chain.reduce((s, b) => s + b.txs.length, 0);

  return (
    <Container className="space-y-12">
      <PageHeader
        title="How StageChain works"
        subtitle="A working demo of a decentralized ticketing app (dApp). Tickets are tokens on a ledger. The rules for price caps, royalties and single-use entry live in a smart contract that every node runs."
      />

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          ["Blocks", chain.length],
          ["Transactions", txCount],
          ["Tickets minted", Object.keys(state.tickets).length],
          ["Royalties paid", `${royalties} TIX`],
        ].map(([k, v]) => (
          <Card key={k as string}>
            <div className="text-xs font-semibold uppercase text-zinc-500">{k}</div>
            <div className="mt-1 text-3xl font-extrabold tabular-nums">{v}</div>
          </Card>
        ))}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-extrabold">Industry problems → blockchain solutions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {PROBLEMS.map((p) => (
            <Card key={p.problem}>
              <div className="flex gap-3">
                <span className="text-2xl">{p.icon}</span>
                <div>
                  <div className="font-bold">{p.problem}</div>
                  <p className="mt-1 text-sm text-zinc-600">{p.solution}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-extrabold">Guided demo (≈5 minutes)</h2>
        <ol className="grid gap-3 md:grid-cols-3">
          {TOUR.map((t, i) => (
            <li key={t.step}>
              <Link href={t.href} className="block h-full rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-violet-400">
                <div className="text-xs font-bold text-violet-700">STEP {i + 1}</div>
                <div className="mt-1 font-bold">{t.step}</div>
                <p className="mt-2 text-sm text-zinc-600">{t.how}</p>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="mb-1 text-xl font-extrabold">Demo wallets</h2>
        <p className="mb-4 text-sm text-zinc-600">Use the wallet switcher in the header to act as each participant.</p>
        <div className="grid gap-4 md:grid-cols-4">
          {ACCOUNTS.map((a) => (
            <Card key={a.address}>
              <div className="text-2xl">{a.emoji}</div>
              <div className="mt-2 font-bold">{a.name}</div>
              <code className="block break-all text-[11px] text-zinc-500">{a.address}</code>
              <p className="mt-2 text-sm text-zinc-600">{a.blurb}</p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-extrabold">Architecture</h2>
        <Card className="bg-zinc-950 font-mono text-xs leading-6 text-zinc-200">
          <pre className="overflow-x-auto">{`                         Ticketmaster Discovery API (real event metadata, read-only)
                                        │  via /api/ticketmaster (key stays on server)
                                        ▼
  Wallet (you)                 Node (this browser tab)                          Ledger
 ┌────────────┐  sign+send  ┌──────────────────────────────┐   mine (PoW)   ┌───────────────────────┐
 │ Alice/Bob/ │ ──────────▶ │ 1. simulate tx in contract   │ ─────────────▶ │ Block n               │
 │ Organizer  │             │    (revert ⇒ rejected)       │                │  prevHash = hash(n-1) │
 └────────────┘             │ 2. add to mempool            │                │  nonce, txs[]         │
                            │ 3. state = replay(all blocks)│ ◀───────────── │  hash = SHA-256(...)  │
                            └──────────────────────────────┘    validate    └───────────────────────┘`}</pre>
        </Card>
      </section>
    </Container>
  );
}
