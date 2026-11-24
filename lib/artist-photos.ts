/**
 * Openly licensed artist photos, with no key needed:
 * MusicBrainz artist ID -> Wikidata (photo file name) -> Wikimedia Commons (URL, author, licence).
 * Photos are optional extras, so this never throws: `complete` is false if the lookup failed.
 */
import type { ImageCredit } from "./events";

export type Photo = { src: string; credit: ImageCredit };

const UUID = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
/** Only licences we know how to credit. Anything else is skipped. */
const ALLOWED_LICENSE = /^(CC BY(-SA)? \d(\.\d)?( [a-z]{2})?|CC0( 1\.0)?|Public domain)$/i;
const BATCH = 50; // Commons API maximum per request

type Sparql = { results: { bindings: { mbid: { value: string }; img: { value: string } }[] } };
type Meta = Record<string, { value?: string } | undefined>;
type Commons = {
  query?: {
    normalized?: { from: string; to: string }[];
    pages?: { title: string; imageinfo?: { thumburl?: string; descriptionurl: string; extmetadata?: Meta }[] }[];
  };
};

export type PhotoLookup = { photos: Map<string, Photo>; complete: boolean };

export async function fetchArtistPhotos(artistIds: string[]): Promise<PhotoLookup> {
  const photos = new Map<string, Photo>();
  const ids = [...new Set(artistIds)].filter((id) => UUID.test(id));
  if (ids.length === 0) return { photos, complete: true };
  try {
    const query = `SELECT ?mbid ?img WHERE { VALUES ?mbid { ${ids.map((id) => `"${id}"`).join(" ")} } ?artist wdt:P434 ?mbid; wdt:P18 ?img }`;
    const found = await get<Sparql>("https://query.wikidata.org/sparql", { query, format: "json" });

    const fileOf = new Map<string, string>();
    for (const b of found.results.bindings) {
      const file = decodeURIComponent(b.img.value.slice(b.img.value.lastIndexOf("/") + 1)).replace(/_/g, " ");
      if (!fileOf.has(b.mbid.value)) fileOf.set(b.mbid.value, `File:${file}`);
    }
    const byFile = await fetchFiles([...new Set(fileOf.values())]);
    for (const [id, file] of fileOf) {
      const photo = byFile.get(file);
      if (photo) photos.set(id, photo);
    }
  } catch (e) {
    console.warn("Artist photos unavailable:", e instanceof Error ? e.message : e);
    return { photos, complete: false };
  }
  return { photos, complete: true };
}

async function fetchFiles(titles: string[]) {
  const files = new Map<string, Photo>();
  for (let i = 0; i < titles.length; i += BATCH) {
    const json = await get<Commons>("https://commons.wikimedia.org/w/api.php", {
      action: "query",
      format: "json",
      formatversion: "2",
      prop: "imageinfo",
      iiprop: "url|extmetadata",
      iiurlwidth: "500",
      iiextmetadatafilter: "Artist|LicenseShortName|LicenseUrl",
      titles: titles.slice(i, i + BATCH).join("|"),
    });
    const original = new Map(json.query?.normalized?.map((n) => [n.to, n.from]));
    for (const page of json.query?.pages ?? []) {
      const info = page.imageinfo?.[0];
      const license = info?.extmetadata?.LicenseShortName?.value;
      if (!info?.thumburl?.startsWith("https://") || !license || !ALLOWED_LICENSE.test(license)) continue;
      const licenseUrl = info.extmetadata?.LicenseUrl?.value;
      files.set(original.get(page.title) ?? page.title, {
        src: info.thumburl,
        credit: {
          author: plainText(info.extmetadata?.Artist?.value) || "Unknown author",
          license,
          licenseUrl: licenseUrl && /^https?:\/\//.test(licenseUrl) ? licenseUrl : null,
          sourceUrl: info.descriptionurl,
        },
      });
    }
  }
  return files;
}

/** Tries twice: these services sometimes stall on the first request. */
async function get<T>(url: string, params: Record<string, string>): Promise<T> {
  try {
    return await getOnce<T>(url, params);
  } catch {
    return getOnce<T>(url, params);
  }
}

async function getOnce<T>(url: string, params: Record<string, string>): Promise<T> {
  const res = await fetch(`${url}?${new URLSearchParams(params)}`, {
    headers: { "User-Agent": "event-demo/0.1", Accept: "application/json" },
    signal: AbortSignal.timeout(5_000),
  });
  if (!res.ok) throw new Error(`${new URL(url).host} returned HTTP ${res.status}`);
  return (await res.json()) as T;
}

/** Commons author names are HTML. React escapes the result, so this only needs to make it readable. */
function plainText(html = "") {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}
