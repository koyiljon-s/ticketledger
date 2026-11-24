/**
 * Sample data mode.
 *
 * Fictional events in the same shape the live sources return, used when a
 * live source is unavailable or sample data is forced (e.g. as an offline
 * backup for a presentation). The artists and shows are made up on
 * purpose so they are never mistaken for real events. Venues and cities are real.
 */
import type { EventItem, EventPage } from "./events";
import type { SectionSlug } from "./sections";

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
  broadway: { venue: "Majestic Theatre", city: "New York", state: "NY", country: "US" },
  operaHouse: { venue: "Sydney Opera House", city: "Sydney", state: null, country: "AU" },
  national: { venue: "National Theatre", city: "London", state: null, country: "GB" },
  navoi: { venue: "Navoi Theater", city: "Tashkent", state: null, country: "UZ" },
  tcl: { venue: "TCL Chinese Theatre", city: "Los Angeles", state: "CA", country: "US" },
  bfi: { venue: "BFI Southbank", city: "London", state: null, country: "GB" },
  bell: { venue: "TIFF Lightbox", city: "Toronto", state: "ON", country: "CA" },
  wembley: { venue: "Wembley Stadium", city: "London", state: null, country: "GB" },
  accor: { venue: "Accor Arena", city: "Paris", state: null, country: "FR" },
} satisfies Record<string, Venue>;

// [name, genre, venue, date, time]
type Row = [string, string, Venue, string, string];

const CONCERTS: Row[] = [
  ["Neon Harbor: The Afterglow Tour", "Pop", V.msg, "2026-12-04", "19:30"],
  ["The Velvet Static", "Rock", V.fillmore, "2026-12-06", "20:00"],
  ["Luna Marquez: Corazón Eléctrico", "Latin", V.kaseya, "2026-12-11", "20:00"],
  ["Neon Harbor: The Afterglow Tour", "Pop", V.united, "2026-12-12", "19:30"],
  ["Kai Rivers", "R&B", V.td, "2026-12-13", "20:00"],
  ["Midnight Echoes Live", "Alternative", V.o2, "2026-12-17", "19:00"],
  ["Dust & Daylight", "Country", V.ryman, "2026-12-18", "19:30"],
  ["Neon Harbor: The Afterglow Tour", "Pop", V.forum, "2026-12-19", "19:30"],
  ["Orbit Theory b2b Solace", "Electronic", V.redRocks, "2027-01-08", "18:30"],
  ["The Ellington Variations Quartet", "Jazz", V.bluenote, "2027-01-09", "20:00"],
  ["MC Atlas: Gravity World Tour", "Hip-Hop/Rap", V.scotiabank, "2027-01-15", "20:00"],
  ["Kai Rivers", "R&B", V.forum, "2027-01-16", "20:00"],
  ["Paper Satellites", "Alternative", V.ziggo, "2027-01-22", "20:30"],
  ["Luna Marquez: Corazón Eléctrico", "Latin", V.forum, "2027-01-23", "20:00"],
  ["MC Atlas: Gravity World Tour", "Hip-Hop/Rap", V.msg, "2027-01-29", "20:00"],
  ["Symphony of Light: A Film Score Night", "Classical", V.hollywoodBowl, "2027-02-05", "19:00"],
  ["The Velvet Static", "Rock", V.td, "2027-02-06", "20:00"],
  ["Golden Hour Collective", "Pop", V.accor, "2027-02-12", "20:00"],
  ["Dust & Daylight", "Country", V.united, "2027-02-13", "19:30"],
  ["Midnight Echoes Live", "Alternative", V.accor, "2027-02-19", "19:00"],
  ["MC Atlas: Gravity World Tour", "Hip-Hop/Rap", V.united, "2027-02-20", "20:00"],
  ["Orbit Theory", "Electronic", V.o2, "2027-02-26", "21:00"],
  ["Iron Lanterns: Reunion Tour", "Rock", V.forum, "2027-03-05", "19:30"],
  ["Saffron Skies", "R&B", V.fillmore, "2027-03-06", "20:00"],
  ["Iron Lanterns: Reunion Tour", "Rock", V.msg, "2027-03-12", "19:30"],
  ["Golden Hour Collective", "Pop", V.o2, "2027-03-13", "19:30"],
  ["The Ellington Variations Quartet", "Jazz", V.fillmore, "2027-03-19", "20:00"],
  ["Luna Marquez: Corazón Eléctrico", "Latin", V.msg, "2027-03-20", "20:00"],
  ["Dust & Daylight", "Country", V.redRocks, "2027-04-02", "19:00"],
  ["Neon Harbor: The Afterglow Tour", "Pop", V.o2, "2027-04-09", "19:30"],
];

