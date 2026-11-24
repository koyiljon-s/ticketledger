export type SectionSlug = "concerts" | "sports" | "arts-theater" | "family" | "film";

export type Section = { slug: SectionSlug; label: string; href: string; tagline: string; noun: string };

const section = (slug: SectionSlug, label: string, noun: string, tagline: string): Section => ({
  slug,
  label,
  noun,
  tagline,
  href: `/discover/${slug}`,
});

/** The 5 main sections, in Navbar order. */
export const SECTIONS: Section[] = [
  section("concerts", "Concerts", "concerts", "Live music around the world, from arena tours to club nights."),
  section("sports", "Sports", "games", "Games from leagues around the world."),
  section("arts-theater", "Arts & Theater", "shows", "Plays, musicals, dance, opera and comedy."),
  section("family", "Family", "family events", "Days out for all ages."),
  section("film", "Film", "screenings", "Premieres, festivals and special screenings."),
];

/** Section of an event ID (see getEvent in catalog.ts for the ID formats). */
export function sectionOfId(id: string): SectionSlug {
  if (id.startsWith("sport-") || id.startsWith("sample-sports-")) return "sports";
  if (id.startsWith("sample-arts-")) return "arts-theater";
  if (id.startsWith("sample-family-")) return "family";
  if (id.startsWith("sample-film-")) return "film";
  return "concerts";
}

export const getSection = (slug: SectionSlug) => SECTIONS.find((s) => s.slug === slug)!;
