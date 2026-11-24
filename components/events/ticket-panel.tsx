"use client";

import { useState, useSyncExternalStore } from "react";
import { balanceOf, MAX_PER_WALLET, SUPPLY_PER_EVENT, TICKET_PRICE } from "@/lib/chain/contract";
import { getServerSnapshot, getSnapshot, mintTicket, resetChain, subscribe } from "@/lib/chain/store";
import type { MintBody } from "@/lib/chain/types";

const short = (s: string) => `${s.slice(0, 10)}…${s.slice(-6)}`;

export function TicketPanel({ event, cancelled }: { event: MintBody["event"]; cancelled: boolean }) {
  const node = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [mining, setMining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buy() {
    setMining(true);
    setError(null);
    try {
      await mintTicket(event);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setMining(false);
    }
  }

  if (node.status === "loading") return <Panel>Starting the demo blockchain…</Panel>;

  if (node.status === "error") {
    return (
      <Panel>
        <p role="alert" className="font-bold text-red-700">
          {node.message}
        </p>
        <button
          className="mt-4 rounded-md border border-zinc-300 px-4 py-2 text-sm font-bold"
          onClick={() => {
            if (confirm("Start a new demo blockchain? All demo tickets in this browser will be lost.")) void resetChain();
          }}
        >
          Reset demo blockchain
        </button>
      </Panel>
    );
  }

  const { state, wallet, chain } = node;
  const sold = state.tickets.filter((t) => t.event.id === event.id);
  const mine = sold.filter((t) => t.owner === wallet.address);
  const balance = balanceOf(state, wallet.address);
  const blocked = cancelled
    ? "This event was cancelled."
    : sold.length >= SUPPLY_PER_EVENT
      ? "Sold out."
      : mine.length >= MAX_PER_WALLET
        ? `You have the maximum of ${MAX_PER_WALLET} tickets.`
        : balance < TICKET_PRICE
          ? "You don't have enough TIX."
          : null;

  return (
    <Panel>
      <div className="flex items-baseline justify-between">
        <span className="text-3xl font-black">{TICKET_PRICE} TIX</span>
        <span className="text-sm text-zinc-600">
          {SUPPLY_PER_EVENT - sold.length} of {SUPPLY_PER_EVENT} left
        </span>
      </div>

      <button
        onClick={() => void buy()}
        disabled={mining || blocked !== null}
        className="mt-4 w-full rounded-md bg-[#024bde] px-5 py-3 font-bold text-white transition hover:bg-[#0139a8] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {mining ? "Mining block…" : "Get demo ticket"}
      </button>
      <p role="status" className="mt-2 text-sm text-zinc-600">
        {blocked}
      </p>
      {error && (
        <p role="alert" className="mt-2 text-sm font-bold text-red-700">
          {error}
        </p>
      )}

      <dl className="mt-4 space-y-1 border-t border-zinc-200 pt-4 text-sm">
        <Line label="Your wallet" value={short(wallet.address)} title={wallet.address} />
        <Line label="Balance" value={`${balance} TIX`} />
        <Line label="Latest block" value={`#${chain.length - 1}`} />
      </dl>

      {mine.length > 0 && (
        <div className="mt-4 border-t border-zinc-200 pt-4">
          <h3 className="font-bold">Your tickets</h3>
          <ul className="mt-2 space-y-2">
            {mine.map((t) => (
              <li key={t.id} className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-950">
                <div className="font-bold">
                  Ticket #{t.serial} · block #{t.blockIndex}
                </div>
                <code className="font-mono text-xs" title={t.txHash}>
                  tx {short(t.txHash)}
                </code>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-lg bg-white p-6 text-[#121212] shadow-sm ring-1 ring-zinc-200">
      <h2 className="mb-3 text-xl font-black">Demo ticket</h2>
      {children}
      <p className="mt-4 border-t border-zinc-200 pt-4 text-sm text-zinc-500">
        Not a real ticket: it gives no entry to this event. TIX has no value, and the blockchain exists only in this browser.
      </p>
    </section>
  );
}

function Line({ label, value, title }: { label: string; value: string; title?: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-mono" title={title}>
        {value}
      </dd>
    </div>
  );
}
