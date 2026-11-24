/**
 * Server-side client for the MusicBrainz API (no account or key needed).
 * Docs: https://musicbrainz.org/doc/MusicBrainz_API
 *
 * - Max ~1 request/second per IP; HTTP 503 means "slow down" or "busy".
 * - Events, places and relationships are core data (CC0). We deliberately skip
 *   tags/genres, which are licensed CC BY-NC-SA.
 * - Search results can't be sorted by date, so we load a whole week and sort it here.
 */
import { fetchArtistPhotos, type Photo } from "./artist-photos";
import type { EventItem, EventPage } from "./events";

const BASE_URL = "https://musicbrainz.org/ws/2";
const PAGE_SIZE = 100; // API maximum
const MAX_PAGES = 4;
const WINDOW_DAYS = 7;
const REQUEST_GAP_MS = 1_200;
const TIME_BUDGET_MS = 30_000;

type RawRelation = {
  type?: string;
  artist?: { id: string };
  place?: { id: string; name: string; area?: { name?: string } | null };
  area?: { name: string };
};
type RawEvent = {
  id: string;
  cancelled?: boolean;
  name: string;
  time?: string | null;
  "life-span"?: { begin?: string | null };
  relations?: RawRelation[];
};
type RawPlace = { id: string; area?: { name?: string } };

/** Upcoming concerts for the next 7 days, soonest first, one entry per artist. Throws on failure. */
export async function fetchUpcomingConcerts(size: number): Promise<EventPage> {
  const get = createClient();
  const today = new Date();
  const from = isoDate(today);
  const to = isoDate(new Date(today.getTime() + (WINDOW_DAYS - 1) * 86_400_000));
  const query = `type:concert AND begin:[${from} TO ${to}]`;

  const raw = new Map<string, RawEvent>();
  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await get<{ count: number; events: RawEvent[] }>("event", query, page * PAGE_SIZE);
    for (const e of res.events) raw.set(e.id, e);
    if ((page + 1) * PAGE_SIZE >= res.count) break;
  }

  const dated = [...raw.values()]
    .filter((e) => {
      const begin = beginOf(e);
      return /^\d{4}-\d{2}-\d{2}$/.test(begin) && begin >= from && begin <= to;
    })
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)));

  // Group repeat shows: keep each artist's first date and count the rest.
  const groups = new Map<string, { event: RawEvent; moreDates: number }>();
  for (const e of dated) {
    const key = artistIdOf(e) ?? e.name;
    const group = groups.get(key);
    if (group) group.moreDates++;
    else groups.set(key, { event: e, moreDates: 0 });
  }

  const shown = [...groups.values()].slice(0, size);
  const [cities, lookup] = await Promise.all([
    fetchCities(get, shown.map((g) => placeOf(g.event)?.id)),
    fetchArtistPhotos(shown.flatMap((g) => artistIdOf(g.event) ?? [])),
  ]);
  return {
    events: shown.map((g) => normalize(g.event, g.moreDates, cities, lookup.photos)),
    totalElements: groups.size,
    incomplete: !lookup.complete,
  };
}

/** One event by MusicBrainz ID, or null if it doesn't exist. Throws on failure. */
export async function fetchConcert(id: string): Promise<{ event: EventItem; incomplete: boolean } | null> {
  try {
    const event = await request<RawEvent>(`event/${id}?inc=artist-rels+place-rels+area-rels&fmt=json`, newPace());
    const artistId = artistIdOf(event);
    const { photos, complete } = await fetchArtistPhotos(artistId ? [artistId] : []);
    return { event: normalize(event, 0, new Map(), photos), incomplete: !complete };
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) return null;
    throw e;
  }
}

/** Looks up venue cities in one request. Optional: without them we still show the venue. */
async function fetchCities(get: Get, placeIds: (string | undefined)[]) {
  const cities = new Map<string, string>();
  const ids = [...new Set(placeIds.filter((id) => id !== undefined))].slice(0, PAGE_SIZE);
  if (ids.length === 0) return cities;
  try {
    const res = await get<{ places: RawPlace[] }>("place", ids.map((id) => `pid:${id}`).join(" OR "));
    for (const p of res.places) if (p.area?.name) cities.set(p.id, p.area.name);
  } catch {
    // Keep going without cities.
  }
  return cities;
}

