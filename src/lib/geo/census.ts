import type { Locality } from "@/lib/types";
import { LOCALITY_BY_FIPS, stateAbbr } from "@/lib/geo/fips";

const BASE = "https://geocoding.geo.census.gov/geocoder";
// The default "Current" vintage already returns next Congress's (120th)
// districts; ACS2025 still returns the 119th, i.e. the Member serving now.
const PARAMS = { benchmark: "Public_AR_Current", vintage: "ACS2025_Current", format: "json" };

export type CensusPoint = {
  districtId: string | null;
  locality: Locality | null;
  localityFips: string | null;
};

type Geo = Record<string, Array<Record<string, string>>>;

export function parseGeographies(json: unknown): CensusPoint {
  const result = (json as { result?: { geographies?: Geo; addressMatches?: Array<{ geographies?: Geo }> } })?.result;
  const geos = result?.geographies ?? result?.addressMatches?.[0]?.geographies;
  if (!geos) return { districtId: null, locality: null, localityFips: null };

  // Match by substring: the layer name carries the Congress number and
  // changes with each vintage ("119th Congressional Districts").
  const districtKey = Object.keys(geos).find((k) => k.includes("Congressional"));
  const geoid = districtKey ? geos[districtKey]?.[0]?.GEOID : undefined;
  const districtId = geoid ? `${stateAbbr(geoid.slice(0, 2))}-${geoid.slice(2, 4)}` : null;

  const county = geos.Counties?.[0];
  const localityFips = county?.GEOID ?? null;
  const localityId = localityFips ? LOCALITY_BY_FIPS[localityFips] : undefined;
  const locality = localityId && county ? { id: localityId, name: county.NAME } : null;

  return { districtId, locality, localityFips };
}

function url(path: string, params: Record<string, string | number>) {
  const u = new URL(`${BASE}/${path}`);
  for (const [k, v] of Object.entries({ ...PARAMS, ...params })) u.searchParams.set(k, String(v));
  return u;
}

export async function lookupPoint(lat: number, lon: number, fetchFn: typeof fetch = fetch): Promise<CensusPoint> {
  const res = await fetchFn(url("geographies/coordinates", { x: lon, y: lat, layers: "all" }));
  if (!res.ok) throw new Error(`Census ${res.status}`);
  return parseGeographies(await res.json());
}

export async function geocodeAddress(
  q: string,
  fetchFn: typeof fetch = fetch,
): Promise<{ lat: number; lon: number; matchedAddress: string } | null> {
  const res = await fetchFn(url("locations/onelineaddress", { address: q }));
  if (!res.ok) throw new Error(`Census ${res.status}`);
  const json = (await res.json()) as {
    result?: { addressMatches?: Array<{ matchedAddress: string; coordinates: { x: number; y: number } }> };
  };
  const match = json.result?.addressMatches?.[0];
  if (!match) return null;
  return { lat: match.coordinates.y, lon: match.coordinates.x, matchedAddress: match.matchedAddress };
}
