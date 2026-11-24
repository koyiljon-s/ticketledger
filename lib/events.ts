/** Event types shared by every data source (MusicBrainz, Ticketmaster, sample data) and the UI. */

export type EventProvider = "musicbrainz" | "ticketmaster" | "sample";

export type EventItem = {
  id: string;
  provider: EventProvider;
  name: string;
  /** The provider's page for this event; null for fictional sample events. */
  url: string | null;
  image: string | null;
  /** "YYYY-MM-DD", or null when the date is TBA. */
  localDate: string | null;
  /** "HH:mm", or null when the time is TBA. */
  localTime: string | null;
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

export type EventPage = { events: EventItem[]; totalElements: number };
