"use client";

import { Fragment, useEffect, useRef } from "react";
import type { BlockReport } from "@/lib/chain/blockchain";
import type { Block } from "@/lib/chain/types";
import { HashChip, type HashColors } from "./hash";

type Props = {
  chain: Block[];
  reports: BlockReport[] | null;
  colors: HashColors;
  selected: number;
  target: number | null;
  onSelect: (index: number) => void;
};

/** The chain as a row of cards. Connectors show whether each block points to the one before it. */
export function ChainStrip({ chain, reports, colors, selected, target, onSelect }: Props) {
  const list = useRef<HTMLOListElement>(null);

  // Bring the selected card into view by scrolling the row only, never the page.
  useEffect(() => {
    const row = list.current;
    const card = row?.querySelector<HTMLElement>(`[data-block="${selected}"]`);
    if (row && card) row.scrollLeft = card.offsetLeft - (row.clientWidth - card.clientWidth) / 2;
  }, [selected, chain.length]);

  return (
    <ol ref={list} aria-label="Blocks, oldest first" className="relative flex items-stretch overflow-x-auto p-1 pb-4">
      {chain.map((b, i) => {
        const bad = (reports?.[i]?.problems.length ?? 0) > 0;
        const linked = i === 0 || b.prevHash === chain[i - 1].hash;
        return (
          <Fragment key={i}>
            {i > 0 && (
              <li aria-hidden className={`flex w-14 shrink-0 flex-col items-center justify-center text-xs font-bold ${linked ? "text-emerald-700" : "text-red-700"}`}>
                <span>{linked ? "linked" : "broken"}</span>
                <span className={`mt-1 w-full border-t-4 ${linked ? "border-emerald-500" : "border-dashed border-red-500"}`} />
              </li>
            )}
            <li data-block={i} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelect(i)}
                aria-pressed={i === selected}
                className={`flex h-full w-56 flex-col items-stretch justify-start rounded-lg border-2 p-4 text-left transition hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#024bde] ${
                  bad ? "bg-red-50" : "bg-white"
                } ${i === selected ? "border-[#024bde] shadow-md" : bad ? "border-red-300" : "border-zinc-200"}`}
              >
                <span className="flex items-center justify-between">
                  <span className="text-lg font-black">Block #{i}</span>
                  <StatusDot state={!reports ? "checking" : bad ? "bad" : "good"} />
                </span>
                <span className="mt-1 line-clamp-2 block h-10 text-sm leading-5 text-zinc-600">
                  {i === 0 ? "Genesis: starts the chain" : (b.txs[0]?.body.event.name ?? "No tickets")}
                </span>
                <span className="mt-3 block space-y-1.5 border-t border-zinc-200 pt-3 text-xs text-zinc-500">
                  <span className="flex items-center justify-between">
                    previous <HashChip hash={b.prevHash} colors={colors} />
                  </span>
                  <span className="flex items-center justify-between">
                    this block <HashChip hash={b.hash} colors={colors} />
                  </span>
                </span>
                {i === target && <span className="mt-3 block rounded bg-amber-200 px-2 py-1 text-center text-xs font-bold text-amber-950">Under attack</span>}
              </button>
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}

function StatusDot({ state }: { state: "checking" | "good" | "bad" }) {
  const style = { checking: "bg-zinc-200 text-zinc-600", good: "bg-emerald-600 text-white", bad: "bg-red-600 text-white" }[state];
  return (
    <span className={`grid h-6 w-6 place-items-center rounded-full text-sm font-bold ${style}`}>
      <span aria-hidden>{{ checking: "…", good: "✓", bad: "✗" }[state]}</span>
      <span className="sr-only">{{ checking: "Checking", good: "Valid", bad: "Invalid" }[state]}</span>
    </span>
  );
}
