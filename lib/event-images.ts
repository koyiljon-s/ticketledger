/**
 * Remembers the photo of events you have tickets for, so My Tickets can show it.
 * Kept outside the blockchain: it is decoration, not part of the signed ticket.
 */
import type { ImageCredit } from "./events";

export type EventPhoto = { src: string; credit: ImageCredit };

const KEY = "ticketledger.images.v1";

export function readEventPhotos(): Record<string, EventPhoto | undefined> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return value && typeof value === "object" ? (value as Record<string, EventPhoto>) : {};
  } catch {
    return {};
  }
}

export function saveEventPhoto(eventId: string, photo: EventPhoto) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...readEventPhotos(), [eventId]: photo }));
  } catch {
    // Storage full or blocked: the ticket still works with generated artwork.
  }
}
