import type { TmResult } from "@/lib/ticketmaster";

/** Shown when the live Ticketmaster API fails (bad key, rate limit, outage). */
export function ApiNotice({ result }: { result: Extract<TmResult, { ok: false }> }) {
  return (
    <div className="rounded-lg border border-red-300 bg-red-50 p-6 text-base text-red-900">
      <h2 className="text-lg font-bold">Couldn&apos;t load events</h2>
      <p className="mt-1">{result.message}</p>
      <p className="mt-2 text-sm">
        Tip: set <code className="rounded bg-red-100 px-1">TICKETMASTER_USE_SAMPLE=true</code> in <code className="rounded bg-red-100 px-1">.env.local</code>{" "}
        to use sample data instead.
      </p>
    </div>
  );
}

/** Shown above the results whenever sample data mode is active. */
export function SampleDataBanner() {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 px-5 py-4 text-base text-amber-950 md:flex-row md:items-center md:gap-4">
      <span className="w-fit shrink-0 rounded bg-amber-400 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-amber-950">Sample data</span>
      <p>
        These events are <strong>fictional</strong> placeholders. To show live Ticketmaster events, add{" "}
        <code className="rounded bg-amber-100 px-1">TICKETMASTER_API_KEY</code> to <code className="rounded bg-amber-100 px-1">.env.local</code> and
        restart the dev server.
      </p>
    </div>
  );
}
