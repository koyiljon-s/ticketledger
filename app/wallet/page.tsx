import type { Metadata } from "next";
import { WalletView } from "@/components/views/wallet";

export const metadata: Metadata = { title: "My Tickets · StageChain" };

export default function Page() {
  return <WalletView />;
}
