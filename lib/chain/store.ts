/** The browser "node": keeps the chain and wallet in localStorage and mines new tickets. */
import { createWallet, mineBlock, signTx, validateChain, type Wallet } from "./blockchain";
import { applyTx, nonceOf } from "./contract";
import type { Block, MintBody, Ticket, WorldState } from "./types";

const CHAIN_KEY = "ticketledger.chain.v1";
const WALLET_KEY = "ticketledger.wallet.v1";

export type Snapshot =
  | { status: "loading" }
  | { status: "ready"; chain: Block[]; state: WorldState; wallet: Wallet }
  | { status: "error"; message: string };

const LOADING: Snapshot = { status: "loading" };
let snapshot: Snapshot = LOADING;
const listeners = new Set<() => void>();

export const getSnapshot = () => snapshot;
export const getServerSnapshot = () => LOADING;

export function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    window.addEventListener("storage", onStorage);
    void refresh();
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

function onStorage(e: StorageEvent) {
  if (e.key === CHAIN_KEY || e.key === WALLET_KEY || e.key === null) void refresh();
}

function publish(next: Snapshot) {
  snapshot = next;
  listeners.forEach((l) => l());
}

/** One writer at a time, even across browser tabs, so two tabs can't overwrite each other's blocks. */
function exclusive<T>(fn: () => Promise<T>): Promise<T> {
  if (!globalThis.crypto?.subtle || !navigator.locks) {
    return Promise.reject(new Error("The demo blockchain needs a secure page: open it on localhost or over https."));
  }
  return navigator.locks.request("ticketledger.chain", fn) as Promise<T>;
}

async function load() {
  const read = <T,>(key: string): T | null => JSON.parse(localStorage.getItem(key) ?? "null");
  let wallet = read<Wallet>(WALLET_KEY);
  if (!wallet) {
    wallet = await createWallet();
    localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
  }
  let chain = read<Block[]>(CHAIN_KEY);
  if (!chain?.length) {
    chain = [await mineBlock(null, [])];
    localStorage.setItem(CHAIN_KEY, JSON.stringify(chain));
  }
  return { wallet, chain, state: await validateChain(chain) };
}

const messageOf = (e: unknown) => (e instanceof Error ? e.message : String(e));

async function refresh() {
  try {
    await exclusive(async () => publish({ status: "ready", ...(await load()) }));
  } catch (e) {
    publish({ status: "error", message: messageOf(e) });
  }
}

/** Signs, checks and mines one ticket. Throws with a readable message if the contract rejects it. */
export function mintTicket(event: MintBody["event"]): Promise<Ticket> {
  return exclusive(async () => {
    const { wallet, chain, state } = await load();
    const tx = await signTx(wallet, {
      type: "MINT_TICKET",
      from: wallet.address,
      nonce: nonceOf(state, wallet.address),
      timestamp: Date.now(),
      event,
      publicKey: wallet.publicKey,
    });
    const next = applyTx(state, tx, chain.length); // throws Revert before any mining
    const nextChain = [...chain, await mineBlock(chain[chain.length - 1], [tx])];
    localStorage.setItem(CHAIN_KEY, JSON.stringify(nextChain));
    publish({ status: "ready", chain: nextChain, state: next, wallet });
    return next.tickets[next.tickets.length - 1];
  });
}

/** Starts over with a new chain (tickets are lost; the wallet is kept unless it is unreadable). */
export async function resetChain() {
  localStorage.removeItem(CHAIN_KEY);
  try {
    JSON.parse(localStorage.getItem(WALLET_KEY) ?? "null");
  } catch {
    localStorage.removeItem(WALLET_KEY);
  }
  publish(LOADING);
  await refresh();
}
