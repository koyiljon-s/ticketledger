/**
 * Server-side client for the public Ticketmaster Discovery API v2.
 * Docs: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
 *
 * Only import this from server code: it reads TICKETMASTER_API_KEY, which must
 * never be sent to the browser. Responses are cached for about an hour
 * (Ticketmaster's terms allow caching only for "reasonable periods").
 *
 * Sample data mode: without a key (or with TICKETMASTER_USE_SAMPLE=true) the
 * same functions return fictional events from ./sample-events.ts instead.
 */
import { cacheLife } from "next/cache";
import type { EventItem, EventPage } from "./events";
import { searchSampleEvents } from "./sample-events";

const BASE_URL = "https://app.ticketmaster.com/discovery/v2";

export type DataSource = "live" | "sample";

export type TmSearch = {
  segmentName?: string;
  classificationName?: string;
  keyword?: string;
  city?: string;
  countryCode?: string;
  size?: number;
};

export type TmResult =
  | { ok: true; source: DataSource; data: EventPage }
  | { ok: false; reason: "unauthorized" | "rate_limited" | "upstream"; message: string };

// ── Raw API shapes (only the fields we read) ────────────────────────────────

type RawImage = { url: string; ratio?: string; width?: number; fallback?: boolean };
type RawEvent = {
  id: string;
  name: string;
  url?: string;
  images?: RawImage[];
  dates?: { start?: { localDate?: string; localTime?: string }; status?: { code?: string } };
  classifications?: { primary?: boolean; genre?: { name?: string } }[];
  priceRanges?: { min?: number; max?: number; currency?: string }[];
  _embedded?: {
    venues?: { name?: string; city?: { name?: string }; state?: { stateCode?: string }; country?: { countryCode?: string } }[];
  };
};
type RawResponse = { _embedded?: { events?: RawEvent[] }; page?: { totalElements?: number } };

class TicketmasterError extends Error {
  constructor(
    public reason: Exclude<TmResult, { ok: true }>["reason"],
    message: string,
  ) {
    super(message);
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

/** Searches events. Never throws: failures come back as `{ ok: false }`. */
export async function searchEvents(search: TmSearch): Promise<TmResult> {
  if (getDataSource() === "sample") {
    return { ok: true, source: "sample", data: searchSampleEvents(search) };
  }
  try {
    // Only successful responses reach the cache: errors are thrown inside and caught here.
    return { ok: true, source: "live", data: await fetchEvents(search) };
  } catch (e) {
    if (e instanceof TicketmasterError) return { ok: false, reason: e.reason, message: e.message };
    return { ok: false, reason: "upstream", message: "Could not reach Ticketmaster." };
  }
}

/** "sample" when no API key is set or TICKETMASTER_USE_SAMPLE=true; otherwise "live". */
export function getDataSource(): DataSource {
  if (process.env.TICKETMASTER_USE_SAMPLE === "true") return "sample";
  return process.env.TICKETMASTER_API_KEY ? "live" : "sample";
}

async function fetchEvents(search: TmSearch): Promise<EventPage> {
  "use cache";
  cacheLife("hours");

  const params = new URLSearchParams({
    apikey: process.env.TICKETMASTER_API_KEY ?? "",
    size: String(search.size ?? 20),
    sort: "date,asc",
    locale: "*",
  });
  for (const key of ["segmentName", "classificationName", "keyword", "city", "countryCode"] as const) {
    const value = search[key];
    if (value) params.set(key, value);
  }

  const res = await fetch(`${BASE_URL}/events.json?${params}`);
  if (res.status === 401) throw new TicketmasterError("unauthorized", "Ticketmaster rejected the API key.");
  if (res.status === 429) throw new TicketmasterError("rate_limited", "Ticketmaster rate limit reached. Try again in a moment.");
  if (!res.ok) throw new TicketmasterError("upstream", `Ticketmaster returned HTTP ${res.status}.`);

  const json = (await res.json()) as RawResponse;
  return {
    events: (json._embedded?.events ?? []).map(normalizeEvent),
    totalElements: json.page?.totalElements ?? 0,
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function normalizeEvent(e: RawEvent): EventItem {
  const venue = e._embedded?.venues?.[0];
  const cls = e.classifications?.find((c) => c.primary) ?? e.classifications?.[0];
  const price = e.priceRanges?.[0];
  const genre = cls?.genre?.name;
  return {
    id: e.id,
    provider: "ticketmaster",
    name: e.name,
    url: e.url ?? null,
    image: pickImage(e.images),
    localDate: e.dates?.start?.localDate ?? null,
    localTime: e.dates?.start?.localTime ? String(e.dates.start.localTime).slice(0, 5) : null,
    status: e.dates?.status?.code ?? null,
    genre: genre && genre !== "Undefined" ? genre : null,
    venue: venue?.name ?? null,
    city: venue?.city?.name ?? null,
    state: venue?.state?.stateCode ?? null,
    country: venue?.country?.countryCode ?? null,
    priceMin: price?.min ?? null,
    priceMax: price?.max ?? null,
    currency: price?.currency ?? null,
  };
}

/** Prefers a wide (16:9), non-placeholder image around 640–1200px. */
function pickImage(images: RawImage[] = []): string | null {
  const wide = images.filter((i) => i.ratio === "16_9" && !i.fallback).sort((a, b) => (a.width ?? 0) - (b.width ?? 0));
  const best = wide.find((i) => (i.width ?? 0) >= 640) ?? wide.at(-1) ?? images[0];
  return best?.url ?? null;
}
