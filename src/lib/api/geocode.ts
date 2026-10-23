import { geocodeAddress, lookupPoint } from "@/lib/geo/census";

type Deps = { geocodeAddress: typeof geocodeAddress; lookupPoint: typeof lookupPoint; timeoutMs?: number };

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))]);
}

/** The Census Geocoder is free and has no uptime promise; one quick retry rides out most blips. */
async function tryTwice<T>(run: () => Promise<T>, ms: number): Promise<T> {
  try {
    return await withTimeout(run(), ms);
  } catch {
    return withTimeout(run(), ms);
  }
}

// Lives outside app/api so tests can inject the Census calls; Next only
// allows HTTP-method exports from route files.
export async function handleGeocode(request: Request, deps: Deps = { geocodeAddress, lookupPoint }): Promise<Response> {
  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q) return Response.json({ error: "missing-query" }, { status: 400 });
  const ms = deps.timeoutMs ?? 8000;

  try {
    const hit = await tryTwice(() => deps.geocodeAddress(q), ms);
    if (!hit) return Response.json({ error: "not-found" }, { status: 404 });

    const geo = await tryTwice(() => deps.lookupPoint(hit.lat, hit.lon), ms);
    return Response.json(
      { ...hit, districtId: geo.districtId, locality: geo.locality },
      // Addresses don't move; let Vercel's edge cache repeat lookups for a day.
      { headers: { "Cache-Control": "s-maxage=86400" } },
    );
  } catch {
    // The service failed, not the address: the screen says so and offers the map.
    return Response.json({ error: "unavailable" }, { status: 503 });
  }
}
