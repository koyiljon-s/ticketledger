import type { Metadata } from "next";
import { MyTickets } from "@/components/tickets/my-tickets";

export const metadata: Metadata = {
  title: "My Tickets · TicketLedger",
  description: "Demo tickets recorded on the blockchain in this browser.",
};

export default function MyTicketsPage() {
  return (
    <main className="text-[#121212]">
      <section className="bg-[#121212] text-white">
        <div className="mx-auto max-w-384 px-5 py-10">
          <h1 className="text-4xl font-black md:text-5xl">My Tickets</h1>
          <p className="mt-2 max-w-2xl text-lg text-white/75">Demo tickets only: they give no entry to real events and exist only in this browser.</p>
        </div>
      </section>
      <div className="mx-auto max-w-384 px-5 py-10">
        <MyTickets />
      </div>
    </main>
  );
}
