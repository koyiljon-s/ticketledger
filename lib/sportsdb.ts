/**
 * Server-side client for TheSportsDB (free shared key "123", no account needed).
 * Docs: https://www.thesportsdb.com/documentation
 *
 * - Free limits: 30 requests/minute; 1 game per league, 3 per sport and day.
 *   So we combine several small queries (17 in total).
 * - Dates and times are UTC.
 * - We don't show its images: their licences vary and must be checked one by one.
 */
import type { EventItem, EventPage } from "./events";

const BASE_URL = "https://www.thesportsdb.com/api/v1/json/123";
// Premier League, La Liga, Bundesliga, Serie A, Ligue 1, NBA, NHL, NFL
const LEAGUES = [4328, 4335, 4331, 4332, 4334, 4387, 4380, 4391];
const SPORTS = ["Soccer", "Basketball", "Ice Hockey"];
const DAYS = 3;

type RawGame = {
  idEvent: string;
  strEvent: string;
  strLeague?: string | null;
  strSport?: string | null;
  dateEvent?: string | null;
  strTime?: string | null;
  strVenue?: string | null;
  strCity?: string | null;
  strCountry?: string | null;
  strStatus?: string | null;
  strPostponed?: string | null;
};

async function get(path: string): Promise<RawGame[]> {
  const res = await fetch(`${BASE_URL}/${path}`, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`TheSportsDB returned HTTP ${res.status}`);
  const json = (await res.json()) as { events?: RawGame[] | null } | null;
  return json?.events ?? [];
}

/** Upcoming games, soonest first. Some failed queries are tolerated; throws if nothing loads. */
export async function fetchUpcomingGames(size: number): Promise<EventPage> {
  const now = new Date();
  const days = Array.from({ length: DAYS }, (_, i) => new Date(now.getTime() + i * 86_400_000).toISOString().slice(0, 10));
  const paths = [
    ...LEAGUES.map((id) => `eventsnextleague.php?id=${id}`),
    ...days.flatMap((d) => SPORTS.map((s) => `eventsday.php?d=${d}&s=${encodeURIComponent(s)}`)),
  ];
  const results = await Promise.allSettled(paths.map(get));
  const games = new Map<string, EventItem>();
  for (const r of results) {
    if (r.status === "rejected") continue;
    for (const raw of r.value) {
      const game = normalize(raw);
      const starts = game.localDate && `${game.localDate}T${game.localTime ?? "23:59"}`;
      if (game.status === null && starts && starts >= now.toISOString().slice(0, 16) && !hasStarted(raw)) games.set(game.id, game);
    }
  }
  if (games.size === 0) {
    const failed = results.find((r) => r.status === "rejected");
    throw failed ? failed.reason : new Error("TheSportsDB returned no upcoming games");
  }
  const key = (e: EventItem) => `${e.localDate}T${e.localTime ?? "99:99"}`;
  const sorted = [...games.values()].sort((a, b) => key(a).localeCompare(key(b)));
  return { events: sorted.slice(0, size), totalElements: sorted.length };
}

/** One game by TheSportsDB ID, or null if it doesn't exist. Throws on failure. */
export async function fetchGame(id: string): Promise<EventItem | null> {
  const [raw] = await get(`lookupevent.php?id=${id}`);
  return raw ? normalize(raw) : null;
}

const hasStarted = (g: RawGame) => !["", "NS", "Not Started", "TBD"].includes(g.strStatus ?? "");

function normalize(g: RawGame): EventItem {
  const time = g.strTime?.match(/^\d{2}:\d{2}/)?.[0] ?? null;
  return {
    id: `sport-${g.idEvent}`,
    provider: "thesportsdb",
    section: "sports",
    name: g.strEvent,
    url: `https://www.thesportsdb.com/event/${g.idEvent}`,
    image: null,
    localDate: g.dateEvent && /^\d{4}-\d{2}-\d{2}$/.test(g.dateEvent) ? g.dateEvent : null,
    localTime: time,
    timeZone: "UTC",
    status: g.strPostponed === "yes" || g.strStatus === "PST" ? "postponed" : g.strStatus === "CANC" ? "cancelled" : null,
    genre: g.strLeague || g.strSport || null,
    venue: g.strVenue && g.strVenue !== "Unknown" ? g.strVenue : null,
    city: g.strCity || null,
    state: null,
    country: g.strCountry || null,
    priceMin: null,
    priceMax: null,
    currency: null,
  };
}
