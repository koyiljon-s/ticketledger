import type { Metadata } from "next";
import { SectionPage } from "@/components/events/section-page";

export const metadata: Metadata = { title: "Sports · TicketLedger" };

export default function SportsPage() {
  return <SectionPage slug="sports" />;
}
