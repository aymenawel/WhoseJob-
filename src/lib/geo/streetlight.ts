import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { Checks, LightOwner, LocalityId } from "@/lib/types";
import { distanceToGeometry } from "@/lib/geo/nearest";

type Props = Record<string, unknown>;

type LightLayer = {
  url: string;
  ownerOf: (p: Props) => LightOwner;
  poleIdOf: (p: Props) => string | undefined;
  formUrlOf?: (p: Props) => string | undefined;
};

const RADIUS_M = 60;
// Closer than this, two lights are the same light as far as a phone's GPS
// can tell; better to ask the resident than to guess the owner.
const TIE_M = 3;

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);

const ARL = "https://arlgis.arlingtonva.us/arcgis/rest/services/CRMS_311";
const FFX = "https://www.fairfaxcounty.gov/gispub1/rest/services/DPWES/StreetLightReporter/MapServer";

const ALX_OWNER: Record<string, LightOwner> = { DOM: "dominion", "City-TES": "city", "City-RPCA": "city", PVT: "private" };

/** Fairfax ships an HTML link to its own pre-filled report form; pull the href out. */
function fairfaxFormUrl(p: Props): string | undefined {
  const href = str(p.FORM_HTML)?.match(/href='([^']+)'/)?.[1];
  if (!href) return undefined;
  try {
    return new URL(href).toString(); // also percent-encodes the spaces in the address
  } catch {
    return undefined;
  }
}

export const LIGHT_LAYERS: Record<LocalityId, LightLayer[]> = {
  arlington: [
    { url: `${ARL}/CRMS311_Arlington_Owned_Street_Lights/MapServer/0/query`, ownerOf: () => "county", poleIdOf: (p) => str(p.PoleNumber) },
    { url: `${ARL}/CRMS311_DominionLights/MapServer/0/query`, ownerOf: () => "dominion", poleIdOf: (p) => str(p.GRID_ADDRE) },
  ],
  alexandria: [
    {
      url: "https://maps.alexandriava.gov/arcgis/rest/services/alxCCCStreetlights/MapServer/0/query",
      ownerOf: (p) => ALX_OWNER[str(p.SL_OWNER) ?? ""] ?? "unknown",
      poleIdOf: (p) => str(p.FACILITYID),
    },
  ],
  fairfax: [
    { url: `${FFX}/1/query`, ownerOf: () => "dominion", poleIdOf: (p) => str(p.POLE_NUMBER), formUrlOf: fairfaxFormUrl },
    { url: `${FFX}/0/query`, ownerOf: () => "novec", poleIdOf: (p) => str(p.POLE_NUMBER) },
  ],
  // No public streetlight layer found for Falls Church yet.
  "falls-church": [],
};

async function fetchLayer(layer: LightLayer, lat: number, lon: number, fetchFn: typeof fetch) {
  const u = new URL(layer.url);
  const params = {
    geometry: `${lon},${lat}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    distance: String(RADIUS_M),
    units: "esriSRUnit_Meter",
    outFields: "*",
    returnGeometry: "true",
    outSR: "4326",
    f: "geojson",
  };
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  const res = await fetchFn(u);
  if (!res.ok) throw new Error(`streetlight layer ${res.status}`);
  const fc = (await res.json()) as FeatureCollection<Geometry, Props>;
  return (fc.features ?? []).map((feature: Feature<Geometry, Props>) => ({
    layer,
    props: feature.properties ?? {},
    distanceM: distanceToGeometry(lon, lat, feature.geometry),
  }));
}

export async function queryStreetlight(
  locality: LocalityId,
  lat: number,
  lon: number,
  fetchFn: typeof fetch = fetch,
): Promise<Checks["streetlight"]> {
  const layers = LIGHT_LAYERS[locality];
  if (layers.length === 0) return null;

  const settled = await Promise.allSettled(layers.map((l) => fetchLayer(l, lat, lon, fetchFn)));
  const lights = settled
    .flatMap((s) => (s.status === "fulfilled" ? s.value : []))
    .filter((l) => Number.isFinite(l.distanceM))
    .sort((a, b) => a.distanceM - b.distanceM);
  if (lights.length === 0) return null;

  const [nearest, runnerUp] = lights;
  const owner = nearest.layer.ownerOf(nearest.props);
  const tied = runnerUp && runnerUp.distanceM - nearest.distanceM < TIE_M && runnerUp.layer.ownerOf(runnerUp.props) !== owner;

  return {
    owner: tied ? "unknown" : owner,
    poleId: tied ? undefined : nearest.layer.poleIdOf(nearest.props),
    formUrl: tied ? undefined : nearest.layer.formUrlOf?.(nearest.props),
    distanceM: Math.round(nearest.distanceM),
  };
}
