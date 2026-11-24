"use client";

import { useState } from "react";
import { HealthIcon } from "./icons";
import { ActionBar, ActionButton, PanelHeader } from "./panel";
import { healthOf, titleOf, type Attack, type ChainView } from "./types";

const STAGES = [
  { title: "Change the ticket", result: "The ticket's data no longer matches its hash or its signature." },
  { title: "Fix the transaction hash", result: "Anyone can recalculate that hash, so it matches again. But it is part of the block, so the block's own hash is now wrong." },
  { title: "Re-mine this block", result: "The block has a new, valid hash. The next block still points to the old one, so the link is broken." },
  { title: "Re-mine every later block", result: "Every hash, link and proof-of-work is valid again." },
];

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="px-5 pb-4">
      <p className="mb-2 text-sm text-zinc-600">
        Step {step} of {STAGES.length}
      </p>
      <div aria-hidden className="flex gap-1.5">
        {STAGES.map((s, i) => (
          <span key={s.title} className={`h-1.5 flex-1 rounded-full ${i < step ? "bg-[#024bde]" : "bg-zinc-200"}`} />
        ))}
      </div>
    </div>
  );
}

/** Panel view 3: choose what to forge. */
export function AttackStart({ view, index, onBack, onStart }: { view: ChainView; index: number; onBack: () => void; onStart: (name: string) => void }) {
  const original = titleOf(view.chain[index]);
  const [name, setName] = useState(`${original} (VIP)`);
  const value = name.trim();
  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        onStart(value);
      }}
    >
      <PanelHeader title="Tamper with a ticket" back={{ label: `Back to block ${index}`, onClick: onBack }} focus />
      <ProgressBar step={1} />
      <div className="flex-1 overflow-y-auto border-t border-zinc-200 px-5 py-6">
        <p>You are the attacker. Rewrite the ticket in block {index}, then try to hide it from the checks.</p>
        <dl className="mt-6">
          <dt className="text-sm text-zinc-600">Real event</dt>
          <dd className="text-lg font-bold">{original}</dd>
        </dl>
        <label htmlFor="forged-name" className="mt-6 block text-sm text-zinc-600">
          Forged event
        </label>
        <input
          id="forged-name"
          value={name}
          maxLength={150}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded border border-zinc-400 px-3 py-3 outline-none focus:border-[#024bde] focus:ring-1 focus:ring-[#024bde]"
        />
      </div>
      <ActionBar>
        <ActionButton type="submit" variant="danger" disabled={!value || value === original}>
          Change the ticket
        </ActionButton>
        <p className="text-center text-sm text-zinc-600">On a copy. Your real tickets stay safe.</p>
      </ActionBar>
    </form>
  );
}

type ProgressProps = { view: ChainView; attack: Attack; busy: boolean; error: string | null; onNext: () => void; onStop: () => void; onInspect: (index: number) => void };

/** Panel view 4: the attack, step by step. */
export function AttackProgress({ view, attack, busy, error, onNext, onStop, onInspect }: ProgressProps) {
  const isLastBlock = attack.target === attack.chain.length - 1;
  const done = attack.stage === 3;
  const result =
    attack.stage === 2 && isLastBlock ? "The block has a new, valid hash. It is the last block, so there is no later link to break." : STAGES[attack.stage].result;
  const problems = (view.reports ?? []).flatMap((r) => r.problems.map((p) => ({ ...p, index: r.index })));
  const title = attack.stage === 3 && isLastBlock ? "No later blocks to re-mine" : STAGES[attack.stage].title;
  const nextLabel = done ? null : attack.stage === 2 && isLastBlock ? "Finish the attack" : STAGES[attack.stage + 1].title;

  return (
    <>
      <PanelHeader title={done ? "Attack failed" : title} focus />
      <ProgressBar step={attack.stage + 1} />
      <div className="flex-1 overflow-y-auto border-t border-zinc-200">
        <div role="status" className="px-5 py-5">
          <p>{result}</p>
          {done && (
            <p className="mt-3 text-lg font-black leading-snug">
              The signature is still invalid. Only the owner&apos;s private key could sign this change, and the attacker doesn&apos;t have it.
            </p>
          )}
        </div>

        <dl className="border-y border-zinc-200 bg-zinc-50 px-5 py-4">
          <dt className="text-sm text-zinc-600">Block {attack.target}, real event</dt>
          <dd className="text-zinc-500 line-through">{attack.from}</dd>
          <dt className="mt-2 text-sm text-zinc-600">Forged event</dt>
          <dd className="font-bold">{attack.to}</dd>
        </dl>

        <section className="px-5 py-5">
          <h3 className="text-base font-black">{!view.reports ? "Checking…" : `The chain caught ${problems.length} ${problems.length === 1 ? "problem" : "problems"}`}</h3>
          <ul className="mt-2 divide-y divide-zinc-200">
            {problems.map((p) => (
              <li key={`${p.index}-${p.message}`}>
                <button type="button" onClick={() => onInspect(p.index)} className="flex w-full gap-3 py-3 text-left hover:bg-zinc-50">
                  <HealthIcon state={healthOf(view, p.index)} className="mt-0.5 h-5 w-5" />
                  <span>
                    <span className="block font-bold">Block {p.index}</span>
                    <span className="block text-sm text-[#b01c30]">{p.message}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        {error && (
          <p role="alert" className="px-5 pb-5 font-bold text-[#b01c30]">
            {error}
          </p>
        )}
      </div>
      <ActionBar>
        {nextLabel ? (
          <>
            <ActionButton variant="danger" disabled={busy} onClick={onNext}>
              {busy ? "Working…" : `Next: ${nextLabel}`}
            </ActionButton>
            <ActionButton variant="quiet" disabled={busy} onClick={onStop}>
              Stop and restore the real chain
            </ActionButton>
          </>
        ) : (
          <ActionButton onClick={onStop}>Restore the real chain</ActionButton>
        )}
      </ActionBar>
    </>
  );
}
