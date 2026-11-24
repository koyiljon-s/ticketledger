import type { EventItem } from "@/lib/events";

/** The first distinct shows (tours repeat the same name), preferring ones with artwork. */
export function pickFeatured(events: EventItem[], count: number): EventItem[] {
  const seen = new Set<string>();
  const distinct = events.filter((e) => !seen.has(e.name) && seen.add(e.name));
  return [...distinct.filter((e) => e.image), ...distinct.filter((e) => !e.image)].slice(0, count);
}
