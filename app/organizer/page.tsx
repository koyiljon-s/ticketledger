import type { Metadata } from "next";
import { OrganizerView } from "@/components/views/organizer";

export const metadata: Metadata = { title: "Organizer · StageChain" };

export default function Page() {
  return <OrganizerView />;
}
