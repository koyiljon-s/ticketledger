import type { SampleReason } from "@/lib/catalog";

const REASONS: Record<SampleReason, string> = {
  forced: "Live data is turned off by EVENTS_USE_SAMPLE.",
  unavailable: "The live source could not be reached, so it will be tried again in about a minute.",
  no_source: "We have no free live source for this section yet.",
};

/** Shown above the results whenever sample data is displayed. */
export function SampleDataBanner({ reason }: { reason: SampleReason }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 px-5 py-4 text-base text-amber-950 md:flex-row md:items-center md:gap-4">
      <span className="w-fit shrink-0 rounded bg-amber-400 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-amber-950">Sample data</span>
      <p>
        These events are <strong>fictional</strong> placeholders.{" "}
        {REASONS[reason]}
      </p>
    </div>
  );
}
