import { geocodeAddress, lookupPoint } from "@/lib/geo/census";

type Deps = { geocodeAddress: typeof geocodeAddress; lookupPoint: typeof lookupPoint };

// Lives outside app/api so tests can inject the Census calls; Next only
// allows HTTP-method exports from route files.
export async function handleGeocode(request: Request, deps: Deps = { geocodeAddress, lookupPoint }): Promise<Response> {
  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q) return Response.json({ error: "missing-query" }, { status: 400 });

  const hit = await deps.geocodeAddress(q);
  if (!hit) return Response.json({ error: "not-found" }, { status: 404 });

  const geo = await deps.lookupPoint(hit.lat, hit.lon);
  return Response.json(
    { ...hit, districtId: geo.districtId, locality: geo.locality },
    // Addresses don't move; let Vercel's edge cache repeat lookups for a day.
    { headers: { "Cache-Control": "s-maxage=86400" } },
  );
}
