import type { NextRequest } from "next/server";
import { hasTicketmasterKey, searchTicketmasterEvents, TicketmasterError } from "@/lib/ticketmaster";

const SEGMENTS = new Set(["", "Music", "Sports", "Arts & Theatre", "Film", "Miscellaneous"]);

/**
 * GET /api/ticketmaster/events?keyword=&segment=&countryCode=&page=
 * Proxies the Ticketmaster Discovery API so the API key stays on the server.
 */
export async function GET(request: NextRequest) {
  if (!hasTicketmasterKey()) {
    return Response.json(
      { error: "missing_key", message: "Add TICKETMASTER_API_KEY to .env.local and restart the dev server." },
      { status: 503 },
    );
  }

  const sp = request.nextUrl.searchParams;
  const segment = sp.get("segment") ?? "";
  const countryCode = (sp.get("countryCode") ?? "").toUpperCase();
  const params = {
    keyword: (sp.get("keyword") ?? "").trim().slice(0, 100),
    segment: SEGMENTS.has(segment) ? segment : "",
    countryCode: /^[A-Z]{2}$/.test(countryCode) ? countryCode : "",
    page: Number.parseInt(sp.get("page") ?? "0", 10) || 0,
  };

  try {
    return Response.json(await searchTicketmasterEvents(params));
  } catch (e) {
    const status = e instanceof TicketmasterError ? e.status : 502;
    const message = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ error: "upstream", message }, { status: status >= 400 && status < 600 ? status : 502 });
  }
}
