"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ChainError } from "@/components/tickets/chain-error";
import { DIFFICULTY, editEventName, inspectChain, rehashTxs, remine, type BlockReport } from "@/lib/chain/blockchain";
import { getServerSnapshot, getSnapshot, subscribe } from "@/lib/chain/store";
import type { Block } from "@/lib/chain/types";
import { BlockDetail } from "./block-detail";
import { ChainStrip } from "./chain-strip";
import { assignColors } from "./hash";
import { TamperLab, type Attack } from "./tamper-lab";

export function BlockExplorer() {
  const node = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (node.status === "loading") {
    return (
      <div role="status" className="rounded-lg bg-white p-10 text-center text-lg text-zinc-600 shadow-sm ring-1 ring-zinc-200">
        Checking your blockchain…
      </div>
    );
  }
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
  const [error, setError] = useState<string | null>(null);

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
  // Real hashes come first, so their colours stay the same during an attack.
  const colors = assignColors([...saved, ...chain].map((b) => b.hash));
  const tickets = chain.reduce((n, b) => n + b.txs.length, 0);
  const firstTicket = saved.findIndex((b) => b.txs.length > 0);

  function start(name: string) {
    setError(null);
    setSelected(index);
    setAttack({ target: index, chain: editEventName(saved, index, name), stage: "edited", from: saved[index].txs[0].body.event.name, to: name });
  }

  async function next() {
    if (!attack) return;
    const { target, stage, chain: copy } = attack;
    setBusy(true);
    setError(null);
    try {
      if (stage === "edited") setAttack({ ...attack, chain: await rehashTxs(copy, target), stage: "rehashed" });
      else if (stage === "rehashed") setAttack({ ...attack, chain: await remine(copy, target, target), stage: "remined" });
      else setAttack({ ...attack, chain: await remine(copy, target + 1, copy.length - 1), stage: "finished" });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <Verdict total={chain.length} invalid={reports && invalid.map((r) => r.index)} simulated={attack !== null} />
        <dl className="grid grid-cols-3 gap-4">
          <Stat label="Blocks" value={chain.length} />
          <Stat label="Tickets" value={tickets} />
          <Stat label="Zeros needed" value={DIFFICULTY} />
        </dl>
      </div>

      <section aria-labelledby="chain-title">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="chain-title" className="text-2xl font-black">
            {attack ? "The attacked copy" : "The chain"}
          </h2>
          <p className="text-sm text-zinc-600">Same color = same hash. Each block&apos;s “previous” should match the block before it.</p>
        </div>
        <ChainStrip chain={chain} reports={reports} colors={colors} selected={index} target={attack?.target ?? null} onSelect={setSelected} />
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_24rem]">
        <BlockDetail block={chain[index]} report={reports?.[index] ?? null} colors={colors} />
        <TamperLab
          attack={attack}
          block={saved[index]?.txs.length ? saved[index] : null}
          suggestion={firstTicket === -1 ? null : firstTicket}
          busy={busy}
          error={error}
          onSelect={setSelected}
          onStart={start}
          onNext={() => void next()}
          onStop={() => {
            setError(null);
            setAttack(null);
          }}
        />
      </div>

      <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-200">
        <h2 className="text-xl font-black">Words on this page</h2>
        <dl className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <Term word="Block">A page in the record book. Here, each one after the first holds one ticket.</Term>
          <Term word="Hash">A fingerprint of data. Change anything and the fingerprint changes completely.</Term>
          <Term word="Proof-of-work">Trying numbers until the hash starts with {DIFFICULTY} zeros. Rewriting history means redoing it.</Term>
          <Term word="Signature">Proof that the owner approved the data. Only their private key can create it.</Term>
        </dl>
        <p className="mt-5 text-sm text-zinc-500">
          This chain lives in one browser. On a real blockchain, many independent computers keep copies and would reject the attacker&apos;s version.
        </p>
      </section>
    </div>
  );
}

function Verdict({ total, invalid, simulated }: { total: number; invalid: number[] | null; simulated: boolean }) {
  const state = !invalid ? "checking" : invalid.length ? "bad" : "good";
  const style = {
    checking: "border-zinc-300 bg-white text-zinc-700",
    good: "border-emerald-300 bg-emerald-50 text-emerald-950",
    bad: "border-red-300 bg-red-50 text-red-950",
  }[state];
  return (
    <div role="status" className={`flex items-center gap-4 rounded-lg border-2 p-5 ${style}`}>
      <span
        aria-hidden
        className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-2xl font-black text-white ${{ checking: "bg-zinc-400", good: "bg-emerald-600", bad: "bg-red-600" }[state]}`}
      >
        {{ checking: "…", good: "✓", bad: "✗" }[state]}
      </span>
      <div>
        <p className="text-xl font-black">
          {{ checking: "Checking every block…", good: "This chain is valid", bad: simulated ? "Tampering detected" : "This chain is invalid" }[state]}
        </p>
        <p>
          {!invalid
            ? "Recalculating hashes and signatures."
            : invalid.length
              ? `Problem in ${invalid.length === 1 ? "block" : "blocks"} ${invalid.map((i) => `#${i}`).join(", ")}. This copy would be rejected.`
              : `${total === 1 ? "The only block passes" : `All ${total} blocks pass`} every check.`}
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col justify-center rounded-lg bg-white p-4 text-center shadow-sm ring-1 ring-zinc-200 lg:min-w-28">
      <dt className="text-sm text-zinc-500">{label}</dt>
      <dd className="text-2xl font-black">{value}</dd>
    </div>
  );
}

function Term({ word, children }: { word: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-bold">{word}</dt>
      <dd className="mt-1 text-sm text-zinc-600">{children}</dd>
    </div>
  );
}
