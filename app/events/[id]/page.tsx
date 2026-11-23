import type { Metadata } from "next";
import { Suspense } from "react";
import { EventDetailView } from "@/components/views/event-detail";

export const metadata: Metadata = { title: "Event · StageChain" };

export default function Page({ params }: PageProps<"/events/[id]">) {
  return (
    <Suspense>
      {params.then(({ id }) => (
        <EventDetailView id={decodeURIComponent(id)} />
      ))}
    </Suspense>
  );
}