const SPORTS: Row[] = [
  ["Harbor City Comets vs Northgate Foxes", "Basketball", V.msg, "2026-12-05", "19:30"],
  ["Riverton United vs Stonebridge Town", "Soccer", V.wembley, "2026-12-12", "15:00"],
  ["Lakeside Wolves vs Iron Bay Bears", "Ice Hockey", V.scotiabank, "2026-12-16", "19:00"],
  ["Harbor City Comets vs Sunvale Hawks", "Basketball", V.td, "2027-01-09", "19:30"],
  ["Maple Ridge Moose vs Lakeside Wolves", "Ice Hockey", V.united, "2027-01-23", "19:00"],
  ["Open Court Masters: Final", "Tennis", V.accor, "2027-02-07", "14:00"],
  ["Champions Fight Night IX", "Boxing", V.o2, "2027-02-27", "18:00"],
  ["Riverton United vs Eastmoor Rovers", "Soccer", V.wembley, "2027-03-20", "16:00"],
];

const ARTS: Row[] = [
  ["The Clockmaker's Daughter", "Musical", V.broadway, "2026-12-04", "19:00"],
  ["Letters from the Lighthouse", "Play", V.national, "2026-12-10", "19:30"],
  ["The Glass Garden", "Ballet", V.navoi, "2026-12-18", "18:30"],
  ["The Silk Caravan", "Opera", V.navoi, "2027-01-16", "18:30"],
  ["Midnight at the Meridian", "Musical", V.operaHouse, "2027-01-22", "19:30"],
  ["Two Chairs and a Storm", "Play", V.national, "2027-02-11", "19:30"],
  ["The Last Laugh Tour: Dana Pell", "Comedy", V.fillmore, "2027-02-20", "20:00"],
  ["Echoes in Motion", "Dance", V.operaHouse, "2027-03-12", "19:30"],
];

const FAMILY: Row[] = [
  ["Captain Comet's Space Adventure", "Children's show", V.forum, "2026-12-06", "14:00"],
  ["The Snow Fox on Ice", "Ice show", V.o2, "2026-12-19", "13:00"],
  ["Dinosaurs After Dark", "Exhibition show", V.united, "2026-12-27", "16:00"],
  ["The Great Bubble Circus", "Circus", V.ziggo, "2027-01-10", "14:00"],
  ["Puppets of the Silk Road", "Puppet show", V.navoi, "2027-02-06", "12:00"],
  ["Science Boom! Live", "Science show", V.scotiabank, "2027-02-14", "13:00"],
  ["The Moonlit Magic Show", "Magic", V.fillmore, "2027-03-07", "15:00"],
  ["Little Dragons Sing-Along", "Children's show", V.accor, "2027-04-03", "14:00"],
];

const FILM: Row[] = [
  ["Paper Moons: World Premiere", "Premiere", V.tcl, "2026-12-03", "19:00"],
  ["The Quiet Orbit", "Sci-Fi", V.bfi, "2026-12-09", "20:00"],
  ["Northern Shorts Festival", "Short films", V.bell, "2026-12-15", "18:00"],
  ["Desert Letters: Director Q&A", "Drama", V.bfi, "2027-01-14", "19:30"],
  ["Midnight Monsters Marathon", "Horror", V.tcl, "2027-01-29", "23:00"],
  ["Painted Skies: Animation Night", "Animation", V.bell, "2027-02-12", "18:30"],
  ["The Salt Road", "Documentary", V.bfi, "2027-03-04", "19:00"],
  ["The Violet Detective with Live Orchestra", "Film concert", V.hollywoodBowl, "2027-04-10", "19:30"],
];

const toEvents = (section: SectionSlug, idPrefix: string, list: Row[]): EventItem[] =>
  list.map(([name, genre, v, date, time], i) => ({
    id: `${idPrefix}-${i + 1}`,
    provider: "sample",
    section,
    name,
    url: null, // fictional: no page on another site
    image: null,
    localDate: date,
    localTime: time,
    status: null,
    genre,
    ...v,
    // No cash price: every demo ticket costs the same TIX, set by the contract.
    priceMin: null,
    priceMax: null,
    currency: null,
  }));

const SAMPLE_EVENTS: EventItem[] = [
  ...toEvents("concerts", "sample-music", CONCERTS),
  ...toEvents("sports", "sample-sports", SPORTS),
  ...toEvents("arts-theater", "sample-arts", ARTS),
  ...toEvents("family", "sample-family", FAMILY),
  ...toEvents("film", "sample-film", FILM),
];

export type SampleSearch = { section?: SectionSlug; keyword?: string; city?: string; countryCode?: string; size?: number };

export function searchSampleEvents(search: SampleSearch): EventPage {
  const keyword = search.keyword?.toLowerCase();
  const city = search.city?.toLowerCase();
  const matches = SAMPLE_EVENTS.filter(
    (e) =>
      (!search.section || e.section === search.section) &&
      (!search.countryCode || e.country === search.countryCode) &&
      (!city || e.city?.toLowerCase().includes(city)) &&
      (!keyword || `${e.name} ${e.venue} ${e.genre}`.toLowerCase().includes(keyword)),
  );
  return { events: matches.slice(0, search.size ?? 20), totalElements: matches.length };
}

export function getSampleEvent(id: string): EventItem | null {
  return SAMPLE_EVENTS.find((e) => e.id === id) ?? null;
}
