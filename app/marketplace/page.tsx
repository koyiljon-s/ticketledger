import type { Metadata } from "next";
import { MarketplaceView } from "@/components/views/marketplace";

export const metadata: Metadata = { title: "Resale Market · StageChain" };

export default function Page() {
  return <MarketplaceView />;
}
