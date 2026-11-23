"use client";

import { useState } from "react";
import { DIFFICULTY } from "@/lib/chain/blockchain";
import type { Block, Tx } from "@/lib/chain/types";
import { useChain } from "../chain-provider";
import { Container } from "../event-parts";
import { Badge, Button, Card, Hash, PageHeader, Who } from "../ui";

export function ExplorerView() {
  const { chain, mempool, mine, mining, autoMine, setAutoMine, validity, reset, pendingState } = useChain();
  // null = follow the chain tip
  const [selected, setSelected] = useState<number | null>(null);
  const idx = selected === null ? chain.length - 1 : Math.min(selected, chain.length - 1);
  const block = chain[idx];

  return (
    <Container>
      <PageHeader
        title="Block Explorer"
        subtitle={`Each block stores the SHA-256 hash of the previous block, so editing any past block breaks every block after it. Mining means finding a nonce that makes the block hash start with ${DIFFICULTY} zeros (proof-of-work).`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" checked={autoMine} onChange={(e) => setAutoMine(e.target.checked)} className="accent-violet-600" />
            Auto-mine
          </label>
          <Button disabled={mining.active || mempool.length === 0} onClick={() => void mine()}>
            ⛏️ Mine block ({mempool.length} tx)
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (confirm("Wipe the local chain and start over from a new genesis block?")) void reset();
            }}
          >
            Reset demo
          </Button>
        </div>
      </PageHeader>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Stat label="Chain status">
          {validity?.valid === false ? <span className="text-rose-700">❌ Invalid at #{validity.firstBad}</span> : <span className="text-emerald-700">✅ Valid</span>}
        </Stat>
        <Stat label="Height">{chain.length - 1}</Stat>
        <Stat label="Mempool">{mempool.length} pending tx</Stat>
        <Stat label="Miner">
          {mining.active ? (
            <span className="font-mono text-sm text-violet-700">
              nonce {mining.nonce.toLocaleString()} · {mining.hash.slice(0, 10)}…
            </span>
          ) : (
            <span className="text-zinc-600">idle</span>
          )}
        </Stat>
      </div>

      {/* Chain strip */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {chain.map((b, i) => {
          const check = validity?.checks[i];
          const bad = check && !(check.hashOk && check.powOk && check.linkOk);
          return (
            <div key={b.index} className="flex items-center gap-2">
              {i > 0 && <span className={bad ? "text-rose-400" : "text-zinc-600"}>⟶</span>}
              <button
                onClick={() => setSelected(i === chain.length - 1 ? null : i)}
                className={`w-40 shrink-0 rounded-xl border p-3 text-left text-xs transition ${
                  bad ? "border-rose-400 bg-rose-50" : "border-zinc-200 bg-white"
                } ${block?.index === b.index ? "ring-2 ring-violet-500" : ""}`}
              >
                <div className="flex justify-between font-semibold">
                  <span>Block #{b.index}</span>
                  <span>{bad ? "❌" : "✅"}</span>
                </div>
                <div className="mt-1 text-zinc-500">{b.txs.length} tx</div>
                <div className="mt-1 truncate font-mono text-[10px] text-zinc-600">{b.hash.slice(0, 18)}…</div>
              </button>
            </div>
          );
        })}
        {mempool.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">⟶</span>
            <div className="w-40 shrink-0 rounded-xl border border-dashed border-amber-400 p-3 text-xs text-amber-800">
              <div className="font-semibold">Mempool</div>
              <div className="mt-1">{mempool.length} pending tx</div>
              <div className="mt-1 text-[10px] text-amber-700/70">{mining.active ? "mining…" : "waiting for miner"}</div>
            </div>
          </div>
        )}
      </div>

      {block && <BlockDetail key={`${block.index}-${block.hash}`} block={block} i={idx} />}

      <details className="mt-8">
        <summary className="cursor-pointer text-sm text-zinc-600">World state (derived by replaying all transactions)</summary>
        <pre className="mt-3 max-h-[30rem] overflow-auto rounded-xl border border-zinc-200 bg-white p-4 text-[11px] text-zinc-700">
          {JSON.stringify(
            {
              balances: pendingState.balances,
              events: pendingState.events,
              tickets: Object.fromEntries(
                Object.values(pendingState.tickets).map((t) => [t.id, { owner: t.owner, usedAt: t.usedAt, listing: t.listing, transfers: t.history.length - 1 }]),
              ),
            },
            null,
            2,
          )}
        </pre>
      </details>
    </Container>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Card className="py-3">
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 text-lg font-semibold">{children}</div>
    </Card>
  );
}

