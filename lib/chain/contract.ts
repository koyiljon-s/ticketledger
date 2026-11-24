/** The "smart contract": pure rules that every transaction must satisfy. */
import type { Address, MintBody, Tx, WorldState } from "./types";

export const TICKET_PRICE = 50; // TIX
export const START_BALANCE = 1_000; // every demo wallet starts with this many TIX
export const SUPPLY_PER_EVENT = 100;
export const MAX_PER_WALLET = 4;

export const emptyState = (): WorldState => ({ balances: {}, nonces: {}, tickets: [] });
export const balanceOf = (s: WorldState, a: Address) => s.balances[a] ?? START_BALANCE;
export const nonceOf = (s: WorldState, a: Address) => s.nonces[a] ?? 0;

/** A rule was broken: the transaction is rejected and never enters a block. */
export class Revert extends Error {}

function check(condition: boolean, message: string) {
  if (!condition) throw new Revert(message);
}

/** Applies a tx and returns the new state, or throws `Revert`. Signatures are checked separately. */
export function applyTx(s: WorldState, tx: Pick<Tx, "hash"> & { body: MintBody }, blockIndex: number): WorldState {
  const { from, nonce, event, timestamp } = tx.body;
  const sold = s.tickets.filter((t) => t.event.id === event.id);
  const today = new Date(timestamp).toISOString().slice(0, 10);

  check(tx.body.type === "MINT_TICKET", "Unknown transaction type.");
  check(nonce === nonceOf(s, from), "Wrong nonce: this transaction was already used.");
  check(event.date === null || event.date >= today, "This event has already taken place.");
  check(sold.length < SUPPLY_PER_EVENT, "Sold out.");
  check(sold.filter((t) => t.owner === from).length < MAX_PER_WALLET, `Limit of ${MAX_PER_WALLET} tickets per wallet reached.`);
  check(balanceOf(s, from) >= TICKET_PRICE, `Not enough TIX: a ticket costs ${TICKET_PRICE}.`);

  const serial = sold.length + 1;
  return {
    balances: { ...s.balances, [from]: balanceOf(s, from) - TICKET_PRICE },
    nonces: { ...s.nonces, [from]: nonce + 1 },
    tickets: [...s.tickets, { id: `${event.id}#${serial}`, serial, owner: from, event, txHash: tx.hash, blockIndex }],
  };
}
