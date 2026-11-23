"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { ACCOUNTS } from "@/lib/chain/accounts";
import type { Address } from "@/lib/chain/types";
import { useChain } from "./chain-provider";
import { Loading } from "./ui";

const CATEGORY_LINKS = [
  { label: "Concerts", category: "Concert" },
  { label: "Sports", category: "Sports" },
  { label: "Arts & Theatre", category: "Theatre" },
  { label: "Festivals", category: "Festival" },
  { label: "Film", category: "Film" },
  { label: "eSports", category: "eSports" },
];

const TOOL_LINKS = [
  { href: "/marketplace", label: "Fan Resale" },
  { href: "/gate", label: "Gate Check-in" },
  { href: "/organizer", label: "Organizer" },
  { href: "/explorer", label: "Block Explorer" },
  { href: "/how-it-works", label: "How it works" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { ready, account, setAccount, pendingState, chain, mempool, mining, toasts, dismiss, validity } = useChain();
  const router = useRouter();
  const [q, setQ] = useState("");
  const me = ACCOUNTS.find((a) => a.address === account)!;

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 bg-[#140a2c] text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3">
          <Link href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-fuchsia-500 to-violet-600 text-base">🎟️</span>
            stage<span className="text-fuchsia-400">chain</span>
          </Link>

          <form
            className="order-last flex w-full flex-1 md:order-none md:w-auto"
            onSubmit={(e) => {
              e.preventDefault();
              router.push(q.trim() ? `/events?q=${encodeURIComponent(q.trim())}` : "/events");
            }}
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search for artists, venues and events"
              className="w-full rounded-l-md bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-500"
              aria-label="Search events"
            />
            <button className="rounded-r-md bg-violet-600 px-5 text-sm font-semibold hover:bg-violet-500">Search</button>
          </form>

          <div className="ml-auto flex items-center gap-3 text-sm">
            <Link
              href="/explorer"
              title="Chain status"
              className="hidden items-center gap-2 rounded-md px-2 py-1.5 text-xs text-white/70 hover:bg-white/10 lg:flex"
            >
              <span className={`h-2 w-2 rounded-full ${validity?.valid === false ? "bg-rose-500" : "bg-emerald-400"}`} />
              Block #{chain.length ? chain[chain.length - 1].index : "—"}
              {mempool.length > 0 && <span className="text-amber-300">· {mempool.length} pending</span>}
              {mining.active && <span className="animate-pulse text-fuchsia-300">· ⛏️</span>}
            </Link>
            <Link href="/wallet" className="rounded-md px-3 py-1.5 font-semibold hover:bg-white/10">
              My Tickets
            </Link>
            <label className="flex items-center gap-2 rounded-md bg-white/10 px-2.5 py-1.5">
              <span className="text-lg">{me.emoji}</span>
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value as Address)}
                className="bg-transparent text-sm font-medium outline-none"
                aria-label="Active wallet"
              >
                {ACCOUNTS.map((a) => (
                  <option key={a.address} value={a.address} className="text-zinc-900">
                    {a.name}
                  </option>
                ))}
              </select>
              <span className="border-l border-white/20 pl-2 font-semibold tabular-nums">
                {(pendingState.balances[account] ?? 0).toLocaleString()} <span className="text-xs text-white/60">TIX</span>
              </span>
            </label>
          </div>
        </div>
        <nav className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-5 text-sm">
            {CATEGORY_LINKS.map((c) => (
              <Link key={c.category} href={`/events?category=${c.category}`} className="whitespace-nowrap px-3 py-2.5 font-medium text-white/85 hover:text-white">
                {c.label}
              </Link>
            ))}
            <span className="mx-2 my-2.5 w-px bg-white/15" />
            {/* usePathname is runtime data: stream the highlighted nav, render a plain one in the static shell. */}
            <Suspense fallback={<ToolLinks pathname={null} />}>
              <ActiveToolLinks />
            </Suspense>
          </div>
        </nav>
      </header>

      {validity?.valid === false && (
        <div className="bg-rose-600 px-5 py-2 text-center text-sm text-white">
          ⚠️ Chain integrity broken at block #{validity.firstBad}. Honest nodes would reject this chain.{" "}
          <Link href="/explorer" className="font-semibold underline">
            Inspect →
          </Link>
        </div>
      )}

      <main className="flex-1">
        {!ready && <Loading />}
        <div hidden={!ready}>{children}</div>
      </main>

      <footer className="bg-[#140a2c] text-white/70">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 text-sm md:grid-cols-3">
          <div>
            <div className="text-lg font-extrabold text-white">
              stage<span className="text-fuchsia-400">chain</span>
            </div>
            <p className="mt-2 text-xs">
              A student case-study project showing blockchain ticketing for the entertainment industry. Simulated in-browser chain with SHA-256
              proof-of-work. No real money or real tickets are involved.
            </p>
          </div>
          <div className="text-xs">
            <div className="mb-2 font-semibold text-white">Data &amp; privacy</div>
            <p>
              Blockchain data (wallets, tickets, blocks) is stored only in your browser&apos;s localStorage. Organizer searches are sent through
              our server to the Ticketmaster Discovery API and cached briefly. No personal data is collected.
            </p>
          </div>
          <div className="text-xs">
            <div className="mb-2 font-semibold text-white">Attribution</div>
            <p>
              Imported event information and images are provided by the Ticketmaster Discovery API and belong to Ticketmaster and/or the event
              organizers. StageChain is not affiliated with or endorsed by Ticketmaster.
            </p>
          </div>
        </div>
      </footer>

      <div className="fixed bottom-4 right-4 z-30 flex w-80 flex-col gap-2">
        {toasts.map((t) => (
          <button
            key={t.id}
            onClick={() => dismiss(t.id)}
            className={`rounded-lg border-l-4 bg-white p-3 text-left text-sm text-zinc-900 shadow-xl ring-1 ring-zinc-200 ${
              t.kind === "error" ? "border-rose-500" : t.kind === "success" ? "border-emerald-500" : "border-violet-500"
            }`}
          >
            <div className="font-semibold">{t.title}</div>
            {t.detail && <div className="mt-0.5 break-words text-xs text-zinc-600">{t.detail}</div>}
          </button>
        ))}
      </div>
    </div>
  );
}

function ActiveToolLinks() {
  return <ToolLinks pathname={usePathname()} />;
}

function ToolLinks({ pathname }: { pathname: string | null }) {
  return TOOL_LINKS.map((l) => (
    <Link
      key={l.href}
      href={l.href}
      className={`whitespace-nowrap border-b-2 px-3 py-2.5 ${
        pathname === l.href ? "border-fuchsia-400 text-white" : "border-transparent text-white/60 hover:text-white"
      }`}
    >
      {l.label}
    </Link>
  ));
}
