import { booleanPointInPolygon } from "@turf/boolean-point-in-polygon";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import type { Checks, FallbackId, Locality, LocalityId } from "@/lib/types";
import { lookupPoint } from "@/lib/geo/census";
import { queryRoadOwner } from "@/lib/geo/roadOwner";
import { loadRoadSnapshot, nearestRoadInSnapshot, type RoadSnapshot } from "@/lib/geo/roadSnapshot";
import { queryStreetlight } from "@/lib/geo/streetlight";
import va08 from "@/data/va08-boundary.json";
import localities from "@/data/localities.json";

const COVERED_DISTRICT = "VA-08";

type Deps = { fetchFn?: typeof fetch; timeoutMs?: number; loadRoadSnapshot?: () => Promise<RoadSnapshot> };

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))]);
}

/** Bundled-polygon answer for when the Census Geocoder can't be reached. */
function fromBundledBoundaries(lat: number, lon: number): { district: Checks["district"]; locality: Locality | null } {
  const pt = [lon, lat];
  const inVa08 = (va08 as FeatureCollection<Polygon | MultiPolygon>).features.some((f) => booleanPointInPolygon(pt, f));
  const hit = (localities as FeatureCollection<Polygon | MultiPolygon, { id: LocalityId; name: string }>).features.find(
    (f: Feature<Polygon | MultiPolygon, { id: LocalityId; name: string }>) => booleanPointInPolygon(pt, f),
  );
  return {
    // Outside VA-08 we can't name the district without the Census, so leave it unknown.
    district: inVa08 ? { id: COVERED_DISTRICT, inCoverage: true } : null,
    locality: hit ? { id: hit.properties.id, name: hit.properties.name } : null,
  };
}

export async function resolveChecks(lat: number, lon: number, deps: Deps = {}): Promise<Checks> {
  const fetchFn = deps.fetchFn ?? fetch;
  const timeoutMs = deps.timeoutMs ?? 6000;
  const fallbacks: FallbackId[] = [];

  let district: Checks["district"];
  let locality: Locality | null;
  try {
    const census = await withTimeout(lookupPoint(lat, lon, fetchFn), timeoutMs);
    district = census.districtId ? { id: census.districtId, inCoverage: census.districtId === COVERED_DISTRICT } : null;
    locality = census.locality;
  } catch {
    ({ district, locality } = fromBundledBoundaries(lat, lon));
    fallbacks.push("census");
  }

  const checks: Checks = { point: { lat, lon }, district, locality, road: null, streetlight: null, fallbacks };
  // Outside our four localities there is no rule to apply, so skip the slow lookups.
  if (!locality || district?.inCoverage === false) return checks;

  const [road, light] = await Promise.allSettled([
    withTimeout(queryRoadOwner(lat, lon, fetchFn), timeoutMs),
    withTimeout(queryStreetlight(locality.id, lat, lon, fetchFn), timeoutMs),
  ]);
  if (road.status === "fulfilled") checks.road = road.value;
  else {
    // VDOT's live service shares one quota with all its users and often says
    // "too many requests"; the bundled snapshot is the same data, a day or so old.
    try {
      checks.road = nearestRoadInSnapshot(lat, lon, await (deps.loadRoadSnapshot ?? loadRoadSnapshot)());
    } catch {
      fallbacks.push("road");
    }
  }
  if (light.status === "fulfilled" && light.value) checks.streetlight = light.value;
  // Falls Church has no layer at all; that's a known gap, not a failure, but the
  // resident still gets the pole-tag question, so record it either way.
  else fallbacks.push("streetlight");

  return checks;
}
