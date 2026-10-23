export type AddressHit = { lat: number; lon: number; matchedAddress: string; districtId: string | null };

/**
 * Calls /api/geocode and keeps the two failures apart: an address the Census
 * doesn't know (the resident can rephrase) and the service being down (they can't).
 */
export async function findAddress(q: string): Promise<{ hit: AddressHit } | { error: "not-found" | "unavailable" }> {
  try {
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
    if (res.status === 404) return { error: "not-found" };
    if (!res.ok) return { error: "unavailable" };
    return { hit: (await res.json()) as AddressHit };
  } catch {
    return { error: "unavailable" };
  }
}
