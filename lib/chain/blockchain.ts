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

async function isTxAuthentic(tx: Tx): Promise<boolean> {
  const text = serialize(tx.body);
  if ((await sha256(text)) !== tx.hash) return false;
  if ((await addressOf(tx.body.publicKey)) !== tx.body.from) return false;
  const key = await crypto.subtle.importKey("raw", fromBase64(tx.body.publicKey), KEY_ALGO, false, ["verify"]);
  return crypto.subtle.verify(SIGN_ALGO, key, fromBase64(tx.signature), encode(text));
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

/** Replays the whole chain. Returns its state, or throws if anything was tampered with. */
export async function validateChain(chain: Block[]): Promise<WorldState> {
  let state = emptyState();
  for (const [i, block] of chain.entries()) {
    const ok =
      block.index === i &&
      block.difficulty === DIFFICULTY &&
      block.prevHash === (i === 0 ? GENESIS_PREV : chain[i - 1].hash) &&
      block.hash === (await hashBlock(block)) &&
      block.hash.startsWith("0".repeat(DIFFICULTY));
    if (!ok) throw new Error(`Block #${i} is invalid.`);
    for (const tx of block.txs) {
      if (!(await isTxAuthentic(tx))) throw new Error(`Block #${i} contains a forged transaction.`);
      state = applyTx(state, tx, i);
    }
  }
  return state;
}
