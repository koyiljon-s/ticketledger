/**
 * The "smart contract".
 *
 * `applyTx` is a pure state-transition function: (state, tx) -> new state.
 * Every node replays every transaction in every block through this function
 * and therefore arrives at the exact same world state. If a rule is broken the
 * function throws a `Revert` and the transaction is rejected — exactly like a
 * `require(...)` failing in a Solidity contract (see contracts/StageTicket.sol).
 */
import { ORGANIZER } from "./accounts";
import type { Address, Tx, WorldState } from "./types";

export class Revert extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Revert";
  }
}

function require(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Revert(message);
}

export const emptyState = (): WorldState => ({
  balances: {},
  events: {},
  tickets: {},
  eventCount: 0,
});

export type TxContext = { block: number | null };

function credit(s: WorldState, who: Address, amount: number) {
  s.balances[who] = (s.balances[who] ?? 0) + amount;
}

function debit(s: WorldState, who: Address, amount: number) {
  const bal = s.balances[who] ?? 0;
  require(bal >= amount, `Insufficient balance: has ${bal} TIX, needs ${amount} TIX`);
  s.balances[who] = bal - amount;
}

export function maxResalePrice(face: number, maxMarkupBps: number) {
  return Math.floor((face * (10_000 + maxMarkupBps)) / 10_000);
}

export function applyTx(state: WorldState, tx: Tx, ctx: TxContext): WorldState {
  const s = structuredClone(state);
  const now = tx.timestamp;

  switch (tx.type) {
    case "ALLOC": {
      // Only allowed in the genesis block (initial token distribution).
      require(ctx.block === 0, "ALLOC is only allowed in the genesis block");
      credit(s, tx.payload.to, tx.payload.amount);
      return s;
    }

    case "CREATE_EVENT": {
      const p = tx.payload;
      require(tx.from === ORGANIZER, "Only a verified organizer can create events");
      require(p.name.trim().length > 0, "Event name is required");
      require(Number.isInteger(p.price) && p.price > 0, "Price must be a positive integer");
      require(Number.isInteger(p.supply) && p.supply > 0 && p.supply <= 500, "Supply must be 1–500");
      require(p.royaltyBps >= 0 && p.royaltyBps <= 2_500, "Royalty must be 0–25%");
      require(p.maxMarkupBps >= 0 && p.maxMarkupBps <= 10_000, "Max markup must be 0–100%");
      if (p.source) {
        const dup = Object.values(s.events).find((e) => e.source?.provider === p.source!.provider && e.source.id === p.source!.id);
        require(!dup, `This ${p.source.provider} event was already imported as ${dup?.id}`);
      }
      s.eventCount += 1;
      const id = `EVT-${s.eventCount}`;
      s.events[id] = {
        id,
        organizer: tx.from,
        ...p,
        name: p.name.trim(),
        sold: 0,
        royaltiesEarned: 0,
        primaryRevenue: 0,
      };
      return s;
    }

    case "BUY_TICKET": {
      const ev = s.events[tx.payload.eventId];
      require(ev, "Event does not exist");
      require(ev.sold < ev.supply, "Sold out");
      debit(s, tx.from, ev.price);
      credit(s, ev.organizer, ev.price);
      ev.sold += 1;
      ev.primaryRevenue += ev.price;
      const id = `${ev.id}#${ev.sold}`;
      s.tickets[id] = {
        id,
        eventId: ev.id,
        serial: ev.sold,
        owner: tx.from,
        usedAt: null,
        listing: null,
        history: [
          { txHash: tx.hash, type: "MINT", from: null, to: tx.from, price: ev.price, royalty: 0, timestamp: now, block: ctx.block },
        ],
      };
      return s;
    }

    case "LIST_TICKET": {
      const t = s.tickets[tx.payload.ticketId];
      require(t, "Ticket does not exist");
      require(t.owner === tx.from, "Only the ticket owner can list it");
      require(t.usedAt === null, "Ticket has already been used");
      const ev = s.events[t.eventId];
      const cap = maxResalePrice(ev.price, ev.maxMarkupBps);
      require(Number.isInteger(tx.payload.price) && tx.payload.price > 0, "Price must be a positive integer");
      require(
        tx.payload.price <= cap,
        `Anti-scalping rule: resale price ${tx.payload.price} TIX exceeds the cap of ${cap} TIX (face ${ev.price} + ${ev.maxMarkupBps / 100}%)`,
      );
      t.listing = { price: tx.payload.price };
      return s;
    }

    case "CANCEL_LISTING": {
      const t = s.tickets[tx.payload.ticketId];
      require(t, "Ticket does not exist");
      require(t.owner === tx.from, "Only the ticket owner can cancel the listing");
      require(t.listing, "Ticket is not listed");
      t.listing = null;
      return s;
    }

    case "BUY_RESALE": {
      const t = s.tickets[tx.payload.ticketId];
      require(t, "Ticket does not exist");
      require(t.listing, "Ticket is not for sale");
      require(t.owner !== tx.from, "You already own this ticket");
      require(t.usedAt === null, "Ticket has already been used");
      const ev = s.events[t.eventId];
      const price = t.listing.price;
      const royalty = Math.floor((price * ev.royaltyBps) / 10_000);
      const seller = t.owner;
      debit(s, tx.from, price);
      credit(s, seller, price - royalty);
      credit(s, ev.organizer, royalty);
      ev.royaltiesEarned += royalty;
      t.owner = tx.from;
      t.listing = null;
      t.history.push({ txHash: tx.hash, type: "RESALE", from: seller, to: tx.from, price, royalty, timestamp: now, block: ctx.block });
      return s;
    }

    case "TRANSFER": {
      const t = s.tickets[tx.payload.ticketId];
      require(t, "Ticket does not exist");
      require(t.owner === tx.from, "Only the ticket owner can transfer it");
      require(t.usedAt === null, "Ticket has already been used");
      require(tx.payload.to !== tx.from, "Cannot transfer to yourself");
      t.owner = tx.payload.to;
      t.listing = null;
      t.history.push({ txHash: tx.hash, type: "TRANSFER", from: tx.from, to: tx.payload.to, price: 0, royalty: 0, timestamp: now, block: ctx.block });
      return s;
    }

    case "CHECK_IN": {
      const t = s.tickets[tx.payload.ticketId];
      require(t, "Ticket does not exist — possibly counterfeit");
      const ev = s.events[t.eventId];
      require(tx.from === ev.organizer, "Only the event organizer can check tickets in");
      require(t.usedAt === null, "Ticket was already used — entry denied");
      t.usedAt = now;
      t.listing = null;
      t.history.push({ txHash: tx.hash, type: "CHECK_IN", from: t.owner, to: t.owner, price: 0, royalty: 0, timestamp: now, block: ctx.block });
      return s;
    }
  }
}

/** Replays a list of blocks from scratch and returns the resulting world state. */
export function replay(blocks: { index: number; txs: Tx[] }[], extra: Tx[] = []): WorldState {
  let s = emptyState();
  for (const b of blocks) {
    for (const tx of b.txs) {
      try {
        s = applyTx(s, tx, { block: b.index });
      } catch {
        // A tampered block may contain invalid txs; honest nodes would reject
        // the whole block — here we just skip the tx so the UI keeps working.
      }
    }
  }
  for (const tx of extra) {
    try {
      s = applyTx(s, tx, { block: null });
    } catch {}
  }
  return s;
}
