/** Event types shared by every data source and the UI. */
import type { SectionSlug } from "./sections";

export type EventProvider = "musicbrainz" | "thesportsdb" | "ticketmaster" | "sample";

/** Author and licence of a photo, which must be shown with it. */
export type ImageCredit = { author: string; license: string; licenseUrl: string | null; sourceUrl: string };

export type EventItem = {
  id: string;
  provider: EventProvider;
  section: SectionSlug;
  name: string;
  /** The provider's page for this event; null for fictional sample events. */
  url: string | null;
  image: string | null;
  imageCredit?: ImageCredit;
  /** "YYYY-MM-DD", or null when the date is TBA. */
  localDate: string | null;
  /** "HH:mm", or null when the time is TBA. */
  localTime: string | null;
  /** Set when date and time are UTC instead of the venue's local time. */
  timeZone?: "UTC";
  status: string | null;
  genre: string | null;
  venue: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  priceMin: number | null;
  priceMax: number | null;
  currency: string | null;
  /** Later shows by the same artist that were grouped into this entry. */
  moreDates?: number;
};

export type EventPage = { events: EventItem[]; totalElements: number; /** Optional extras (photos) failed to load: try again soon. */ incomplete?: boolean };
