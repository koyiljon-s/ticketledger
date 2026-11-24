const PATHS = {
  check: "m5 12.5 4.5 4.5L19 7.5",
  cross: "M6.5 6.5l11 11M17.5 6.5l-11 11",
  back: "M15 5l-7 7 7 7",
  next: "M9 5l7 7-7 7",
  search: "M20 20l-4-4M17.5 10.75a6.75 6.75 0 1 1-13.5 0 6.75 6.75 0 0 1 13.5 0z",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1",
  shield: "M12 3l7.5 3v5.5c0 4.5-3 7.8-7.5 9.5-4.5-1.7-7.5-5-7.5-9.5V6z",
} as const;

export function Icon({ name, className = "h-5 w-5" }: { name: keyof typeof PATHS; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={PATHS[name]} />
    </svg>
  );
}

export type Health = "checking" | "good" | "bad";

export function HealthIcon({ state, className = "h-6 w-6" }: { state: Health; className?: string }) {
  const style = { checking: "bg-zinc-200 text-zinc-500", good: "bg-[#0a7d42] text-white", bad: "bg-[#d7263d] text-white" }[state];
  return (
    <span className={`grid shrink-0 place-items-center rounded-full p-1 ${style} ${className}`}>
      {state !== "checking" && <Icon name={state === "good" ? "check" : "cross"} className="h-full w-full" />}
      <span className="sr-only">{{ checking: "Checking", good: "Valid", bad: "Invalid" }[state]}</span>
    </span>
  );
}
