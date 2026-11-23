import Form from "next/form";

/**
 * Search bar: location · date · keyword · Search button.
 *
 * Submits as a GET to `/search`. Field names match the Ticketmaster
 * Discovery API params, so the search page can forward them directly:
 *   /search?city=London&startDate=2026-12-01&keyword=coldplay
 */
export function SearchBar({ action = "/search" }: { action?: string }) {
  return (
    <Form
      action={action}
      role="search"
      className="flex w-full flex-col overflow-hidden rounded-md bg-white text-[#121212] shadow-lg md:flex-row md:items-stretch"
    >
      <Field label="Location" icon={<PinIcon />} className="md:w-56">
        <input name="city" placeholder="City or zip code" autoComplete="address-level2" className={inputClass} />
      </Field>

      <Divider />

      <Field label="Dates" icon={<CalendarIcon />} className="md:w-52">
        <input name="startDate" type="date" aria-label="Start date" className={inputClass} />
      </Field>

      <Divider />

      <Field label="Search" icon={<SearchIcon />} className="flex-1">
        <input name="keyword" type="search" placeholder="Artist, event or venue" className={inputClass} />
      </Field>

      <div className="p-2">
        <button
          type="submit"
          className="h-full w-full rounded-md bg-[#024bde] px-8 py-3 text-sm font-bold text-white transition hover:bg-violet-700 md:w-auto"
        >
          Search
        </button>
      </div>
    </Form>
  );
}

const inputClass = "w-full bg-transparent text-sm outline-none placeholder:text-zinc-400";

function Field({
  label,
  icon,
  className = "",
  children,
}: {
  label: string;
  icon: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex items-center gap-3 px-4 py-3 focus-within:bg-zinc-50 ${className}`}>
      <span className="shrink-0 text-zinc-500">{icon}</span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">{label}</span>
        {children}
      </span>
    </label>
  );
}

function Divider() {
  return <span aria-hidden className="mx-4 h-px bg-zinc-200 md:mx-0 md:my-3 md:h-auto md:w-px" />;
}

const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

function PinIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 21s-7-6.1-7-11a7 7 0 1 1 14 0c0 4.9-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
