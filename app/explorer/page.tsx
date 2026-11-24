import type { Metadata } from "next";
import { BlockExplorer } from "@/components/explorer/block-explorer";

export const metadata: Metadata = {
  title: "Block Explorer · TicketLedger",
  description: "Inspect the demo blockchain and see how it detects tampering.",
};

export default function ExplorerPage() {
  return (
    <main className="text-[#121212]">
      <section className="bg-[#121212] text-white">
        <div className="mx-auto max-w-384 px-5 py-10">
          <h1 className="text-4xl font-black md:text-5xl">Block Explorer</h1>
          <p className="mt-2 max-w-2xl text-lg text-white/75">Every block in this browser&apos;s demo blockchain. Try to change one and see what breaks.</p>
        </div>
      </section>
      <div className="mx-auto max-w-384 px-5 py-10">
        <BlockExplorer />
      </div>
    </main>
  );
}
