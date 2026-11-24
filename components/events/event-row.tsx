import Link from "next/link";
import type { EventItem } from "@/lib/events";
import { EventImage } from "./event-image";
import { dateParts, formatPlace, formatPrice, formatTime } from "./format";

/** List row: date block · thumbnail · details · price · link. */
export function EventRow({ event }: { event: EventItem }) {
  const d = dateParts(event.localDate);
  const time = formatTime(event.localTime, event.timeZone);
  const price = formatPrice(event);
  const cancelled = event.status === "cancelled" || event.status === "canceled";

  return (
    <li className="flex items-center gap-4 border-b border-zinc-200 px-4 py-5 last:border-b-0 sm:gap-6 sm:px-6">
      <div className="w-14 shrink-0 text-center">
        {d ? (
          <>
            <div className="text-sm font-bold uppercase text-[#024bde]">{d.month}</div>
            <div className="text-3xl font-black leading-none text-[#121212]">{d.day}</div>
          </>
        ) : (
          <div className="text-sm font-bold text-zinc-500">TBA</div>
        )}
      </div>

      <div className="relative hidden h-20 w-36 shrink-0 overflow-hidden rounded-md bg-zinc-200 sm:block">
        <EventImage event={event} sizes="144px" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-sm text-zinc-600">
          {[d?.weekday, time, event.genre].filter(Boolean).join(" · ")}
        </div>
        <h3 className="truncate text-lg font-bold text-[#121212]">{event.name}</h3>
        <p className="truncate text-base text-zinc-700">{[formatPlace(event), event.venue].filter(Boolean).join(" · ")}</p>
        {!!event.moreDates && (
          <p className="text-sm text-zinc-500">
            +{event.moreDates} more {event.moreDates === 1 ? "date" : "dates"} this week
          </p>
        )}
        {cancelled && <span className="mt-1 inline-block rounded bg-red-100 px-2 py-0.5 text-xs font-bold uppercase text-red-700">Cancelled</span>}
      </div>

      {price && (
        <div className="hidden text-right md:block">
          <div className="text-sm text-zinc-500">From</div>
          <div className="text-lg font-bold text-[#121212]">{price}</div>
        </div>
      )}

      {/* No prefetch: each event page calls a rate-limited API. */}
      <Link
        href={`/events/${event.id}`}
        prefetch={false}
        className="shrink-0 rounded-md bg-[#024bde] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0139a8]"
      >
        Get ticket
      </Link>
    </li>
  );
}
