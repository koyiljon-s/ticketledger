/** Minimal blockchain: SHA-256 links, proof-of-work, ECDSA signatures, full validation. */
import { applyTx, emptyState } from "./contract";
import type { Address, Block, BlockContent, MintBody, Tx, WorldState } from "./types";

export const DIFFICULTY = 3; // leading hex zeros: about 4,096 hashes per block
const GENESIS_PREV = "0".repeat(64);
const SIGN_ALGO = { name: "ECDSA", hash: "SHA-256" };
const KEY_ALGO = { name: "ECDSA", namedCurve: "P-256" };

const encode = (text: string) => new TextEncoder().encode(text);
const toBase64 = (b: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(b)));
const fromBase64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

// ── Wallets and transactions ────────────────────────────────────────────────

export type Wallet = { address: Address; publicKey: string; privateKey: JsonWebKey };

export async function createWallet(): Promise<Wallet> {
  const pair = (await crypto.subtle.generateKey(KEY_ALGO, true, ["sign", "verify"])) as CryptoKeyPair;
  const publicKey = toBase64(await crypto.subtle.exportKey("raw", pair.publicKey));
  return { publicKey, address: await addressOf(publicKey), privateKey: await crypto.subtle.exportKey("jwk", pair.privateKey) };
}

async function addressOf(publicKey: string): Promise<Address> {
  return `0x${(await sha256(publicKey)).slice(0, 40)}`;
}

/** The exact text that is hashed and signed (fixed field order). */
function serialize(b: MintBody) {
  return JSON.stringify([b.type, b.from, b.nonce, b.timestamp, b.event.id, b.event.name, b.event.date, b.event.venue, b.publicKey]);
}

export async function signTx(wallet: Wallet, body: MintBody): Promise<Tx> {
  const text = serialize(body);
  const key = await crypto.subtle.importKey("jwk", wallet.privateKey, KEY_ALGO, false, ["sign"]);
  const signature = toBase64(await crypto.subtle.sign(SIGN_ALGO, key, encode(text)));
  return { body, signature, hash: await sha256(text) };
}

async function inspectTx(tx: Tx): Promise<Problem[]> {
  const problems: Problem[] = [];
  const text = serialize(tx.body);
  if ((await sha256(text)) !== tx.hash) problems.push({ check: "data", message: "Transaction hash doesn't match the ticket's data." });
  if ((await addressOf(tx.body.publicKey)) !== tx.body.from) problems.push({ check: "signature", message: "Public key doesn't belong to the owner's address." });
  if (!(await verifySignature(tx, text))) problems.push({ check: "signature", message: "Invalid signature: the owner never signed this data." });
  return problems;
}

async function verifySignature(tx: Tx, text: string): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey("raw", fromBase64(tx.body.publicKey), KEY_ALGO, false, ["verify"]);
    return await crypto.subtle.verify(SIGN_ALGO, key, fromBase64(tx.signature), encode(text));
  } catch {
    return false; // malformed key or signature
  }
}

// ── Blocks ──────────────────────────────────────────────────────────────────

function hashBlock(b: BlockContent) {
  return sha256(JSON.stringify([b.index, b.timestamp, b.prevHash, b.difficulty, b.nonce, b.txs.map((t) => [t.hash, t.signature])]));
}

export async function mineBlock(prev: Block | null, txs: Tx[]): Promise<Block> {
  const base = { index: prev ? prev.index + 1 : 0, timestamp: Date.now(), prevHash: prev?.hash ?? GENESIS_PREV, difficulty: DIFFICULTY, txs };
  for (let nonce = 0; ; nonce++) {
    const hash = await hashBlock({ ...base, nonce });
    if (hash.startsWith("0".repeat(DIFFICULTY))) return { ...base, nonce, hash };
    if (nonce % 250 === 249) await new Promise((r) => setTimeout(r)); // keep the page responsive
  }
}

export type CheckName = "link" | "hash" | "work" | "data" | "signature" | "rules";
export type Problem = { check: CheckName; message: string };
export type BlockReport = { index: number; problems: Problem[] };

/** Checks every block and lists everything wrong with it, continuing past failures. */
export async function inspectChain(chain: Block[]): Promise<{ reports: BlockReport[]; state: WorldState }> {
  const reports: BlockReport[] = [];
  let state = emptyState();
  for (const [i, block] of chain.entries()) {
    const problems: Problem[] = [];
    const fail = (check: CheckName, message: string) => problems.push({ check, message });
    if (block.index !== i) fail("link", "Wrong block number.");
    if (block.prevHash !== (i === 0 ? GENESIS_PREV : chain[i - 1].hash)) fail("link", "Broken link: previous hash doesn't match the block before it.");
    if (block.hash !== (await hashBlock(block))) fail("hash", "Block hash doesn't match the block's contents.");
    if (block.difficulty !== DIFFICULTY || !block.hash.startsWith("0".repeat(DIFFICULTY))) fail("work", "Not enough proof-of-work.");
    for (const tx of block.txs) {
      problems.push(...(await inspectTx(tx)));
      try {
        state = applyTx(state, tx, i);
      } catch (e) {
        fail("rules", `Contract rule broken: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    reports.push({ index: i, problems });
  }
  return { reports, state };
}

/** Replays the whole chain. Returns its state, or throws if anything was tampered with. */
export async function validateChain(chain: Block[]): Promise<WorldState> {
  const { reports, state } = await inspectChain(chain);
  const bad = reports.find((r) => r.problems.length > 0);
  if (bad) throw new Error(`Block #${bad.index} is invalid. ${bad.problems[0].message}`);
  return state;
}

// ── Attack simulation (block explorer only; never saved) ────────────────────

/** Replaces `chain[index]`'s first transaction's event name, leaving hashes and signature as they were. */
export function editEventName(chain: Block[], index: number, name: string): Block[] {
  return chain.map((b, i) => {
    if (i !== index) return b;
    const [tx, ...rest] = b.txs;
    return { ...b, txs: [{ ...tx, body: { ...tx.body, event: { ...tx.body.event, name } } }, ...rest] };
  });
}

/** Recalculates transaction hashes. The signature can't be recalculated without the owner's private key. */
export async function rehashTxs(chain: Block[], index: number): Promise<Block[]> {
  const txs = await Promise.all(chain[index].txs.map(async (tx) => ({ ...tx, hash: await sha256(serialize(tx.body)) })));
  return chain.map((b, i) => (i === index ? { ...b, txs } : b));
}

/** Redoes the proof-of-work for blocks `from` to `to` (inclusive). */
export async function remine(chain: Block[], from: number, to: number): Promise<Block[]> {
  const next = [...chain];
  for (let i = from; i <= to; i++) next[i] = await mineBlock(i === 0 ? null : next[i - 1], next[i].txs);
  return next;
}
