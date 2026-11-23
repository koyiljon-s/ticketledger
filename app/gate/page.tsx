import type { Metadata } from "next";
import { GateView } from "@/components/views/gate";

export const metadata: Metadata = { title: "Gate Check-in · StageChain" };

export default function Page() {
  return <GateView />;
}
