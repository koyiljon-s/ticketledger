/**
 * Server-side client for the official Ticketmaster Discovery API v2.
 * Docs: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
 *
 * Only import this from server code (route handlers / server components):
 * it reads TICKETMASTER_API_KEY, which must never reach the browser.
 *
 * Terms notes: results are cached only briefly (1 hour) and we link back
 * to the event's ticketmaster.com URL. We never buy or reserve real tickets.
 */
import { cacheLife } from "next/cache";
import type { EventCategory } from "./chain/types";

const BASE = "https://app.ticketmaster.com/discovery/v2";

/** Normalized event shape shared with the client. */
export type TmEvent = {
  id: string;
  name: string;
  url: string;
  image: string | null;
  date: string; // "YYYY-MM-DDTHH:mm" local time, or "YYYY-MM-DD"
  status: string | null;
  segment: string | null;
  genre: string | null;
  category: EventCategory;
  venue: string | null;
  city: string | null;
  country: string | null;
  priceMin: number | null;
  priceMax: number | null;
  currency: string | null;
};

export type TmSearchResult = {
  events: TmEvent[];
  page: { number: number; totalPages: number; totalElements: number };
};

export type TmSearchParams = {
  keyword: string;
  segment: string; // "", "Music", "Sports", "Arts & Theatre", "Film", "Miscellaneous"
  countryCode: string;
  page: number;
};

export class TicketmasterError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export function hasTicketmasterKey() {
  return Boolean(process.env.TICKETMASTER_API_KEY);
}

// ── Raw API types (only the fields we use) ───────────────────────────────
type RawImage = { url: string; ratio?: string; width?: number; height?: number; fallback?: boolean };
type RawEvent = {
  id: string;
  name: string;
  url?: string;
  images?: RawImage[];
  dates?: { start?: { localDate?: string; localTime?: string; dateTime?: string }; status?: { code?: string } };
  classifications?: { primary?: boolean; segment?: { name?: string }; genre?: { name?: string } }[];
  priceRanges?: { min?: number; max?: number; currency?: string }[];
  _embedded?: { venues?: { name?: string; city?: { name?: string }; country?: { countryCode?: string } }[] };
};
type RawResponse = {
  _embedded?: { events?: RawEvent[] };
  page?: { number?: number; totalPages?: number; totalElements?: number };
};

function toCategory(segment?: string, genre?: string): EventCategory {
  const g = (genre ?? "").toLowerCase();
  if (g.includes("festival")) return "Festival";
  switch (segment) {
    case "Music":
      return "Concert";
    case "Sports":
      return g.includes("esport") ? "eSports" : "Sports";
    case "Arts & Theatre":
      return "Theatre";
    case "Film":
      return "Film";
    default:
      return "Festival";
  }
}

function pickImage(images: RawImage[] = []): string | null {
  // Prefer a wide, non-fallback 16:9 image of reasonable size for banners.
  const wide = images
    .filter((i) => i.ratio === "16_9" && !i.fallback)
    .sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
  const good = wide.find((i) => (i.width ?? 0) <= 1200) ?? wide[0] ?? images[0];
  return good?.url ?? null;
}

function normalize(e: RawEvent): TmEvent {
  const cls = e.classifications?.find((c) => c.primary) ?? e.classifications?.[0];
  const venue = e._embedded?.venues?.[0];
  const start = e.dates?.start;
  const time = start?.localTime ? String(start.localTime).slice(0, 5) : null;
  const price = e.priceRanges?.[0];
  const segment = cls?.segment?.name && cls.segment.name !== "Undefined" ? cls.segment.name : null;
  const genre = cls?.genre?.name && cls.genre.name !== "Undefined" ? cls.genre.name : null;
  return {
    id: e.id,
    name: e.name,
    url: e.url ?? `https://www.ticketmaster.com/`,
    image: pickImage(e.images),
    date: start?.localDate ? (time ? `${start.localDate}T${time}` : start.localDate) : "",
    status: e.dates?.status?.code ?? null,
    segment,
    genre,
    category: toCategory(segment ?? undefined, genre ?? undefined),
    venue: venue?.name ?? null,
    city: venue?.city?.name ?? null,
    country: venue?.country?.countryCode ?? null,
    priceMin: price?.min ?? null,
    priceMax: price?.max ?? null,
    currency: price?.currency ?? null,
  };
}

export async function searchTicketmasterEvents(params: TmSearchParams): Promise<TmSearchResult> {
  "use cache";
  cacheLife("hours");

  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) throw new TicketmasterError("TICKETMASTER_API_KEY is not set", 503);

  const qs = new URLSearchParams({
    apikey: apiKey,
    size: "20",
    page: String(Math.max(0, Math.min(params.page, 49))), // API only allows size*page < 1000
    sort: "date,asc",
    locale: "*",
  });
  if (params.keyword) qs.set("keyword", params.keyword);
  if (params.segment) qs.set("segmentName", params.segment);
  if (params.countryCode) qs.set("countryCode", params.countryCode);

  const res = await fetch(`${BASE}/events.json?${qs}`);
  if (!res.ok) {
    const msg =
      res.status === 401
        ? "Ticketmaster rejected the API key"
        : res.status === 429
          ? "Ticketmaster rate limit reached (5 req/s, 5000/day) — try again shortly"
          : `Ticketmaster API error (${res.status})`;
    throw new TicketmasterError(msg, res.status);
  }
  const data = (await res.json()) as RawResponse;
  return {
    events: (data._embedded?.events ?? []).map(normalize),
    page: {
      number: data.page?.number ?? 0,
      totalPages: data.page?.totalPages ?? 0,
      totalElements: data.page?.totalElements ?? 0,
    },
  };
}
