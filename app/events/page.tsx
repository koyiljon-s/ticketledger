import type { Metadata } from "next";
import { Suspense } from "react";
import { EventsView } from "@/components/views/events";

export const metadata: Metadata = { title: "Events · StageChain" };

export default function Page() {
  // EventsView reads ?q= and ?category= via useSearchParams, which needs a Suspense boundary.
  return (
    <Suspense>
      <EventsView />
    </Suspense>
  );
}
