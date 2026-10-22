import { nearestPointOnLine } from "@turf/nearest-point-on-line";
import { distance } from "@turf/distance";
import type { Feature, Geometry, LineString, MultiLineString } from "geojson";

/** Distance in meters from a point to a line or point geometry; Infinity for anything else. */
export function distanceToGeometry(lon: number, lat: number, g: Geometry | null): number {
  if (!g) return Infinity;
  if (g.type === "Point") return distance([lon, lat], g.coordinates, { units: "meters" });
  if (g.type === "LineString" || g.type === "MultiLineString") {
    return nearestPointOnLine(g as LineString | MultiLineString, [lon, lat], { units: "meters" }).properties.pointDistance;
  }
  return Infinity;
}

export function nearestFeature<P>(
  lon: number,
  lat: number,
  features: Feature<Geometry, P>[],
): { feature: Feature<Geometry, P>; distanceM: number } | null {
  let best: { feature: Feature<Geometry, P>; distanceM: number } | null = null;
  for (const feature of features) {
    const d = distanceToGeometry(lon, lat, feature.geometry);
    if (Number.isFinite(d) && (!best || d < best.distanceM)) best = { feature, distanceM: d };
  }
  return best;
}
