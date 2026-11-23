import type { Metadata } from "next";
import { HowItWorksView } from "@/components/views/how-it-works";

export const metadata: Metadata = { title: "How it works · StageChain" };

export default function Page() {
  return <HowItWorksView />;
}
