/**
 * Minimal proof-of-work blockchain: SHA-256 hashing, block linking via
 * prevHash, nonce search for a hash with N leading zero hex digits, and full
 * chain validation.
 */
import type { Block, Tx } from "./types";

export const DIFFICULTY = 3; // leading hex zeros → ~4,096 hashes per block on average
export const GENESIS_PREV = "0".repeat(64);

const encoder = new TextEncoder();

export async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", encoder.encode(input));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function txBody(tx: Omit<Tx, "hash">) {
  return JSON.stringify({ from: tx.from, type: tx.type, payload: tx.payload, timestamp: tx.timestamp });
}

export async function hashTx(tx: Omit<Tx, "hash">): Promise<string> {
  return "0x" + (await sha256(txBody(tx)));
}

/** The exact bytes that get hashed for a block header + body. */
export function blockBody(b: Omit<Block, "hash">) {
  return JSON.stringify({
    index: b.index,
    timestamp: b.timestamp,
    prevHash: b.prevHash,
    nonce: b.nonce,
    difficulty: b.difficulty,
    txs: b.txs,
  });
}

export function hashBlock(b: Omit<Block, "hash">) {
  return sha256(blockBody(b));
}

export function meetsDifficulty(hash: string, difficulty: number) {
  return hash.startsWith("0".repeat(difficulty));
}

export type MiningProgress = (nonce: number, hash: string) => void;

export async function mineBlock(
  index: number,
  prevHash: string,
  txs: Tx[],
  difficulty = DIFFICULTY,
  onProgress?: MiningProgress,
): Promise<Block> {
  const timestamp = Date.now();
  let nonce = 0;
  for (;;) {
    const candidate = { index, timestamp, prevHash, nonce, difficulty, txs };
    const hash = await hashBlock(candidate);
    if (meetsDifficulty(hash, difficulty)) {
      onProgress?.(nonce, hash);
      return { ...candidate, hash };
    }
    nonce++;
    if (nonce % 250 === 0) {
      onProgress?.(nonce, hash);
      // Yield to the event loop so the UI stays responsive while mining.
      await new Promise((r) => setTimeout(r, 0));
    }
  }
}

export type BlockCheck = {
  index: number;
  hashOk: boolean; // stored hash == recomputed hash
  powOk: boolean; // hash satisfies difficulty
  linkOk: boolean; // prevHash == previous block's hash
  recomputed: string;
};

export type ChainValidity = { valid: boolean; firstBad: number | null; checks: BlockCheck[] };

export async function validateChain(chain: Block[]): Promise<ChainValidity> {
  const checks: BlockCheck[] = [];
  let firstBad: number | null = null;
  for (let i = 0; i < chain.length; i++) {
    const b = chain[i];
    const recomputed = await hashBlock(b);
    const hashOk = recomputed === b.hash;
    const powOk = meetsDifficulty(recomputed, b.difficulty);
    const linkOk = i === 0 ? b.prevHash === GENESIS_PREV : b.prevHash === chain[i - 1].hash;
    checks.push({ index: b.index, hashOk, powOk, linkOk, recomputed });
    if (firstBad === null && !(hashOk && powOk && linkOk)) firstBad = i;
  }
  return { valid: firstBad === null, firstBad, checks };
}
