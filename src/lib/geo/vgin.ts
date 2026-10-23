import { readJson } from "@/lib/geo/arcgis";

// Virginia's statewide composite locator (VGIN, part of the state's emergency
// management agency): official address points, road centerlines and landmarks,
// free, no key, and it allows calls straight from the browser. Unlike the
// Census Geocoder it can suggest as you type.
const LOCATOR = "https://vginmaps.vdem.virginia.gov/arcgis/rest/services/Geocoding/VGIN_Composite_Locator/GeocodeServer";
// The box around VA-08 (with a margin), so "Old Dominion" means Arlington's, not Richmond's.
const EXTENT = JSON.stringify({ xmin: -77.3, ymin: 38.58, xmax: -77.0, ymax: 39.0, spatialReference: { wkid: 4326 } });
const MIN_CHARS = 3;

export type AddressSuggestion = { label: string; text: string; magicKey: string };

const KEEP_UPPER = new Set(["NE", "NW", "SE", "SW", "VA", "DC", "MD", "US"]);

/** "2400 LANGSTON BLVD, ARLINGTON, VA, 22201" → "2400 Langston Blvd, Arlington, VA 22201". */
export function prettyAddress(text: string): string {
  if (/[a-z]/.test(text)) return text; // landmarks already come in mixed case
  return text
    .toLowerCase()
    .replace(/[a-z0-9]+/g, (w) => {
      if (KEEP_UPPER.has(w.toUpperCase())) return w.toUpperCase();
      if (/^\d/.test(w)) return w; // 19th, 2400
      return w[0].toUpperCase() + w.slice(1);
    })
    .replace(/, ([A-Z]{2}), (\d{5})$/, ", $1 $2");
}

export async function suggestAddresses(
  text: string,
  { fetchFn = fetch, signal }: { fetchFn?: typeof fetch; signal?: AbortSignal } = {},
): Promise<AddressSuggestion[]> {
  if (text.trim().length < MIN_CHARS) return [];
  const u = new URL(`${LOCATOR}/suggest`);
  u.searchParams.set("text", text.trim());
  u.searchParams.set("maxSuggestions", "6");
  u.searchParams.set("searchExtent", EXTENT);
  u.searchParams.set("f", "json");
  const json = await readJson<{ suggestions?: { text: string; magicKey: string; isCollection: boolean }[] }>(
    await fetchFn(u, { signal }),
    "VGIN suggest",
  );
  return (json.suggestions ?? [])
    // A "collection" is a category (all of Arlington), not a place to pin.
    .filter((s) => !s.isCollection)
    .map((s) => ({ label: prettyAddress(s.text), text: s.text, magicKey: s.magicKey }));
}

type Candidates = {
  candidates?: { address: string; location: { x: number; y: number }; score: number; attributes?: { Addr_type?: string } }[];
};

async function candidates(params: Record<string, string>, fetchFn: typeof fetch) {
  const u = new URL(`${LOCATOR}/findAddressCandidates`);
  for (const [k, v] of Object.entries({ ...params, outSR: "4326", maxLocations: "1", outFields: "Addr_type", f: "json" })) u.searchParams.set(k, v);
  const best = (await readJson<Candidates>(await fetchFn(u), "VGIN locate")).candidates?.[0];
  return best
    ? {
        lat: best.location.y,
        lon: best.location.x,
        address: best.address,
        matchedAddress: prettyAddress(best.address),
        score: best.score,
        type: best.attributes?.Addr_type ?? "",
      }
    : null;
}

// Matches that keep the house number; "StreetName" is the whole street.
const NUMBERED = new Set(["PointAddress", "Subaddress", "StreetAddress"]);

/** The point for a suggestion the resident picked. */
export async function locateSuggestion(s: Pick<AddressSuggestion, "text" | "magicKey">, fetchFn: typeof fetch = fetch) {
  const hit = await candidates({ SingleLine: s.text, magicKey: s.magicKey }, fetchFn);
  return hit && { lat: hit.lat, lon: hit.lon, matchedAddress: hit.matchedAddress };
}

/**
 * A typed address the resident didn't pick from the list. The locator happily
 * returns the nearest thing (the whole street, or "St" for a typed "Dr"), so a
 * typed house number must survive into a near-exact match; otherwise the caller
 * falls back to the Census and, failing that, says it found nothing.
 */
export async function locateText(q: string, fetchFn: typeof fetch = fetch) {
  const hit = await candidates({ SingleLine: q, searchExtent: EXTENT }, fetchFn);
  if (!hit) return null;
  const typedNumber = q.trim().match(/^(\d+)\b/)?.[1];
  const ok = typedNumber
    ? NUMBERED.has(hit.type) && hit.score >= 97 && hit.address.startsWith(`${typedNumber} `)
    : hit.score >= 90;
  return ok ? { lat: hit.lat, lon: hit.lon, matchedAddress: hit.matchedAddress } : null;
}
