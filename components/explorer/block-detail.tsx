import Link from "next/link";
import { DIFFICULTY, type BlockReport, type CheckName } from "@/lib/chain/blockchain";
import type { Block } from "@/lib/chain/types";
import { CopyValue, type HashColors } from "./hash";

const BLOCK_CHECKS: { name: CheckName; title: string; ok: string }[] = [
  { name: "link", title: "Linked to the previous block", ok: "It contains the previous block's hash." },
  { name: "hash", title: "Contents match the hash", ok: "Recalculating the hash gives the same result." },
  { name: "work", title: "Proof-of-work done", ok: `The hash starts with ${DIFFICULTY} zeros.` },
];
const TICKET_CHECKS: typeof BLOCK_CHECKS = [
  { name: "data", title: "Ticket data unchanged", ok: "The data matches its transaction hash." },
  { name: "signature", title: "Signed by the owner", ok: "The owner's key signed exactly this data." },
  { name: "rules", title: "Contract rules followed", ok: "Price, supply, limit and date are all fine." },
];

export function BlockDetail({ block, report, colors }: { block: Block; report: BlockReport | null; colors: HashColors }) {
  const tx = block.txs[0];
  const checks = tx ? [...BLOCK_CHECKS, ...TICKET_CHECKS] : BLOCK_CHECKS;

  return (
    <section aria-label={`Block ${block.index} details`} className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-zinc-200">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-2xl font-black">Block #{block.index}</h2>
        <span className="text-sm text-zinc-500">Mined {new Date(block.timestamp).toLocaleString()}</span>
      </div>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {checks.map((c) => {
          const problem = report?.problems.find((p) => p.check === c.name);
          return (
            <li key={c.name} className={`rounded-md border p-3 text-sm ${problem ? "border-red-300 bg-red-50 text-red-900" : "border-zinc-200"}`}>
              <p className="flex gap-2 font-bold">
                <span aria-hidden className={problem ? "text-red-600" : report ? "text-emerald-600" : "text-zinc-400"}>
                  {problem ? "✗" : report ? "✓" : "…"}
                </span>
                <span>
                  <span className="sr-only">{problem ? "Failed: " : report ? "Passed: " : "Checking: "}</span>
                  {c.title}
                </span>
              </p>
              <p className={`mt-1 pl-5 ${problem ? "" : "text-zinc-500"}`}>{problem ? problem.message : report ? c.ok : "Checking…"}</p>
            </li>
          );
        })}
      </ul>

      {tx ? (
        <div className="mt-6 rounded-md bg-zinc-50 p-4">
          <h3 className="text-sm text-zinc-500">Ticket in this block</h3>
          <p className="mt-1 text-lg font-bold">
            <Link href={`/events/${tx.body.event.id}`} prefetch={false} className="hover:underline">
              {tx.body.event.name}
            </Link>
          </p>
          <p className="text-zinc-600">{[tx.body.event.date ?? "Date TBA", tx.body.event.venue].filter(Boolean).join(" · ")}</p>
        </div>
      ) : (
        <p className="mt-6 rounded-md bg-zinc-50 p-4 text-zinc-600">The genesis block holds no tickets. It is the fixed starting point that every later block builds on.</p>
      )}

      <details className="mt-6">
        <summary className="cursor-pointer font-bold">Technical details</summary>
        <dl className="mt-4 space-y-4 text-sm">
          <Row label="Previous hash">
            <CopyValue value={block.prevHash} label="previous hash" colors={colors} />
          </Row>
          <Row label="This block's hash">
            <CopyValue value={block.hash} label="block hash" colors={colors} />
          </Row>
          <Row label="Nonce">
            <span className="font-mono">{block.nonce.toLocaleString("en-US")}</span>
            <span className="text-zinc-500"> · found after {(block.nonce + 1).toLocaleString("en-US")} attempts</span>
          </Row>
          {tx && (
            <>
              <Row label="Transaction hash">
                <CopyValue value={tx.hash} label="transaction hash" />
              </Row>
              <Row label="Owner">
                <CopyValue value={tx.body.from} label="owner address" />
              </Row>
              <Row label="Signature">
                <CopyValue value={tx.signature} label="signature" />
              </Row>
            </>
          )}
        </dl>
      </details>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="mb-1 text-zinc-500">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
