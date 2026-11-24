import type { Metadata } from "next";
import { SectionPage } from "@/components/events/section-page";

export const metadata: Metadata = { title: "Concerts · TicketLedger" };

export default function ConcertsPage() {
  return <SectionPage slug="concerts" />;
}
