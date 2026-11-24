"use client";

import Link from "next/link";
import { useState } from "react";
import type { Block } from "@/lib/chain/types";

/** A simulated attack on a copy of the chain. It is never saved. */
export type Attack = { target: number; chain: Block[]; stage: Stage; from: string; to: string };
export type Stage = "edited" | "rehashed" | "remined" | "finished";

const STAGES: { id: Stage; title: string; result: string; next: string | null }[] = [
  {
    id: "edited",
    title: "Change the ticket",
    result: "The ticket's data no longer matches its hash or its signature.",
    next: "Fix the transaction hash",
  },
  {
    id: "rehashed",
    title: "Fix the transaction hash",
    result: "Anyone can recalculate that hash, so it matches again. But it is part of the block, so the block's own hash is now wrong.",
    next: "Re-mine this block",
  },
  {
    id: "remined",
    title: "Re-mine this block",
    result: "The block has a new, valid hash. The next block still points to the old one, so the link is broken.",
    next: "Re-mine every later block",
  },
  {
    id: "finished",
    title: "Re-mine every later block",
    result: "Every hash, link and proof-of-work is valid again.",
    next: null,
  },
];

type Props = {
  attack: Attack | null;
  /** The block to attack, or null if the selected one has no ticket. */
  block: Block | null;
  suggestion: number | null;
  busy: boolean;
  error: string | null;
  onSelect: (index: number) => void;
  onStart: (name: string) => void;
  onNext: () => void;
  onStop: () => void;
};

export function TamperLab(props: Props) {
  return (
    <section aria-label="Tamper lab" className="rounded-lg border-2 border-amber-300 bg-amber-50 p-6 text-amber-950">
      <h2 className="text-2xl font-black">Tamper lab</h2>
      {props.attack ? <Progress {...props} attack={props.attack} /> : <Start {...props} />}
      <p className="mt-5 border-t border-amber-300 pt-4 text-sm">Safe to try: you attack a copy that is never saved. Your real tickets don&apos;t change.</p>
    </section>
  );
}

function Start({ block, suggestion, onSelect, onStart }: Props) {
  const tx = block?.txs[0];
  if (!block || !tx) {
    return (
      <>
        <p className="mt-2">{suggestion === null ? "You need a ticket on the chain before you can attack one." : "This block has no ticket to attack."}</p>
        {suggestion === null ? (
          <Link href="/discover/concerts" className="mt-4 inline-block rounded-md bg-[#024bde] px-4 py-2 font-bold text-white hover:bg-[#0139a8]">
            Get a demo ticket
          </Link>
        ) : (
          <button type="button" onClick={() => onSelect(suggestion)} className="mt-4 rounded-md bg-[#024bde] px-4 py-2 font-bold text-white hover:bg-[#0139a8]">
            Choose block #{suggestion}
          </button>
        )}
      </>
    );
  }
  return <StartForm key={block.hash} index={block.index} original={tx.body.event.name} onStart={onStart} />;
}

function StartForm({ index, original, onStart }: { index: number; original: string; onStart: (name: string) => void }) {
  const [name, setName] = useState(`${original} (VIP)`);
  return (
    <form
      className="mt-2"
      onSubmit={(e) => {
        e.preventDefault();
        onStart(name.trim());
      }}
    >
      <p>Play the attacker: rewrite the ticket in block #{index}, then try to hide it.</p>
      <label htmlFor="fake-name" className="mt-4 block text-sm font-bold">
        Change the event to
      </label>
      <input
        id="fake-name"
        value={name}
        maxLength={150}
        onChange={(e) => setName(e.target.value)}
        className="mt-1 w-full rounded-md border border-amber-400 bg-white px-3 py-2"
      />
      <button
        disabled={!name.trim() || name.trim() === original}
        className="mt-3 w-full rounded-md bg-red-700 px-4 py-3 font-bold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Start the attack
      </button>
    </form>
  );
}

function Progress({ attack, busy, error, onNext, onStop }: Props & { attack: Attack }) {
  const current = STAGES.findIndex((s) => s.id === attack.stage);
  const isLastBlock = attack.target === attack.chain.length - 1;
  const stage = STAGES[current];
  const result =
    attack.stage === "remined" && isLastBlock ? "The block has a new, valid hash. It is the last block, so there is no later link to break." : stage.result;
  const next = attack.stage === "remined" && isLastBlock ? "Finish the attack" : stage.next;

  return (
    <>
      <p className="mt-2 text-sm">
        Block #{attack.target}: <del>{attack.from}</del> → <ins className="font-bold no-underline">{attack.to}</ins>
      </p>

      <ol className="mt-4 space-y-2">
        {STAGES.map((s, i) => {
          const skipped = s.id === "finished" && isLastBlock;
          const done = i <= current;
          return (
            <li key={s.id} aria-current={i === current ? "step" : undefined} className={`flex items-center gap-3 ${done ? "font-bold" : "opacity-60"}`}>
              <span aria-hidden className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold ${done ? "bg-amber-900 text-white" : "border-2 border-amber-900"}`}>
                {done ? "✓" : i + 1}
              </span>
              {skipped ? "No later blocks to re-mine" : s.title}
            </li>
          );
        })}
      </ol>

      <div role="status" className="mt-4 rounded-md bg-white p-4">
        <p>{result}</p>
        {attack.stage === "finished" && (
          <p className="mt-2 font-bold text-red-800">
            Attack failed: the signature is still invalid. It can only be made with the owner&apos;s private key, which the attacker doesn&apos;t have.
          </p>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-3 font-bold text-red-800">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {next && (
          <button
            type="button"
            disabled={busy}
            onClick={onNext}
            className="rounded-md bg-red-700 px-4 py-3 font-bold text-white transition hover:bg-red-800 disabled:cursor-wait disabled:opacity-60"
          >
            {busy ? "Working…" : `Next: ${next}`}
          </button>
        )}
        <button type="button" disabled={busy} onClick={onStop} className="rounded-md border border-amber-500 bg-white px-4 py-3 font-bold hover:bg-amber-100 disabled:opacity-60">
          {next ? "Stop and restore the real chain" : "Restore the real chain"}
        </button>
      </div>
    </>
  );
}
