import type { TmEvent } from "@/lib/ticketmaster";
import { EventImage } from "./event-image";
import { dateParts, formatPlace } from "./format";

/** Image-first tile for the "Featured" grid. Live events open on Ticketmaster. */
export function EventCard({ event }: { event: TmEvent }) {
  const d = dateParts(event.localDate);
  const body = (
    <>
      <div className="relative aspect-video overflow-hidden bg-zinc-200">
        <EventImage
          event={event}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="transition duration-300 group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <div className="text-sm font-bold uppercase text-[#024bde]">{d ? `${d.weekday}, ${d.month} ${d.day}, ${d.year}` : "Date TBA"}</div>
        <h3 className="mt-1 line-clamp-2 text-lg font-bold leading-snug text-[#121212] group-hover:underline">{event.name}</h3>
        <p className="mt-1 truncate text-sm text-zinc-600">{[event.venue, formatPlace(event)].filter(Boolean).join(" · ")}</p>
      </div>
    </>
  );

  const className = "group block overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-zinc-200 transition hover:shadow-lg";
  return event.url ? (
    <a href={event.url} target="_blank" rel="noreferrer" className={className}>
      {body}
    </a>
  ) : (
    <div className={className}>{body}</div>
  );
}
