"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { ChainError } from "@/components/tickets/chain-error";
import { DIFFICULTY, editEventName, inspectChain, rehashTxs, remine, type BlockReport } from "@/lib/chain/blockchain";
import { getServerSnapshot, getSnapshot, subscribe } from "@/lib/chain/store";
import type { Block } from "@/lib/chain/types";

/** A simulated attack on a copy of the chain. It is never saved. */
type Attack = { target: number; chain: Block[]; step: number };

const STEPS = [
  { action: "Recalculate the transaction hash", result: "You changed the ticket. Its data no longer matches its hash or signature." },
  { action: "Re-mine this block", result: "The transaction hash matches again, but the block's own hash is now wrong." },
  { action: "Re-mine every later block", result: "This block has valid proof-of-work again. Any later block still points to the old hash." },
  { action: null, result: "All hashes, links and proof-of-work are valid again, but the signature is not. Only the owner's private key could sign this change." },
];

export function BlockExplorer() {
  const node = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (node.status === "loading") return <p className="text-lg text-zinc-600">Checking your blockchain…</p>;
  if (node.status === "error") {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-6">
        <ChainError message={node.message} />
      </div>
    );
  }
  return <Explorer saved={node.chain} />;
}

function Explorer({ saved }: { saved: Block[] }) {
  const [attack, setAttack] = useState<Attack | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState<{ chain: Block[]; reports: BlockReport[] } | null>(null);
  const [busy, setBusy] = useState(false);

  const chain = attack?.chain ?? saved;
  const index = Math.min(selected ?? chain.length - 1, chain.length - 1);

  useEffect(() => {
    let current = true;
    void inspectChain(chain).then(({ reports }) => {
      if (current) setChecked({ chain, reports });
    });
    return () => {
      current = false;
    };
  }, [chain]);

  // Never show results that belong to a different version of the chain.
  const reports = checked?.chain === chain ? checked.reports : null;
  const invalid = reports?.filter((r) => r.problems.length > 0) ?? [];

  async function nextStep() {
    if (!attack) return;
    const { target, step } = attack;
    setBusy(true);
    try {
      const next =
        step === 0
          ? await rehashTxs(attack.chain, target)
          : step === 1
            ? await remine(attack.chain, target, target)
            : await remine(attack.chain, target + 1, attack.chain.length - 1);
      setAttack({ target, chain: next, step: step + 1 });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div
        role="status"
        className={`rounded-lg border px-5 py-4 font-bold ${
          !reports ? "border-zinc-300 bg-white text-zinc-600" : invalid.length ? "border-red-300 bg-red-50 text-red-900" : "border-emerald-300 bg-emerald-50 text-emerald-900"
        }`}
      >
        {!reports
          ? "Checking every block…"
          : invalid.length
            ? `✗ Invalid: the network would reject this chain (problem in block ${invalid.map((r) => `#${r.index}`).join(", ")})`
            : `✓ Valid: all ${chain.length} ${chain.length === 1 ? "block" : "blocks"} check out`}
      </div>

      {attack && (
        <section className="rounded-lg border border-amber-300 bg-amber-50 p-5 text-amber-950">
          <h2 className="text-lg font-black">
            Simulated attack on block #{attack.target} · step {attack.step + 1} of {STEPS.length}
          </h2>
          <p className="mt-1">{STEPS[attack.step].result}</p>
          <p className="mt-1 text-sm">This is a copy. Your real tickets are safe.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {STEPS[attack.step].action && (
              <button disabled={busy} onClick={() => void nextStep()} className="rounded-md bg-red-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                {busy ? "Working…" : `Attacker: ${STEPS[attack.step].action}`}
              </button>
            )}
            <button disabled={busy} onClick={() => setAttack(null)} className="rounded-md border border-amber-400 bg-white px-4 py-2 text-sm font-bold disabled:opacity-50">
              Stop and restore real chain
            </button>
          </div>
        </section>
      )}

      <ol className="flex gap-3 overflow-x-auto p-1" aria-label="Blocks">
        {chain.map((b, i) => {
          const bad = (reports?.[i]?.problems.length ?? 0) > 0;
          return (
            <li key={i}>
              <button
                onClick={() => setSelected(i)}
                aria-pressed={i === index}
                className={`w-44 rounded-lg border p-4 text-left text-sm ${bad ? "border-red-400 bg-red-50" : "border-zinc-200 bg-white"} ${
                  i === index ? "ring-2 ring-[#024bde]" : ""
                }`}
              >
                <span className="flex justify-between font-bold">
                  <span>Block #{i}</span>
                  <span>{reports ? (bad ? "✗" : "✓") : "…"}</span>
                </span>
                <span className="mt-1 block text-zinc-600">{i === 0 ? "Genesis" : `${b.txs.length} ${b.txs.length === 1 ? "ticket" : "tickets"}`}</span>
                <code className="mt-1 block truncate font-mono text-xs text-zinc-500">{b.hash}</code>
              </button>
            </li>
          );
        })}
      </ol>

      <BlockDetail
        key={`${index}-${attack ? "attack" : "real"}`}
        block={chain[index]}
        problems={reports?.[index]?.problems ?? []}
        onAttack={
          attack || chain[index].txs.length === 0 ? null : (name) => setAttack({ target: index, chain: editEventName(saved, index, name), step: 0 })
        }
      />

      {chain.length === 1 && (
        <p className="text-zinc-600">
          Only the first (genesis) block exists.{" "}
          <Link href="/discover/concerts" className="font-bold text-[#024bde] underline">
            Get a demo ticket
          </Link>{" "}
          to add a block you can try to tamper with.
        </p>
      )}
    </div>
  );
}

function BlockDetail({ block, problems, onAttack }: { block: Block; problems: string[]; onAttack: ((name: string) => void) | null }) {
  const original = block.txs[0]?.body.event.name ?? "";
  const [name, setName] = useState(`${original} (VIP)`);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-200">
        <h2 className="mb-4 text-xl font-black">Block #{block.index}</h2>
        <dl className="space-y-3 text-sm">
          <Row label="Mined">{new Date(block.timestamp).toLocaleString()}</Row>
          <Row label="Previous hash" mono>
            {block.prevHash}
          </Row>
          <Row label="Nonce (proof-of-work attempts)" mono>
            {block.nonce}
          </Row>
          <Row label={`Hash (must start with ${DIFFICULTY} zeros)`} mono>
            {block.hash}
          </Row>
        </dl>
        {problems.length > 0 && (
          <ul className="mt-5 list-disc space-y-1 rounded-md bg-red-50 p-4 pl-8 text-sm font-bold text-red-900">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-200">
        <h2 className="mb-4 text-xl font-black">Transactions</h2>
        {block.txs.length === 0 && <p className="text-zinc-600">The genesis block has no transactions. It only starts the chain.</p>}
        {block.txs.map((tx) => (
          <dl key={tx.signature} className="space-y-3 text-sm">
            <Row label="Ticket for">{tx.body.event.name}</Row>
            <Row label="Event date">{tx.body.event.date ?? "TBA"}</Row>
            <Row label="Owner" mono>
              {tx.body.from}
            </Row>
            <Row label="Transaction hash" mono>
              {tx.hash}
            </Row>
            <Row label="Signature" mono>
              {tx.signature}
            </Row>
          </dl>
        ))}
        {onAttack && (
          <form
            className="mt-5 border-t border-zinc-200 pt-5"
            onSubmit={(e) => {
              e.preventDefault();
              onAttack(name);
            }}
          >
            <label className="block text-sm font-bold" htmlFor="fake-name">
              Try to change this ticket
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="fake-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="min-w-0 flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
              <button disabled={name === original} className="rounded-md bg-red-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                Tamper
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

function Row({ label, mono = false, children }: { label: string; mono?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-zinc-500">{label}</dt>
      <dd className={mono ? "font-mono text-xs break-all" : "font-bold"}>{children}</dd>
    </div>
  );
}
