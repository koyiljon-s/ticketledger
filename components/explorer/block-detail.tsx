import Link from "next/link";
import { EventImage } from "@/components/events/event-image";
import { dateParts } from "@/components/events/format";
import { DIFFICULTY, type CheckName } from "@/lib/chain/blockchain";
import { CopyValue, HashChip } from "./hash";
import { HealthIcon, Icon } from "./icons";
import { ActionBar, ActionButton, PanelHeader } from "./panel";
import { artOf, titleOf, type ChainView } from "./types";

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

type Props = { view: ChainView; index: number; onBack: () => void; onTamper: () => void; onResume: () => void };

/** Panel view 2: one block as a ticket, with its checks. */
export function BlockDetail({ view, index, onBack, onTamper, onResume }: Props) {
  const block = view.chain[index];
  const report = view.reports?.[index] ?? null;
  const tx = block.txs[0];
  const d = dateParts(tx?.body.event.date ?? null);
  const art = artOf(block, view.photos);
  const checks = tx ? [...TICKET_CHECKS, ...BLOCK_CHECKS] : BLOCK_CHECKS;
  const failed = report?.problems.length ?? 0;

  return (
    <>
      <PanelHeader title={`Block ${index}`} back={{ label: "Back to all blocks", onClick: onBack }} focus />
      <div className="flex-1 overflow-y-auto">
        <div className="relative h-40 bg-[#121212]">
          {art && <EventImage event={art} sizes="440px" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          <div className="absolute inset-x-5 bottom-4 text-white">
            <p className="line-clamp-2 text-xl font-black leading-tight">{titleOf(block)}</p>
            <p className="mt-1 text-sm text-white/85">
              {tx ? [d ? `${d.weekday}, ${d.month} ${d.day}, ${d.year}` : "Date TBA", tx.body.event.venue].filter(Boolean).join(" · ") : "The fixed starting point of the chain"}
            </p>
          </div>
        </div>

        {/* Ticket stub */}
        <dl className="grid grid-cols-3 border-b-2 border-dashed border-zinc-300 text-center">
          <Stub label="Block" value={String(index)} />
          <Stub label="Nonce" value={block.nonce.toLocaleString("en-US")} />
          <Stub label="Mined" value={new Date(block.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} />
        </dl>

        <section className="px-5 py-5">
          <h3 className="text-base font-black">{!report ? "Checking…" : failed ? `${failed} of ${checks.length} checks failed` : `All ${checks.length} checks passed`}</h3>
          <ul className="mt-2 divide-y divide-zinc-200">
            {checks.map((c) => {
              const problem = report?.problems.find((p) => p.check === c.name);
              return (
                <li key={c.name} className="flex gap-3 py-3">
                  <HealthIcon state={!report ? "checking" : problem ? "bad" : "good"} className="mt-0.5 h-5 w-5" />
                  <div>
                    <p className="font-bold">{c.title}</p>
                    <p className={`text-sm ${problem ? "text-[#b01c30]" : "text-zinc-600"}`}>{problem ? problem.message : report ? c.ok : "Checking…"}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {index > 0 && <LinkProof view={view} index={index} />}

        <details className="group border-t border-zinc-200">
          <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 font-bold hover:bg-zinc-50 [&::-webkit-details-marker]:hidden">
            Technical details
            <Icon name="next" className="h-5 w-5 rotate-90 text-zinc-500 group-open:-rotate-90" />
          </summary>
          <dl className="space-y-4 px-5 pb-5 text-sm">
            <Row label="Block hash">
              <CopyValue value={block.hash} label="block hash" colors={view.colors} />
            </Row>
            <Row label="Previous hash">
              <CopyValue value={block.prevHash} label="previous hash" colors={view.colors} />
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
                <Link href={`/events/${tx.body.event.id}`} prefetch={false} className="inline-block font-bold text-[#024bde] hover:underline">
                  View event
                </Link>
              </>
            )}
          </dl>
        </details>
      </div>

      {view.attack ? (
        <ActionBar>
          <ActionButton onClick={onResume}>Return to the attack</ActionButton>
        </ActionBar>
      ) : (
        tx && (
          <ActionBar>
            <ActionButton onClick={onTamper}>Try to tamper with this ticket</ActionButton>
            <p className="text-center text-sm text-zinc-600">On a copy. Your real tickets stay safe.</p>
          </ActionBar>
        )
      )}
    </>
  );
}

function LinkProof({ view, index }: { view: ChainView; index: number }) {
  const expected = view.chain[index - 1].hash;
  const stored = view.chain[index].prevHash;
  const match = expected === stored;
  return (
    <section className="border-t border-zinc-200 px-5 py-5 text-sm">
      <h3 className="text-base font-black">Link to block {index - 1}</h3>
      <dl className="mt-3 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-zinc-600">Hash of block {index - 1}</dt>
          <dd>
            <HashChip hash={expected} colors={view.colors} />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-zinc-600">Stored in this block</dt>
          <dd>
            <HashChip hash={stored} colors={view.colors} />
          </dd>
        </div>
      </dl>
      <p className={`mt-3 font-bold ${match ? "text-[#0a7d42]" : "text-[#b01c30]"}`}>{match ? "They match, so the link holds." : "They don't match, so the link is broken."}</p>
    </section>
  );
}

function Stub({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l border-zinc-200 py-3 first:border-l-0">
      <dt className="text-xs font-bold uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-0.5 text-lg font-black">{value}</dd>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="mb-1 text-zinc-600">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
