import type { Metadata } from "next";
import { SectionPage } from "@/components/events/section-page";

export const metadata: Metadata = { title: "Arts & Theater · TicketLedger" };

export default function ArtsTheaterPage() {
  return <SectionPage slug="arts-theater" />;
}
