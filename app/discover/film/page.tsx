import type { Metadata } from "next";
import { SectionPage } from "@/components/events/section-page";

export const metadata: Metadata = { title: "Film · TicketLedger" };

export default function FilmPage() {
  return <SectionPage slug="film" />;
}
