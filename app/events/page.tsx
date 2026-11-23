import type { Metadata } from "next";
import { EventsView } from "@/components/views/events";

export const metadata: Metadata = { title: "Events · StageChain" };

export default function Page() {
  return <EventsView />;
}
