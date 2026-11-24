/** Concerts for the UI: live MusicBrainz data, with sample data as the backup. */
import { cacheLife } from "next/cache";
import type { EventItem, EventPage } from "./events";
import { fetchConcert, fetchUpcomingConcerts } from "./musicbrainz";
import { getSampleEvent, searchSampleEvents } from "./sample-events";

export type ConcertResult = EventPage & {
  source: "live" | "sample";
  /** Why sample data is shown: forced by EVENTS_USE_SAMPLE, or MusicBrainz failed. */
  sampleReason?: "forced" | "unavailable";
};

export async function getConcerts(size: number): Promise<ConcertResult> {
  if (process.env.EVENTS_USE_SAMPLE === "true") {
    return { ...searchSampleEvents({ segmentName: "Music", size }), source: "sample", sampleReason: "forced" };
  }
  return loadConcerts(size);
}

async function loadConcerts(size: number): Promise<ConcertResult> {
  "use cache";
  try {
    const page = await fetchUpcomingConcerts(size);
    cacheLife("hours");
    return { ...page, source: "live" };
  } catch (e) {
    console.warn("MusicBrainz unavailable, using sample data:", e instanceof Error ? e.message : e);
    cacheLife("minutes"); // try the live API again soon
    return { ...searchSampleEvents({ segmentName: "Music", size }), source: "sample", sampleReason: "unavailable" };
  }
}

export type ConcertDetail = { status: "ok"; event: EventItem } | { status: "not_found" } | { status: "unavailable" };

const UUID = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;

/** One concert by ID: a MusicBrainz UUID or a sample event ID. */
export async function getConcert(id: string): Promise<ConcertDetail> {
  const sample = getSampleEvent(id);
  if (sample) return { status: "ok", event: sample };
  return UUID.test(id) ? loadConcert(id) : { status: "not_found" };
}

async function loadConcert(id: string): Promise<ConcertDetail> {
  "use cache";
  try {
    const event = await fetchConcert(id);
    cacheLife("hours");
    return event ? { status: "ok", event } : { status: "not_found" };
  } catch (e) {
    console.warn("MusicBrainz event unavailable:", e instanceof Error ? e.message : e);
    cacheLife("minutes");
    return { status: "unavailable" };
  }
}
