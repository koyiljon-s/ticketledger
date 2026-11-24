import type { Metadata } from "next";
import { BlockExplorer } from "@/components/explorer/block-explorer";
import { DIFFICULTY } from "@/lib/chain/blockchain";

export const metadata: Metadata = {
  title: "Block Explorer · TicketLedger",
  description: "Inspect the demo blockchain and see how it detects tampering.",
};

const FAQ = [
  { q: "What is a block?", a: "A page in the record book. Here, each block after the first one holds a single ticket." },
  { q: "What is a hash?", a: "A fingerprint of data. Change anything in the data and the fingerprint becomes completely different." },
  { q: "What is proof-of-work?", a: `Trying numbers (nonces) until the block's hash starts with ${DIFFICULTY} zeros. Rewriting history means doing that work again.` },
  { q: "What does the signature prove?", a: "That the ticket's owner approved exactly this data. Only their private key can create it." },
  {
    q: "Is this a real blockchain network?",
    a: "No. This chain lives in one browser. On a real network, many independent computers keep copies and would reject an attacker's version.",
  },
];

export default function ExplorerPage() {
  return (
    <main className="text-[#121212]">
      <BlockExplorer />
      <section className="mx-auto max-w-384 px-5 py-12">
        <h2 className="text-2xl font-black">Good to know</h2>
        <div className="mt-4 border-t border-zinc-300">
          {FAQ.map((f) => (
            <details key={f.q} className="group border-b border-zinc-300">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-bold hover:text-[#024bde] [&::-webkit-details-marker]:hidden">
                {f.q}
                <span aria-hidden className="text-2xl leading-none transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="max-w-3xl pb-5 text-zinc-700">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
