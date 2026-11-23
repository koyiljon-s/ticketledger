"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ACCOUNTS } from "@/lib/chain/accounts";
import type { Address } from "@/lib/chain/types";
import { useChain } from "./chain-provider";
import { Loading } from "./ui";

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/events", label: "Events" },
  { href: "/marketplace", label: "Resale Market" },
  { href: "/wallet", label: "My Tickets" },
  { href: "/gate", label: "Gate Check-in" },
  { href: "/explorer", label: "Block Explorer" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { ready, account, setAccount, pendingState, chain, mempool, mining, toasts, dismiss, validity } = useChain();
  const pathname = usePathname();
  const me = ACCOUNTS.find((a) => a.address === account)!;

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-violet-600">🎟️</span>
            Stage<span className="text-fuchsia-400">Chain</span>
          </Link>
          <nav className="flex flex-wrap gap-1 text-sm">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-md px-3 py-1.5 transition ${
                  pathname === l.href ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <Link href="/explorer" className="hidden items-center gap-2 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-zinc-400 md:flex">
              <span className={`h-2 w-2 rounded-full ${validity?.valid === false ? "bg-rose-500" : "bg-emerald-400"}`} />
              Block #{chain.length ? chain[chain.length - 1].index : "—"}
              {mempool.length > 0 && <span className="text-amber-300">· {mempool.length} pending</span>}
              {mining.active && <span className="animate-pulse text-fuchsia-300">· ⛏️ mining</span>}
            </Link>
            <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1">
              <span className="text-lg">{me.emoji}</span>
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value as Address)}
                className="bg-transparent text-sm outline-none"
                aria-label="Active wallet"
              >
                {ACCOUNTS.map((a) => (
                  <option key={a.address} value={a.address} className="bg-zinc-900">
                    {a.name}
                  </option>
                ))}
              </select>
              <span className="border-l border-white/10 pl-2 font-semibold tabular-nums">
                {(pendingState.balances[account] ?? 0).toLocaleString()} <span className="text-xs text-zinc-400">TIX</span>
              </span>
            </label>
          </div>
        </div>
      </header>

      {validity?.valid === false && (
        <div className="border-b border-rose-500/30 bg-rose-500/10 px-5 py-2 text-center text-sm text-rose-200">
          ⚠️ Chain integrity broken at block #{validity.firstBad}. Honest nodes would reject this chain.{" "}
          <Link href="/explorer" className="underline">
            Inspect in explorer →
          </Link>
        </div>
      )}

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-10">
        {!ready && <Loading />}
        <div hidden={!ready}>{children}</div>
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-zinc-500">
        StageChain — educational blockchain demo. Simulated in-browser chain with SHA-256 proof-of-work. No real money involved.
      </footer>

      <div className="fixed bottom-4 right-4 z-30 flex w-80 flex-col gap-2">
        {toasts.map((t) => (
          <button
            key={t.id}
            onClick={() => dismiss(t.id)}
            className={`rounded-xl border p-3 text-left text-sm shadow-xl backdrop-blur ${
              t.kind === "error"
                ? "border-rose-500/40 bg-rose-950/90"
                : t.kind === "success"
                  ? "border-emerald-500/40 bg-emerald-950/90"
                  : "border-violet-500/40 bg-zinc-900/95"
            }`}
          >
            <div className="font-medium">{t.title}</div>
            {t.detail && <div className="mt-0.5 break-words text-xs text-zinc-300">{t.detail}</div>}
          </button>
        ))}
      </div>
    </div>
  );
}
