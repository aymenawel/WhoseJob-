import { resolveChecks } from "@/lib/jurisdiction/resolve";

export async function handleResolve(request: Request, resolve: typeof resolveChecks = resolveChecks): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const lat = Number(params.get("lat"));
  const lon = Number(params.get("lon"));
  if (!params.get("lat") || !params.get("lon") || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    return Response.json({ error: "bad-coordinates" }, { status: 400 });
  }
  const checks = await resolve(lat, lon);
  // Cache only complete answers: one throttled request must not serve stale
  // backup data to every resident (or judge) at that spot for the next hour.
  const cache = checks.fallbacks.length ? "no-store" : "s-maxage=3600";
  return Response.json(checks, { headers: { "Cache-Control": cache } });
}
