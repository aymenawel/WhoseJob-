import type { FeatureCollection, Geometry } from "geojson";

/**
 * ArcGIS servers report failures (rate limits, bad queries) as HTTP 200 with
 * an `error` object, which would otherwise read as "nothing found here".
 */
export async function readFeatures<P>(res: Response, source: string): Promise<FeatureCollection<Geometry, P>> {
  if (!res.ok) throw new Error(`${source} HTTP ${res.status}`);
  const json = (await res.json()) as FeatureCollection<Geometry, P> & { error?: { code?: number; message?: string } };
  if (json.error) throw new Error(`${source} ${json.error.code ?? ""} ${json.error.message ?? ""}`.trim());
  return { type: "FeatureCollection", features: json.features ?? [] };
}
