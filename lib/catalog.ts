/** Events for the UI: live data where a free source exists, with sample data as the backup. */
import { cacheLife } from "next/cache";
import type { EventItem, EventPage } from "./events";
import { fetchConcert, fetchUpcomingConcerts } from "./musicbrainz";
import { getSampleEvent, searchSampleEvents } from "./sample-events";
import type { SectionSlug } from "./sections";
import { fetchGame, fetchUpcomingGames } from "./sportsdb";

export type SampleReason = "forced" | "unavailable" | "no_source";

export type EventList = EventPage & { source: "live" | "sample"; sampleReason?: SampleReason };

const LIST_SIZE = 60;

const LIVE_SOURCES: Partial<Record<SectionSlug, (size: number) => Promise<EventPage>>> = {
  concerts: fetchUpcomingConcerts,
  sports: fetchUpcomingGames,
};

const sampleList = (section: SectionSlug, sampleReason: SampleReason): EventList => ({
  ...searchSampleEvents({ section, size: LIST_SIZE }),
  source: "sample",
  sampleReason,
});

export async function getEvents(section: SectionSlug): Promise<EventList> {
  if (!LIVE_SOURCES[section]) return sampleList(section, "no_source");
  if (process.env.EVENTS_USE_SAMPLE === "true") return sampleList(section, "forced");
  return loadEvents(section);
}

async function loadEvents(section: SectionSlug): Promise<EventList> {
  "use cache";
  try {
    const page = await LIVE_SOURCES[section]!(LIST_SIZE);
    cacheLife("hours");
    return { ...page, source: "live" };
  } catch (e) {
    console.warn(`Live ${section} unavailable, using sample data:`, e instanceof Error ? e.message : e);
    cacheLife("minutes"); // try the live source again soon
    return sampleList(section, "unavailable");
  }
}

export type EventDetail = { status: "ok"; event: EventItem } | { status: "not_found" } | { status: "unavailable" };

const UUID = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
const SPORT_ID = /^sport-\d{1,12}$/;

/** One event by ID: a sample ID, a MusicBrainz UUID or "sport-<TheSportsDB ID>". */
export async function getEvent(id: string): Promise<EventDetail> {
  const sample = getSampleEvent(id);
  if (sample) return { status: "ok", event: sample };
  return UUID.test(id) || SPORT_ID.test(id) ? loadEvent(id) : { status: "not_found" };
}

async function loadEvent(id: string): Promise<EventDetail> {
  "use cache";
  try {
    const event = SPORT_ID.test(id) ? await fetchGame(id.slice("sport-".length)) : await fetchConcert(id);
    cacheLife("hours");
    return event ? { status: "ok", event } : { status: "not_found" };
  } catch (e) {
    console.warn("Event unavailable:", e instanceof Error ? e.message : e);
    cacheLife("minutes");
    return { status: "unavailable" };
  }
}
