import type { FeatureCollection, Geometry } from "geojson";

/**
 * ArcGIS servers report failures (rate limits, bad queries) as HTTP 200 with
 * an `error` object, which would otherwise read as "nothing found here".
 */
export async function readJson<T>(res: Response, source: string): Promise<T> {
  if (!res.ok) throw new Error(`${source} HTTP ${res.status}`);
  const json = (await res.json()) as T & { error?: { code?: number; message?: string } };
  if (json.error) throw new Error(`${source} ${json.error.code ?? ""} ${json.error.message ?? ""}`.trim());
  return json;
}

export async function readFeatures<P>(res: Response, source: string): Promise<FeatureCollection<Geometry, P>> {
  const json = await readJson<Partial<FeatureCollection<Geometry, P>>>(res, source);
  return { type: "FeatureCollection", features: json.features ?? [] };
}
