import type { EventItem } from "@/lib/events";
import type { SectionSlug } from "@/lib/sections";
import { Photo } from "./photo";

type ArtEvent = Pick<EventItem, "id" | "name" | "section" | "image">;

const ICONS: Record<SectionSlug, React.ReactNode> = {
  concerts: (
    <>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </>
  ),
  sports: <path d="M7 4h10v5a5 5 0 0 1-10 0zM7 5H3v2a4 4 0 0 0 4 4M17 5h4v2a4 4 0 0 1-4 4M12 14v6M8 20h8" />,
  "arts-theater": <path d="M4 4h16v7a8 8 0 0 1-16 0zM8 9h2M14 9h2M8 14c2 2 6 2 8 0" />,
  family: <path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z" />,
  film: <path d="M3 5h18v14H3zM7 5v14M17 5v14M3 9.7h4M3 14.3h4M17 9.7h4M17 14.3h4" />,
};

/** Repeatable random numbers from text, so an event always gets the same artwork. */
function randomFrom(text: string) {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.codePointAt(0)!, 16777619);
  return (max: number) => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) % max;
  };
}

function Artwork({ event }: { event: ArtEvent }) {
  const rnd = randomFrom(event.id);
  // Any hue, plus an accent from a different part of the colour wheel.
  const hue = rnd(360);
  const bg = `hsl(${hue} 60% 20%)`;
  const a = `hsl(${hue + rnd(50)} 70% 45%)`;
  const b = `hsl(${hue + 80 + rnd(200)} 85% 65%)`;
  const pattern = rnd(4);
  const x = 40 + rnd(240);
  const y = 20 + rnd(140);
  const tilt = rnd(60) - 30;

  return (
    <svg aria-hidden viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
      <rect width="320" height="180" fill={bg} />
      {pattern === 0 &&
        [130, 100, 70, 40, 16].map((r, i) => <circle key={r} cx={x} cy={y} r={r + rnd(12)} fill={i % 2 ? b : a} opacity={0.35 + i * 0.12} />)}
      {pattern === 1 && (
        <g transform={`rotate(${tilt} 160 90)`}>
          {Array.from({ length: 9 }, (_, i) => (
            <rect key={i} x={-60 + i * 50} y={-120} width={10 + rnd(32)} height={420} fill={i % 2 ? b : a} opacity={0.4 + rnd(5) / 10} />
          ))}
        </g>
      )}
      {pattern === 2 &&
        Array.from({ length: 12 }, (_, i) => (
          <path key={i} d="M0 0 L420 -38 L420 38 Z" transform={`translate(${x} ${y}) rotate(${i * 30 + tilt})`} fill={i % 2 ? b : a} opacity={0.55} />
        ))}
      {pattern === 3 &&
        Array.from({ length: 5 }, (_, i) => {
          const top = 20 + rnd(40) + i * 26;
          const bend = rnd(120) - 60;
          return (
            <path
              key={i}
              d={`M0 ${top} C 80 ${top - bend}, 160 ${top + bend}, 240 ${top} S 320 ${top + bend}, 340 ${top} V180 H0 Z`}
              fill={i % 2 ? b : a}
              opacity={0.45}
            />
          );
        })}
      <circle cx="160" cy="90" r="42" fill={bg} opacity="0.8" />
      <g transform="translate(136 66) scale(2)" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {ICONS[event.section]}
      </g>
    </svg>
  );
}

/** Event picture: a photo if there is one, on top of artwork generated for this event. */
export function EventImage({ event, sizes, className = "" }: { event: ArtEvent; sizes: string; className?: string }) {
  return (
    <div className={`absolute inset-0 ${className}`}>
      <Artwork event={event} />
      {event.image && <Photo src={event.image} alt={`Photo for ${event.name}`} sizes={sizes} />}
    </div>
  );
}
