import type { Agency, Checks, RoadOwner } from "@/lib/types";
import { nearestFeature } from "@/lib/geo/nearest";
import { readFeatures } from "@/lib/geo/arcgis";

// The street layer behind Arlington's own 311 map. Its Owner field is the
// county's word on who owns each street, federal land included (GW Parkway,
// the Pentagon, Arlington Cemetery, the airport), which VDOT's data mostly lacks.
const STREETS = "https://arlgis.arlingtonva.us/arcgis/rest/services/CRMS_311/CRMS311_Streets/MapServer/0/query";
const RADIUS_M = 60;

type Props = { STNAME: string | null; Owner: string | null };

const OWNERS: Record<string, { owner: RoadOwner; agency?: Agency }> = {
  ARL: { owner: "county" },
  VDOT: { owner: "state" },
  NPS: { owner: "federal", agency: "nps" },
  PENT: { owner: "federal", agency: "pentagon" },
  FED: { owner: "federal", agency: "federal" },
  MWAA: { owner: "other", agency: "airport" },
  DDOT: { owner: "other", agency: "dc" },
  PVT: { owner: "private" },
  OT: { owner: "other", agency: "other" },
};

export function arlingtonOwner(code: string | null): { owner: RoadOwner; agency?: Agency } {
  return (code && OWNERS[code]) || { owner: "unknown" };
}

/** "GEORGE WASHINGTON MEMORIAL PKWY" → "George Washington Memorial Pkwy". */
function titleCase(name: string): string {
  return name.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase()).replace(/\b(\d+)(St|Nd|Rd|Th)\b/g, (_, n, s) => n + s.toLowerCase());
}

export async function queryArlingtonStreet(lat: number, lon: number, fetchFn: typeof fetch = fetch): Promise<Checks["road"]> {
  const u = new URL(STREETS);
  const params = {
    geometry: `${lon},${lat}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    distance: String(RADIUS_M),
    units: "esriSRUnit_Meter",
    outFields: "STNAME,Owner",
    returnGeometry: "true",
    outSR: "4326",
    f: "geojson",
  };
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);

  const fc = await readFeatures<Props>(await fetchFn(u), "Arlington streets");
  const hit = nearestFeature(lon, lat, fc.features);
  if (!hit) return null;
  return {
    name: titleCase(hit.feature.properties.STNAME ?? ""),
    ...arlingtonOwner(hit.feature.properties.Owner),
    distanceM: Math.round(hit.distanceM),
  };
}
