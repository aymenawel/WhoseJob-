import { resolveChecks } from "@/lib/jurisdiction/resolve";

export async function handleResolve(request: Request, resolve: typeof resolveChecks = resolveChecks): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const lat = Number(params.get("lat"));
  const lon = Number(params.get("lon"));
  if (!params.get("lat") || !params.get("lon") || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    return Response.json({ error: "bad-coordinates" }, { status: 400 });
  }
  return Response.json(await resolve(lat, lon), { headers: { "Cache-Control": "s-maxage=3600" } });
}
