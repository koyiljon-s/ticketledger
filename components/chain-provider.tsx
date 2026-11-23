"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ACCOUNTS, ORGANIZER } from "@/lib/chain/accounts";
import { DIFFICULTY, GENESIS_PREV, hashTx, mineBlock, validateChain, type ChainValidity } from "@/lib/chain/blockchain";
import { applyTx, replay, Revert } from "@/lib/chain/contract";
import type { Address, Block, Tx, TxPayloads, TxType, WorldState } from "@/lib/chain/types";

const STORAGE_KEY = "stagechain-v1";

type Toast = { id: number; kind: "success" | "error" | "info"; title: string; detail?: string };

type SubmitResult = { ok: true; hash: string } | { ok: false; error: string };

type ChainContextValue = {
  ready: boolean;
  chain: Block[];
  mempool: Tx[];
  /** State after all mined blocks (what's final on-chain). */
  state: WorldState;
  /** State including pending mempool transactions (what the UI optimistically shows). */
  pendingState: WorldState;
  validity: ChainValidity | null;
  account: Address;
  setAccount: (a: Address) => void;
  submit: <T extends TxType>(type: T, payload: TxPayloads[T]) => Promise<SubmitResult>;
  mine: () => Promise<void>;
  mining: { active: boolean; nonce: number; hash: string };
  autoMine: boolean;
  setAutoMine: (v: boolean) => void;
  tamperBlock: (index: number, txs: Tx[]) => void;
  remineFrom: (index: number) => Promise<void>;
  reset: () => Promise<void>;
  toasts: Toast[];
  notify: (t: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
};

const ChainContext = createContext<ChainContextValue | null>(null);

export function useChain() {
  const ctx = useContext(ChainContext);
  if (!ctx) throw new Error("useChain must be used inside <ChainProvider>");
  return ctx;
}

async function makeTx<T extends TxType>(from: Address, type: T, payload: TxPayloads[T], timestamp = Date.now()) {
  const body = { from, type, payload, timestamp } as Omit<Tx, "hash">;
  return { ...body, hash: await hashTx(body) } as Tx;
}

/** Builds a fresh chain: genesis token allocation + a block of demo events. */
async function buildSeedChain(): Promise<Block[]> {
  const t0 = Date.now();
  const allocs = await Promise.all(
    ACCOUNTS.map((a) => makeTx(`0x${"0".repeat(40)}`, "ALLOC", { to: a.address, amount: a.role === "scalper" ? 3000 : 1000 }, t0)),
  );
  const genesis = await mineBlock(0, GENESIS_PREV, allocs);

  const seedTxs = [
    await makeTx(ORGANIZER, "CREATE_EVENT", {
      name: "Midnight Echoes — World Tour",
      venue: "Humo Arena, Tashkent",
      date: "2026-12-19T20:00",
      category: "Concert",
      price: 120,
      supply: 40,
      royaltyBps: 1000,
      maxMarkupBps: 1000,
    }),
    await makeTx(ORGANIZER, "CREATE_EVENT", {
      name: "Silk Road Indie Film Festival — 3-Day Pass",
      venue: "Registan Square, Samarkand",
      date: "2027-01-15T10:00",
      category: "Film",
      price: 60,
      supply: 25,
      royaltyBps: 500,
      maxMarkupBps: 2000,
    }),
    await makeTx(ORGANIZER, "CREATE_EVENT", {
      name: "Champions League of Legends — Grand Final",
      venue: "Cyber Dome, Online + Live",
      date: "2027-02-07T18:30",
      category: "eSports",
      price: 45,
      supply: 10,
      royaltyBps: 750,
      maxMarkupBps: 500,
    }),
  ];
  const aliceBuy = await makeTx(ACCOUNTS[1].address, "BUY_TICKET", { eventId: "EVT-1" });
  const block1 = await mineBlock(1, genesis.hash, [...seedTxs, aliceBuy]);
  return [genesis, block1];
}

type Persisted = { chain: Block[]; mempool: Tx[]; autoMine: boolean; account: Address };

export function ChainProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [chain, setChain] = useState<Block[]>([]);
  const [mempool, setMempool] = useState<Tx[]>([]);
  const [account, setAccount] = useState<Address>(ACCOUNTS[1].address);
  const [autoMine, setAutoMine] = useState(true);
  const [mining, setMining] = useState({ active: false, nonce: 0, hash: "" });
  const [validity, setValidity] = useState<ChainValidity | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Refs mirror the latest values for async callbacks (mining, submit).
  const chainRef = useRef(chain);
  const mempoolRef = useRef(mempool);
  const miningRef = useRef(false);
  const autoMineRef = useRef(autoMine);
  useEffect(() => {
    chainRef.current = chain;
    mempoolRef.current = mempool;
    autoMineRef.current = autoMine;
  });

  const toastId = useRef(0);
  const dismiss = useCallback((id: number) => setToasts((ts) => ts.filter((t) => t.id !== id)), []);
  const notify = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = ++toastId.current;
      setToasts((ts) => [...ts.slice(-3), { ...t, id }]);
      setTimeout(() => dismiss(id), 6000);
    },
    [dismiss],
  );

  // Boot: load from localStorage, or create & mine the seed chain.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let saved: Persisted | null = null;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) saved = JSON.parse(raw);
      } catch {}
      const c = saved?.chain?.length ? saved.chain : await buildSeedChain();
      if (cancelled) return;
      chainRef.current = c;
      mempoolRef.current = saved?.mempool ?? [];
      setChain(c);
      setMempool(saved?.mempool ?? []);
      if (saved) {
        setAutoMine(saved.autoMine);
        if (saved.account) setAccount(saved.account);
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist.
  useEffect(() => {
    if (!ready) return;
    const data: Persisted = { chain, mempool, autoMine, account };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [ready, chain, mempool, autoMine, account]);

  // Re-validate every time the chain changes.
  useEffect(() => {
    let cancelled = false;
    validateChain(chain).then((v) => {
      if (!cancelled) setValidity(v);
    });
    return () => {
      cancelled = true;
    };
  }, [chain]);

  const state = useMemo(() => replay(chain), [chain]);
  const pendingState = useMemo(() => replay(chain, mempool), [chain, mempool]);

  const mine = useCallback(async () => {
    if (miningRef.current || mempoolRef.current.length === 0) return;
    miningRef.current = true;
    let first = true;
    // Keep mining while txs remain — more may arrive during PoW (only when auto-mining).
    while (mempoolRef.current.length > 0 && (first || autoMineRef.current)) {
      first = false;
      const txs = mempoolRef.current;
      setMining({ active: true, nonce: 0, hash: "" });
      const prev = chainRef.current[chainRef.current.length - 1];
      const block = await mineBlock(prev.index + 1, prev.hash, txs, DIFFICULTY, (nonce, hash) =>
        setMining({ active: true, nonce, hash }),
      );
      const minedHashes = new Set(txs.map((t) => t.hash));
      const nextChain = [...chainRef.current, block];
      const nextPool = mempoolRef.current.filter((t) => !minedHashes.has(t.hash));
      chainRef.current = nextChain;
      mempoolRef.current = nextPool;
      setChain(nextChain);
      setMempool(nextPool);
      notify({
        kind: "info",
        title: `⛏️ Block #${block.index} mined`,
        detail: `${txs.length} tx · nonce ${block.nonce.toLocaleString()} · ${block.hash.slice(0, 16)}…`,
      });
    }
    miningRef.current = false;
    setMining({ active: false, nonce: 0, hash: "" });
  }, [notify]);

  const submit = useCallback(
    async <T extends TxType>(type: T, payload: TxPayloads[T]): Promise<SubmitResult> => {
      const tx = await makeTx(account, type, payload);
      // Simulate execution against chain + mempool before accepting into the pool
      // (like eth_estimateGas / a node's pre-check). Reverts never reach a block.
      const current = replay(chainRef.current, mempoolRef.current);
      try {
        applyTx(current, tx, { block: null });
      } catch (e) {
        const error = e instanceof Revert ? e.message : String(e);
        notify({ kind: "error", title: "Transaction reverted", detail: error });
        return { ok: false, error };
      }
      const nextPool = [...mempoolRef.current, tx];
      mempoolRef.current = nextPool;
      setMempool(nextPool);
      notify({ kind: "success", title: `${type} submitted`, detail: `tx ${tx.hash.slice(0, 18)}… is in the mempool` });
      if (autoMineRef.current) setTimeout(() => void mine(), 400);
      return { ok: true, hash: tx.hash };
    },
    [account, mine, notify],
  );

  const tamperBlock = useCallback((index: number, txs: Tx[]) => {
    const next = chainRef.current.map((b) => (b.index === index ? { ...b, txs } : b));
    chainRef.current = next;
    setChain(next);
  }, []);

  const remineFrom = useCallback(
    async (index: number) => {
      if (miningRef.current) return;
      miningRef.current = true;
      const c = [...chainRef.current];
      for (let i = index; i < c.length; i++) {
        const prevHash = i === 0 ? GENESIS_PREV : c[i - 1].hash;
        setMining({ active: true, nonce: 0, hash: "" });
        c[i] = await mineBlock(c[i].index, prevHash, c[i].txs, c[i].difficulty, (nonce, hash) =>
          setMining({ active: true, nonce, hash }),
        );
      }
      chainRef.current = c;
      setChain(c);
      miningRef.current = false;
      setMining({ active: false, nonce: 0, hash: "" });
      notify({
        kind: "info",
        title: `Re-mined ${c.length - index} block(s)`,
        detail: "Your local chain is valid again — but honest nodes still hold the original, longer-work chain.",
      });
    },
    [notify],
  );

  const reset = useCallback(async () => {
    if (miningRef.current) return;
    setReady(false);
    localStorage.removeItem(STORAGE_KEY);
    const c = await buildSeedChain();
    chainRef.current = c;
    mempoolRef.current = [];
    setChain(c);
    setMempool([]);
    setReady(true);
    notify({ kind: "info", title: "Demo reset", detail: "A fresh chain was mined from genesis." });
  }, [notify]);

  const value: ChainContextValue = {
    ready,
    chain,
    mempool,
    state,
    pendingState,
    validity,
    account,
    setAccount,
    submit,
    mine,
    mining,
    autoMine,
    setAutoMine,
    tamperBlock,
    remineFrom,
    reset,
    toasts,
    notify,
    dismiss,
  };

  return <ChainContext.Provider value={value}>{children}</ChainContext.Provider>;
}
