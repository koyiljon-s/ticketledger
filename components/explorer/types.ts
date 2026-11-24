import type { BlockReport } from "@/lib/chain/blockchain";
import type { Block } from "@/lib/chain/types";
import type { EventPhoto } from "@/lib/event-images";
import { sectionOfId } from "@/lib/sections";
import type { HashColors } from "./hash";
import type { Health } from "./icons";

/** A simulated attack on a copy of the chain. It is never saved. */
export type Attack = { target: number; chain: Block[]; stage: 0 | 1 | 2 | 3; from: string; to: string };

/** Everything the map and the panel need to draw the current chain. */
export type ChainView = {
  chain: Block[];
  reports: BlockReport[] | null;
  colors: HashColors;
  photos: Record<string, EventPhoto | undefined>;
  attack: Attack | null;
};

export function healthOf(view: ChainView, index: number): Health {
  if (!view.reports) return "checking";
  return view.reports[index]?.problems.length ? "bad" : "good";
}

/** The event shown for a block, in the form EventImage needs. Null for the genesis block. */
export function artOf(block: Block, photos: ChainView["photos"]) {
  const event = block.txs[0]?.body.event;
  return event ? { id: event.id, name: event.name, section: sectionOfId(event.id), image: photos[event.id]?.src ?? null } : null;
}

export const titleOf = (block: Block) => block.txs[0]?.body.event.name ?? "Genesis block";