function BlockDetail({ block, i }: { block: Block; i: number }) {
  const { validity, tamperBlock, remineFrom, mining } = useChain();
  const check = validity?.checks[i];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => JSON.stringify(block.txs, null, 2));
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <Card>
        <h3 className="mb-4 text-lg font-semibold">Block #{block.index} header</h3>
        <dl className="space-y-3 text-sm">
          <Row k="Timestamp">{new Date(block.timestamp).toLocaleString()}</Row>
          <Row k="Previous hash" ok={check?.linkOk}>
            <code className="break-all font-mono text-xs">{block.prevHash}</code>
          </Row>
          <Row k="Nonce">{block.nonce.toLocaleString()}</Row>
          <Row k="Difficulty">{block.difficulty} leading zeros</Row>
          <Row k="Stored hash" ok={check?.hashOk && check?.powOk}>
            <code className="break-all font-mono text-xs">
              <span className="text-violet-700">{block.hash.slice(0, block.difficulty)}</span>
              {block.hash.slice(block.difficulty)}
            </code>
          </Row>
          {check && !check.hashOk && (
            <Row k="Recomputed hash" ok={false}>
              <code className="break-all font-mono text-xs text-rose-700">{check.recomputed}</code>
            </Row>
          )}
        </dl>
        {check && !(check.hashOk && check.powOk && check.linkOk) && (
          <div className="mt-5 rounded-lg border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800">
            {!check.hashOk && <p>• The block&apos;s contents changed after it was mined, so the stored hash no longer matches.</p>}
            {!check.linkOk && <p>• prevHash does not match the previous block&apos;s hash, so the link in the chain is broken.</p>}
            <p className="mt-2">
              To “fix” this, an attacker must redo proof-of-work for this block <em>and every block after it</em>, faster than the honest network
              keeps adding blocks. That is the 51% attack.
            </p>
            <Button variant="danger" className="mt-3" disabled={mining.active} onClick={() => void remineFrom(i)}>
              Re-mine from block #{block.index} (attacker)
            </Button>
          </div>
        )}
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Transactions ({block.txs.length})</h3>
          {!editing ? (
            <Button variant="ghost" onClick={() => setEditing(true)}>
              🧪 Tamper with this block
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  try {
                    const txs = JSON.parse(draft) as Tx[];
                    if (!Array.isArray(txs)) throw new Error("Must be an array of transactions");
                    tamperBlock(block.index, txs);
                    setEditing(false);
                    setErr(null);
                  } catch (e) {
                    setErr(String(e));
                  }
                }}
              >
                Save without re-mining
              </Button>
            </div>
          )}
        </div>
        {editing ? (
          <>
            <p className="mb-2 text-xs text-amber-800">
              Try changing a ticket price, an amount, or an address, then save. The block hash will no longer match.
            </p>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              spellCheck={false}
              className="h-96 w-full rounded-lg border border-zinc-200 bg-zinc-50 p-3 font-mono text-[11px] outline-none focus:border-rose-500"
            />
            {err && <p className="mt-2 text-xs text-rose-700">{err}</p>}
          </>
        ) : (
          <div className="space-y-2">
            {block.txs.map((tx) => (
              <div key={tx.hash} className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge color="violet">{tx.type}</Badge>
                  <Hash value={tx.hash} />
                </div>
                <div className="mt-2 text-zinc-600">
                  from <Who address={tx.from} />
                </div>
                <pre className="mt-1 overflow-x-auto text-[11px] text-zinc-700">{JSON.stringify(tx.payload)}</pre>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Row({ k, ok, children }: { k: string; ok?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <dt className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
        {k}
        {ok === true && <span className="text-emerald-400">✓</span>}
        {ok === false && <span className="text-rose-400">✗</span>}
      </dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}
