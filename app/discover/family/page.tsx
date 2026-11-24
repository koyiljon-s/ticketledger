import type { Metadata } from "next";
import { SectionPage } from "@/components/events/section-page";

export const metadata: Metadata = { title: "Family · TicketLedger" };

export default function FamilyPage() {
  return <SectionPage slug="family" />;
}
