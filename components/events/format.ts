import type { EventItem } from "@/lib/events";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Splits a local "YYYY-MM-DD" into display parts. Parsed by hand so
 * the server's time zone can never shift the date by a day.
 */
export function dateParts(localDate: string | null) {
  const m = localDate?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const weekday = WEEKDAYS[new Date(Date.UTC(y, mo - 1, d)).getUTCDay()];
  return { year: y, month: MONTHS[mo - 1], day: d, weekday };
}

/** "19:30" → "7:30 PM", with the zone appended if given */
export function formatTime(localTime: string | null, timeZone?: string) {
  const m = localTime?.match(/^(\d{2}):(\d{2})/);
  if (!m) return null;
  const h = Number(m[1]);
  return `${h % 12 || 12}:${m[2]} ${h < 12 ? "AM" : "PM"}${timeZone ? ` ${timeZone}` : ""}`;
}

export function formatPlace(e: Pick<EventItem, "city" | "state" | "country">) {
  return [e.city, e.state ?? e.country].filter(Boolean).join(", ");
}

export function formatPrice(e: Pick<EventItem, "priceMin" | "currency">) {
  if (e.priceMin === null) return null;
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: e.currency ?? "USD", maximumFractionDigits: 0 }).format(e.priceMin);
  } catch {
    return `${Math.round(e.priceMin)} ${e.currency ?? ""}`.trim();
  }
}
