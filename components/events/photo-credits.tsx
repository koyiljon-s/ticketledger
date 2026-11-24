import type { EventItem, ImageCredit } from "@/lib/events";

export function PhotoCredit({ credit }: { credit: ImageCredit }) {
  return (
    <>
      Photo:{" "}
      <a href={credit.sourceUrl} target="_blank" rel="noreferrer" className="underline">
        {credit.author}
      </a>
      ,{" "}
      {credit.licenseUrl ? (
        <a href={credit.licenseUrl} target="_blank" rel="noreferrer" className="underline">
          {credit.license}
        </a>
      ) : (
        credit.license
      )}
      , cropped
    </>
  );
}

/** Credits for every photo in a list of events. */
export function PhotoCredits({ events }: { events: EventItem[] }) {
  const credited = events.filter((e) => e.image && e.imageCredit);
  if (credited.length === 0) return null;
  return (
    <details className="mt-4 text-sm text-zinc-500">
      <summary className="cursor-pointer">Photo credits ({credited.length}), from Wikimedia Commons</summary>
      <ul className="mt-2 space-y-1">
        {credited.map((e) => (
          <li key={e.id}>
            {e.name}. <PhotoCredit credit={e.imageCredit!} />
          </li>
        ))}
      </ul>
    </details>
  );
}
