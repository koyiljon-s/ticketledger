/** Searches the events already loaded for the five sections, so it makes no extra API calls. */
import { getEvents } from "./catalog";
import type { EventItem } from "./events";
import { SECTIONS } from "./sections";

export type SearchQuery = { keyword: string; city: string; startDate: string };

type RawParams = Record<string, string | string[] | undefined>;

/** Cleans up URL parameters: single values, trimmed, limited in length, real dates only. */
export function parseQuery(params: RawParams): SearchQuery {
  const text = (name: string) => {
    const value = params[name];
    return (Array.isArray(value) ? value[0] : value)?.trim().slice(0, 100) ?? "";
  };
  const date = text("startDate");
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date));
  return { keyword: text("keyword"), city: text("city"), startDate: valid ? date : "" };
}

/** Lower case, without accents: "São Paulo" matches "sao paulo". */
const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** Every word of the query must appear somewhere in the fields. */
function matches(query: string, fields: (string | null)[]) {
  const haystack = fold(fields.filter(Boolean).join(" "));
  return fold(query).split(/\s+/).every((word) => haystack.includes(word));
}

export async function searchEvents(q: SearchQuery): Promise<EventItem[]> {
  const lists = await Promise.all(SECTIONS.map((s) => getEvents(s.slug)));
  return lists
    .flatMap((l) => l.events)
    .filter(
      (e) =>
        matches(q.keyword, [e.name, e.venue, e.genre, SECTIONS.find((s) => s.slug === e.section)?.label ?? null]) &&
        matches(q.city, [e.city, e.state, e.country]) &&
        (!q.startDate || (e.localDate !== null && e.localDate >= q.startDate)),
    )
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
}

const sortKey = (e: EventItem) => `${e.localDate ?? "9999"}T${e.localTime ?? "99:99"}`;