function normalize(e: RawEvent, moreDates: number, cities: Map<string, string>, photos: Map<string, Photo>): EventItem {
  const photo = photos.get(artistIdOf(e) ?? "");
  const place = placeOf(e);
  return {
    id: e.id,
    provider: "musicbrainz",
    section: "concerts",
    name: e.name,
    url: `https://musicbrainz.org/event/${e.id}`,
    image: photo?.src ?? null,
    imageCredit: photo?.credit,
    localDate: beginOf(e),
    localTime: e.time ? e.time.slice(0, 5) : null,
    status: e.cancelled ? "cancelled" : null,
    genre: null,
    venue: place?.name ?? null,
    city: (place && cities.get(place.id)) ?? place?.area?.name ?? e.relations?.find((r) => r.type === "held in")?.area?.name ?? null,
    state: null,
    country: null,
    priceMin: null,
    priceMax: null,
    currency: null,
    moreDates,
  };
}

// ── HTTP ────────────────────────────────────────────────────────────────────

type Get = <T>(entity: "event" | "place", query: string, offset?: number) => Promise<T>;

class HttpError extends Error {
  status: number;
  constructor(status: number) {
    super(`MusicBrainz returned HTTP ${status}`);
    this.status = status;
  }
}

/** Spacing and time budget for one load. Not module-level: Next.js cached functions must not share state. */
type Pace = { deadline: number; nextSlot: number };
const newPace = (): Pace => ({ deadline: Date.now() + TIME_BUDGET_MS, nextSlot: 0 });

/** Search client: all its requests share one pace. */
function createClient(): Get {
  const pace = newPace();
  return <T,>(entity: "event" | "place", query: string, offset = 0) => {
    const params = new URLSearchParams({ query, fmt: "json", limit: String(PAGE_SIZE), offset: String(offset) });
    return request<T>(`${entity}?${params}`, pace);
  };
}

async function request<T>(path: string, pace: Pace): Promise<T> {
  // MusicBrainz asks for contact details here; set MUSICBRAINZ_CONTACT (URL or email) to provide them.
  const contact = process.env.MUSICBRAINZ_CONTACT?.trim();
  const userAgent = contact ? `event-demo/0.1 ( ${contact} )` : "event-demo/0.1";

  for (let attempt = 1; ; attempt++) {
    const start = Math.max(Date.now(), pace.nextSlot);
    if (start >= pace.deadline) throw new Error("MusicBrainz timed out");
    pace.nextSlot = start + REQUEST_GAP_MS;
    await sleep(Math.max(0, start - Date.now()));

    const res = await fetch(`${BASE_URL}/${path}`, {
      headers: { "User-Agent": userAgent, Accept: "application/json" },
      signal: AbortSignal.timeout(Math.max(1, Math.min(10_000, pace.deadline - Date.now()))),
    });
    if (res.ok) return (await res.json()) as T;
    if (res.status !== 503 || attempt >= 5) throw new HttpError(res.status);
    pace.nextSlot = Math.max(pace.nextSlot, Date.now() + REQUEST_GAP_MS * (attempt + 1)); // busy: back off
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ── Helpers ─────────────────────────────────────────────────────────────────

const isoDate = (d: Date) => d.toISOString().slice(0, 10);
const beginOf = (e: RawEvent) => e["life-span"]?.begin ?? "";
const sortKey = (e: RawEvent) => `${beginOf(e)}T${e.time || "99:99"}`; // unknown times go last
const artistIdOf = (e: RawEvent) => e.relations?.find((r) => r.type === "main performer" && r.artist)?.artist?.id;
const placeOf = (e: RawEvent) => e.relations?.find((r) => r.type === "held at" && r.place)?.place;
