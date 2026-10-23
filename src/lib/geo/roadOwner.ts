import type { Agency, Checks, RoadOwner } from "@/lib/types";
import { nearestFeature } from "@/lib/geo/nearest";
import { readFeatures } from "@/lib/geo/arcgis";

const VDOT =
  "https://services.arcgis.com/p5v98VHDX9Atv3l7/ArcGIS/rest/services/VDOT_Route_Responsibility/FeatureServer/0/query";
const RADIUS_M = 60;

type Props = { RTE_COMMON_NM: string; RIM_MAINT_RESPONSIBILITY_NM: string | null };

/**
 * VDOT codes look like "02-County Hwy Agency (3)"; only the prefix is stable.
 * Federal land (Park Service, Army) and private roads have codes of their own,
 * so they are never mistaken for the county's.
 */
export function vdotOwner(code: string | null): { owner: RoadOwner; agency?: Agency } {
  switch (code?.slice(0, 2)) {
    case "01":
      return { owner: "state" };
    case "02":
      return { owner: "county" };
    case "04":
      return { owner: "city" };
    case "26":
      return { owner: "private" };
    case "66":
      return { owner: "federal", agency: "nps" };
    case "74":
      return { owner: "federal", agency: "army" };
    case "60":
      return { owner: "federal", agency: "federal" };
    case "03":
      return { owner: "other", agency: "town" };
    case "12":
      return { owner: "other", agency: "park" };
    case "40":
      return { owner: "other", agency: "institution" };
    default:
      return { owner: "unknown" };
  }
}

export function mapMaintenance(code: string | null): RoadOwner {
  return vdotOwner(code).owner;
}

export async function queryRoadOwner(lat: number, lon: number, fetchFn: typeof fetch = fetch): Promise<Checks["road"]> {
  const u = new URL(VDOT);
  const params = {
    geometry: `${lon},${lat}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    distance: String(RADIUS_M),
    units: "esriSRUnit_Meter",
    outFields: "RTE_COMMON_NM,RIM_MAINT_RESPONSIBILITY_NM",
    returnGeometry: "true",
    outSR: "4326",
    f: "geojson",
  };
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);

  const fc = await readFeatures<Props>(await fetchFn(u), "VDOT");

  // The buffer returns every segment in range, cross streets included;
  // the one the pin is actually on is the nearest.
  const hit = nearestFeature(lon, lat, fc.features);
  if (!hit) return null;
  return {
    name: hit.feature.properties.RTE_COMMON_NM,
    ...vdotOwner(hit.feature.properties.RIM_MAINT_RESPONSIBILITY_NM),
    distanceM: Math.round(hit.distanceM),
  };
}
