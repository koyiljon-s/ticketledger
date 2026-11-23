import type { Metadata } from "next";
import { ExplorerView } from "@/components/views/explorer";

export const metadata: Metadata = { title: "Block Explorer · StageChain" };

export default function Page() {
  return <ExplorerView />;
}
