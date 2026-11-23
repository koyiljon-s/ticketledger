import Image from "next/image";
import type { TmEvent } from "@/lib/ticketmaster";

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

/**
 * Event artwork. Real Ticketmaster images are shown as-is (unoptimized, so no
 * image-host config is needed). Events without an image (e.g. sample data) get
 * a genre-coloured placeholder.
 */
export function EventImage({ event, sizes, className = "" }: { event: TmEvent; sizes: string; className?: string }) {
  if (event.image) {
    return <Image src={event.image} alt={event.name} fill unoptimized sizes={sizes} className={`object-cover ${className}`} />;
  }
  const gradient = GENRE_GRADIENTS[event.genre ?? ""] ?? "from-[#024bde] to-[#121212]";
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

/** "Find tickets" for live events; a disabled label for sample events (no real tickets exist). */
export function TicketButton({ event, className = "" }: { event: TmEvent; className?: string }) {
  if (!event.url) {
    return (
      <span
        title="Sample event: no real tickets available"
        className={`shrink-0 cursor-not-allowed rounded-md border border-zinc-300 px-5 py-3 text-sm font-bold text-zinc-500 ${className}`}
      >
        Sample event
      </span>
    );
  }
  return (
    <a
      href={event.url}
      target="_blank"
      rel="noreferrer"
      className={`shrink-0 rounded-md bg-[#024bde] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0139a8] ${className}`}
    >
      Find tickets
    </a>
  );
}
