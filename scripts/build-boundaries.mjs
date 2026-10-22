// Downloads and simplifies the boundaries the app bundles as a fallback for
// when the Census Geocoder is down: VA-08 (119th Congress) and its four
// counties/cities. Usage: node scripts/build-boundaries.mjs
import { writeFile } from "node:fs/promises";
import { simplify } from "@turf/simplify";

const TIGER = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb";

async function geojson(url, where, outFields) {
  const u = new URL(url);
  for (const [k, v] of Object.entries({ where, outFields, outSR: 4326, f: "geojson", geometryPrecision: 6 })) {
    u.searchParams.set(k, String(v));
  }
  const res = await fetch(u);
  if (!res.ok) throw new Error(`${res.status} ${u}`);
  return res.json();
}

// ~50 m tolerance: plenty for "which county is this pin in".
const slim = (fc) => simplify(fc, { tolerance: 0.0005, highQuality: true });

const district = slim(await geojson(`${TIGER}/Legislative/MapServer/8/query`, "GEOID='5108'", "GEOID,NAME"));
await writeFile("src/data/va08-boundary.json", JSON.stringify(district) + "\n");

const ids = { "51013": "arlington", "51510": "alexandria", "51610": "falls-church", "51059": "fairfax" };
const counties = slim(
  await geojson(`${TIGER}/State_County/MapServer/1/query`, `GEOID IN (${Object.keys(ids).map((g) => `'${g}'`).join(",")})`, "GEOID,NAME"),
);
for (const f of counties.features) f.properties = { id: ids[f.properties.GEOID], name: f.properties.NAME, fips: f.properties.GEOID };
await writeFile("src/data/localities.json", JSON.stringify(counties) + "\n");

console.log("district features", district.features.length, "localities", counties.features.map((f) => f.properties.name));
