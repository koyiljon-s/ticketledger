/**
 * Sample data mode.
 *
 * Fictional events in the same shape the live sources return, used when a
 * live source is unavailable or sample data is forced (e.g. as an offline
 * backup for a presentation). The artists and shows are made up on
 * purpose so they are never mistaken for real events. Venues and cities are real.
 */
import type { EventItem, EventPage } from "./events";
import type { TmSearch } from "./ticketmaster";

type Venue = { venue: string; city: string; state: string | null; country: string };

const V = {
  msg: { venue: "Madison Square Garden", city: "New York", state: "NY", country: "US" },
  forum: { venue: "Kia Forum", city: "Inglewood", state: "CA", country: "US" },
  united: { venue: "United Center", city: "Chicago", state: "IL", country: "US" },
  redRocks: { venue: "Red Rocks Amphitheatre", city: "Morrison", state: "CO", country: "US" },
  ryman: { venue: "Ryman Auditorium", city: "Nashville", state: "TN", country: "US" },
  o2: { venue: "The O2", city: "London", state: null, country: "GB" },
  ziggo: { venue: "Ziggo Dome", city: "Amsterdam", state: null, country: "NL" },
  scotiabank: { venue: "Scotiabank Arena", city: "Toronto", state: "ON", country: "CA" },
  fillmore: { venue: "The Fillmore", city: "San Francisco", state: "CA", country: "US" },
  bluenote: { venue: "Blue Note", city: "New York", state: "NY", country: "US" },
  hollywoodBowl: { venue: "Hollywood Bowl", city: "Los Angeles", state: "CA", country: "US" },
  kaseya: { venue: "Kaseya Center", city: "Miami", state: "FL", country: "US" },
  td: { venue: "TD Garden", city: "Boston", state: "MA", country: "US" },
  accor: { venue: "Accor Arena", city: "Paris", state: null, country: "FR" },
} satisfies Record<string, Venue>;

// [artist / show name, genre, venue, date, time, min price, max price]
type Row = [string, string, Venue, string, string, number, number];

const CONCERTS: Row[] = [
  ["Neon Harbor: The Afterglow Tour", "Pop", V.msg, "2026-12-04", "19:30", 79, 349],
  ["The Velvet Static", "Rock", V.fillmore, "2026-12-06", "20:00", 45, 95],
  ["Luna Marquez: Corazón Eléctrico", "Latin", V.kaseya, "2026-12-11", "20:00", 65, 280],
  ["Neon Harbor: The Afterglow Tour", "Pop", V.united, "2026-12-12", "19:30", 75, 329],
  ["Kai Rivers", "R&B", V.td, "2026-12-13", "20:00", 59, 210],
  ["Midnight Echoes Live", "Alternative", V.o2, "2026-12-17", "19:00", 55, 160],
  ["Dust & Daylight", "Country", V.ryman, "2026-12-18", "19:30", 49, 135],
  ["Neon Harbor: The Afterglow Tour", "Pop", V.forum, "2026-12-19", "19:30", 85, 369],
  ["Orbit Theory b2b Solace", "Electronic", V.redRocks, "2027-01-08", "18:30", 69, 189],
  ["The Ellington Variations Quartet", "Jazz", V.bluenote, "2027-01-09", "20:00", 40, 85],
  ["MC Atlas: Gravity World Tour", "Hip-Hop/Rap", V.scotiabank, "2027-01-15", "20:00", 69, 299],
  ["Kai Rivers", "R&B", V.forum, "2027-01-16", "20:00", 65, 230],
  ["Paper Satellites", "Alternative", V.ziggo, "2027-01-22", "20:30", 45, 120],
  ["Luna Marquez: Corazón Eléctrico", "Latin", V.forum, "2027-01-23", "20:00", 69, 295],
  ["MC Atlas: Gravity World Tour", "Hip-Hop/Rap", V.msg, "2027-01-29", "20:00", 79, 319],
  ["Symphony of Light: A Film Score Night", "Classical", V.hollywoodBowl, "2027-02-05", "19:00", 35, 150],
  ["The Velvet Static", "Rock", V.td, "2027-02-06", "20:00", 49, 110],
  ["Golden Hour Collective", "Pop", V.accor, "2027-02-12", "20:00", 55, 175],
  ["Dust & Daylight", "Country", V.united, "2027-02-13", "19:30", 55, 165],
  ["Midnight Echoes Live", "Alternative", V.accor, "2027-02-19", "19:00", 59, 170],
  ["MC Atlas: Gravity World Tour", "Hip-Hop/Rap", V.united, "2027-02-20", "20:00", 75, 309],
  ["Orbit Theory", "Electronic", V.o2, "2027-02-26", "21:00", 59, 149],
  ["Iron Lanterns: Reunion Tour", "Rock", V.forum, "2027-03-05", "19:30", 89, 399],
  ["Saffron Skies", "R&B", V.fillmore, "2027-03-06", "20:00", 39, 89],
  ["Iron Lanterns: Reunion Tour", "Rock", V.msg, "2027-03-12", "19:30", 95, 425],
  ["Golden Hour Collective", "Pop", V.o2, "2027-03-13", "19:30", 59, 185],
  ["The Ellington Variations Quartet", "Jazz", V.fillmore, "2027-03-19", "20:00", 42, 90],
  ["Luna Marquez: Corazón Eléctrico", "Latin", V.msg, "2027-03-20", "20:00", 75, 315],
  ["Dust & Daylight", "Country", V.redRocks, "2027-04-02", "19:00", 59, 175],
  ["Neon Harbor: The Afterglow Tour", "Pop", V.o2, "2027-04-09", "19:30", 89, 389],
];

/** Sample events tagged with their Ticketmaster segment so section filters work. */
const SAMPLE_EVENTS: (EventItem & { segment: string })[] = CONCERTS.map(([name, genre, v, date, time, min, max], i) => ({
  id: `sample-music-${i + 1}`,
  provider: "sample",
  name,
  url: null, // no real ticket page for fictional events
  image: null,
  localDate: date,
  localTime: time,
  status: "onsale",
  genre,
  venue: v.venue,
  city: v.city,
  state: v.state,
  country: v.country,
  priceMin: min,
  priceMax: max,
  currency: v.country === "GB" ? "GBP" : v.country === "CA" ? "CAD" : v.country === "US" ? "USD" : "EUR",
  segment: "Music",
}));

/** Applies the same filters the live API supports, in a simplified form. */
export function searchSampleEvents(search: TmSearch): EventPage {
  const keyword = search.keyword?.toLowerCase();
  const city = search.city?.toLowerCase();
  const matches = SAMPLE_EVENTS.filter(
    (e) =>
      (!search.segmentName || e.segment === search.segmentName) &&
      (!search.countryCode || e.country === search.countryCode) &&
      (!city || e.city?.toLowerCase().includes(city)) &&
      (!keyword || `${e.name} ${e.venue} ${e.genre}`.toLowerCase().includes(keyword)),
  );
  return {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    events: matches.slice(0, search.size ?? 20).map(({ segment, ...event }) => event),
    totalElements: matches.length,
  };
}

export function getSampleEvent(id: string): EventItem | null {
  return SAMPLE_EVENTS.find((e) => e.id === id) ?? null;
}
