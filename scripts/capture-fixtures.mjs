// Saves real API responses into tests/fixtures so unit tests run offline
// against what the services actually returned. Re-run to refresh them.
// Usage: node scripts/capture-fixtures.mjs [census|vdot|lights ...]
import { mkdir, writeFile } from "node:fs/promises";

const CENSUS = "https://geocoding.geo.census.gov/geocoder/geographies";
// ACS2025_Current is the vintage that still returns 119th Congress districts.
const CENSUS_PARAMS = { benchmark: "Public_AR_Current", vintage: "ACS2025_Current", layers: "all", format: "json" };

const ADDRESSES = {
  arlington: "2100 Clarendon Blvd, Arlington, VA 22201",
  alexandria: "301 King St, Alexandria, VA 22314",
  "falls-church": "300 Park Ave, Falls Church, VA 22046",
  fairfax: "8350 Richmond Hwy, Alexandria, VA 22309",
};

async function getJson(url, params) {
  const u = new URL(url);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, String(v));
  const res = await fetch(u);
  if (!res.ok) throw new Error(`${res.status} ${u}`);
  return res.json();
}

async function save(dir, name, data) {
  await mkdir(`tests/fixtures/${dir}`, { recursive: true });
  await writeFile(`tests/fixtures/${dir}/${name}.json`, JSON.stringify(data, null, 2) + "\n");
  console.log(`wrote tests/fixtures/${dir}/${name}.json`);
}

async function census() {
  for (const [id, address] of Object.entries(ADDRESSES)) {
    const addr = await getJson(`${CENSUS}/onelineaddress`, { ...CENSUS_PARAMS, address });
    await save("census", `addr-${id}`, addr);
    const { x, y } = addr.result.addressMatches[0].coordinates;
    await save("census", `pt-${id}`, await getJson(`${CENSUS}/coordinates`, { ...CENSUS_PARAMS, x, y }));
  }
  await save("census", "addr-nomatch", await getJson(`${CENSUS}/onelineaddress`, { ...CENSUS_PARAMS, address: "1600 Wilsn Blvd Nowhere VA" }));
  // Richmond, VA: a point well outside VA-08.
  await save("census", "pt-outside", await getJson(`${CENSUS}/coordinates`, { ...CENSUS_PARAMS, x: -77.436, y: 37.5407 }));
}

const VDOT = "https://services.arcgis.com/p5v98VHDX9Atv3l7/ArcGIS/rest/services/VDOT_Route_Responsibility/FeatureServer/0/query";

// The same 60 m buffered point query src/lib/geo/roadOwner.ts makes.
function nearQuery(lon, lat, outFields) {
  return {
    geometry: `${lon},${lat}`, geometryType: "esriGeometryPoint", inSR: 4326, spatialRel: "esriSpatialRelIntersects",
    distance: 60, units: "esriSRUnit_Meter", outFields, returnGeometry: true, outSR: 4326, f: "geojson",
  };
}

const ROAD_POINTS = {
  clarendon: [-77.0849, 38.8914],
  "king-st": [-77.0426, 38.8046],
  "park-ave": [-77.1726, 38.8849],
  "us-1": [-77.1046, 38.731],
  glebe: [-77.0745, 38.8445],
  // Middle of the Potomac: no road within 60 m.
  empty: [-77.03, 38.815],
};

async function vdot() {
  for (const [id, [lon, lat]] of Object.entries(ROAD_POINTS)) {
    await save("vdot", id, await getJson(VDOT, nearQuery(lon, lat, "RTE_COMMON_NM,RIM_MAINT_RESPONSIBILITY_NM")));
  }
}

const ARL = "https://arlgis.arlingtonva.us/arcgis/rest/services/CRMS_311";
const LIGHT_LAYERS = {
  "arl-county": `${ARL}/CRMS311_Arlington_Owned_Street_Lights/MapServer/0/query`,
  "arl-dominion": `${ARL}/CRMS311_DominionLights/MapServer/0/query`,
  alx: "https://maps.alexandriava.gov/arcgis/rest/services/alxCCCStreetlights/MapServer/0/query",
  "ffx-dominion": "https://www.fairfaxcounty.gov/gispub1/rest/services/DPWES/StreetLightReporter/MapServer/1/query",
  "fc-dominion": "https://services1.arcgis.com/2hmXRAz4ofcdQP6p/arcgis/rest/services/StreetlightInventory_2017/FeatureServer/1/query",
  "fc-city": "https://services1.arcgis.com/2hmXRAz4ofcdQP6p/arcgis/rest/services/StreetlightInventory_2017/FeatureServer/2/query",
};
const LIGHT_POINTS = {
  // Two dark lights ~60 m apart on Clarendon Blvd: Dominion's C0918WL6800
  // and the county's 190MA01SE. The demo drops a pin on each.
  "arl-dom-pole": [["arl-county", "arl-dominion"], -77.085525, 38.891447],
  "arl-cty-pole": [["arl-county", "arl-dominion"], -77.084805, 38.891372],
  // 2201 Wilson Blvd's address point: a county light at 7 m and a Dominion
  // light at 9 m, a real near-tie.
  "arl-wilson": [["arl-county", "arl-dominion"], -77.085917, 38.891248],
  "alx-king": [["alx"], -77.042607, 38.80457],
  "ffx-richmond": [["ffx-dominion"], -77.104623, 38.730962],
  // Falls Church: a city-owned light on W Broad St, and the Park Ave area (Dominion lights).
  "fc-city-light": [["fc-dominion", "fc-city"], -77.190152, 38.894499],
  "fc-park": [["fc-dominion", "fc-city"], -77.172613, 38.884922],
};

async function lights() {
  for (const [id, [layers, lon, lat]] of Object.entries(LIGHT_POINTS)) {
    for (const layer of layers) {
      await save("lights", `${id}.${layer}`, await getJson(LIGHT_LAYERS[layer], nearQuery(lon, lat, "*")));
    }
  }
}

const SECTIONS = { census, vdot, lights };

const wanted = process.argv.slice(2);
for (const name of wanted.length ? wanted : Object.keys(SECTIONS)) {
  await SECTIONS[name]();
}
