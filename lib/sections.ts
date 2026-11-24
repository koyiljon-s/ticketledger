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

export const getSection = (slug: SectionSlug) => SECTIONS.find((s) => s.slug === slug)!;
