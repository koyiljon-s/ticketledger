"use client";

import Link from "next/link";
import { ACCOUNTS } from "@/lib/chain/accounts";
import { useChain } from "../chain-provider";
import { Card } from "../ui";

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
  { step: "Buy a ticket", how: "Act as Alice or Bob → Events → Buy. A ticket token is minted to your address.", href: "/events" },
  { step: "Try to scalp", how: "Switch to Sam the Scalper, buy a ticket, then list it at 5× face value in My Tickets. Watch it revert.", href: "/wallet" },
  { step: "Resell fairly", how: "List within the cap, then switch wallet and buy it on the Resale Market. Check the organizer's royalty.", href: "/marketplace" },
  { step: "Check in at the gate", how: "Switch to Aurora Live → Gate Check-in. Verify and admit a ticket, then try to admit it again.", href: "/gate" },
  { step: "Tamper with history", how: "Open the Block Explorer, edit a mined block's data and see every later block become invalid.", href: "/explorer" },
];

export function Overview() {
  const { state, chain } = useChain();
  const events = Object.values(state.events);
  const tickets = Object.values(state.tickets);
  const royalties = events.reduce((s, e) => s + e.royaltiesEarned, 0);
  const txCount = chain.reduce((s, b) => s + b.txs.length, 0);

  return (
    <div className="space-y-14">
      <section className="grid items-center gap-10 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-3 py-1 text-xs text-fuchsia-300">
            Case study · Blockchain in Entertainment
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            Fair, verifiable event tickets <span className="bg-gradient-to-r from-fuchsia-400 to-violet-400 bg-clip-text text-transparent">on a blockchain</span>
          </h1>
          <p className="mt-5 max-w-xl text-zinc-400">
            StageChain is a working demo of a decentralized ticketing app (dApp). Tickets are tokens on a ledger. The rules for price caps,
            royalties and single-use entry live in a smart contract that every node runs, so no single company has to be trusted to apply them.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/events" className="rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-500 px-5 py-2.5 text-sm font-medium">
              Browse events →
            </Link>
            <Link href="/explorer" className="rounded-lg border border-white/15 px-5 py-2.5 text-sm font-medium hover:bg-white/5">
              Open block explorer
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            ["Blocks", chain.length],
            ["Transactions", txCount],
            ["Tickets minted", tickets.length],
            ["Royalties paid", `${royalties} TIX`],
          ].map(([k, v]) => (
            <Card key={k as string}>
              <div className="text-xs uppercase tracking-wide text-zinc-500">{k}</div>
              <div className="mt-1 text-2xl font-bold tabular-nums">{v}</div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Problems in the industry and how the blockchain helps</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {PROBLEMS.map((p) => (
            <Card key={p.problem}>
              <div className="flex gap-3">
                <span className="text-2xl">{p.icon}</span>
                <div>
                  <div className="font-semibold">{p.problem}</div>
                  <p className="mt-1 text-sm text-zinc-400">{p.solution}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Guided demo (≈5 minutes)</h2>
        <ol className="grid gap-3 md:grid-cols-5">
          {TOUR.map((t, i) => (
            <li key={t.step}>
              <Link href={t.href} className="block h-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-fuchsia-400/40">
                <div className="text-xs text-fuchsia-300">Step {i + 1}</div>
                <div className="mt-1 font-semibold">{t.step}</div>
                <p className="mt-2 text-xs text-zinc-400">{t.how}</p>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Demo wallets</h2>
        <p className="mb-4 text-sm text-zinc-400">Use the wallet switcher in the top-right to act as each participant.</p>
        <div className="grid gap-4 md:grid-cols-4">
          {ACCOUNTS.map((a) => (
            <Card key={a.address}>
              <div className="text-2xl">{a.emoji}</div>
              <div className="mt-2 font-semibold">{a.name}</div>
              <code className="block break-all text-[11px] text-zinc-500">{a.address}</code>
              <p className="mt-2 text-xs text-zinc-400">{a.blurb}</p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Architecture</h2>
        <Card className="font-mono text-xs leading-6 text-zinc-300">
          <pre className="overflow-x-auto">{`  Wallet (you)                 Node (this browser tab)                          Ledger
 ┌────────────┐  sign+send  ┌──────────────────────────────┐   mine (PoW)   ┌───────────────────────┐
 │ Alice/Bob/ │ ──────────▶ │ 1. simulate tx in contract   │ ─────────────▶ │ Block n               │
 │ Organizer  │             │    (revert ⇒ rejected)       │                │  prevHash = hash(n-1) │
 └────────────┘             │ 2. add to mempool            │                │  nonce, txs[]         │
                            │ 3. state = replay(all blocks)│ ◀───────────── │  hash = SHA-256(...)  │
                            └──────────────────────────────┘    validate    └───────────────────────┘`}</pre>
        </Card>
      </section>
    </div>
  );
}
