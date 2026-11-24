import Image from "next/image";
import type { EventItem } from "@/lib/events";

const GENRE_GRADIENTS: Record<string, string> = {
  Pop: "from-pink-500 to-fuchsia-700",
  Rock: "from-zinc-700 to-red-800",
  Alternative: "from-teal-600 to-slate-800",
  "Hip-Hop/Rap": "from-amber-500 to-orange-800",
  "R&B": "from-purple-600 to-indigo-900",
  Country: "from-amber-600 to-yellow-900",
  Electronic: "from-cyan-500 to-blue-800",
  Jazz: "from-sky-700 to-slate-900",
  Latin: "from-rose-500 to-orange-600",
  Classical: "from-stone-500 to-stone-800",
};

const GRADIENTS = Object.values(GENRE_GRADIENTS);

/** Stable colour for events without a genre, so the list isn't all one colour. */
function gradientFor(event: EventItem) {
  const byGenre = GENRE_GRADIENTS[event.genre ?? ""];
  if (byGenre) return byGenre;
  let hash = 0;
  for (const c of event.id) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length];
}

/**
 * Event artwork. Provider images are shown as-is (unoptimized, so no image-host
 * config is needed). Events without one (MusicBrainz, sample data) get a
 * coloured placeholder.
 */
export function EventImage({ event, sizes, className = "" }: { event: EventItem; sizes: string; className?: string }) {
  if (event.image) {
    return <Image src={event.image} alt={event.name} fill unoptimized sizes={sizes} className={`object-cover ${className}`} />;
  }
  const gradient = gradientFor(event);
  return (
    <div aria-hidden className={`absolute inset-0 grid place-items-center bg-gradient-to-br ${gradient} ${className}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-1/3 w-1/3 text-white/40">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    </div>
  );
}
