// Builds src/data/roads-va08.json: a snapshot of VDOT's road-ownership
// segments around VA-08. The live VDOT service shares one request quota with
// all of its users and often answers "too many requests"; the app falls back
// to this snapshot so a resident (or a judge) still gets an answer.
//
// The statewide file is ~680 MB, so it is streamed and filtered feature by
// feature rather than parsed whole.  Usage: node scripts/build-roads.mjs
import { writeFile } from "node:fs/promises";

const ITEM = "ec7cd4ed99654c35ac81316ac8c9e442_0";
const URL_ = `https://hub.arcgis.com/api/v3/datasets/${ITEM}/downloads/data?format=geojson&spatialRefId=4326&where=1%3D1`;
// VA-08's bounding box plus ~200 m, so pins near the edge still find their road.
const BBOX = { minX: -77.2420, minY: 38.6020, maxX: -77.0295, maxY: 38.9710 };

const inBox = ([x, y]) => x >= BBOX.minX && x <= BBOX.maxX && y >= BBOX.minY && y <= BBOX.maxY;
const round = (n) => Math.round(n * 1e5) / 1e5; // ~1 m: plenty for "which road is this pin on"

function lines(geometry) {
  if (!geometry) return [];
  if (geometry.type === "LineString") return [geometry.coordinates];
  if (geometry.type === "MultiLineString") return geometry.coordinates;
  return [];
}

const roads = [];
let seen = 0;

function onFeature(text) {
  seen++;
  const f = JSON.parse(text);
  const parts = lines(f.geometry).filter((line) => line.some(inBox));
  if (parts.length === 0) return;
  const owner = (f.properties.RIM_MAINT_RESPONSIBILITY_NM ?? "").slice(0, 2);
  roads.push([f.properties.RTE_COMMON_NM, owner, parts.map((line) => line.map(([x, y]) => [round(x), round(y)]))]);
}

// Minimal streaming splitter: finds each object inside the "features" array
// by tracking brace depth, skipping braces inside strings.
let depth = 0;
let inString = false;
let escaped = false;
let inFeatures = false;
let buf = "";
let start = -1;
let head = "";

const res = await fetch(URL_);
if (!res.ok) throw new Error(`download failed: ${res.status}`);
const decoder = new TextDecoder();
let bytes = 0;

for await (const chunk of res.body) {
  bytes += chunk.length;
  const text = decoder.decode(chunk, { stream: true });
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (!inFeatures) {
      head += c;
      if (head.endsWith('"features"')) inFeatures = "pending";
      if (inFeatures === "pending" && c === "[") {
        inFeatures = true;
        depth = 0;
      }
      if (head.length > 200) head = head.slice(-50);
      continue;
    }
    if (start >= 0) buf += c;
    if (inString) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    else if (c === "{") {
      if (depth === 0) {
        start = i;
        buf = "{";
      }
      depth++;
    } else if (c === "}") {
      depth--;
      if (depth === 0) {
        onFeature(buf);
        buf = "";
        start = -1;
      }
    }
  }
  if (seen && seen % 50000 < 40) process.stdout.write(`\r${(bytes / 1e6).toFixed(0)} MB, ${seen} features, kept ${roads.length}   `);
}

const out = {
  source: "VDOT Route Responsibility (ArcGIS item ec7cd4ed99654c35ac81316ac8c9e442), via ArcGIS Hub download",
  generated: new Date().toISOString().slice(0, 10),
  // Each road: [common name, maintenance code prefix ("01" state, "02" county, "04" city), [line coords...]]
  roads,
};
await writeFile("src/data/roads-va08.json", JSON.stringify(out));
console.log(`\nscanned ${seen} features, kept ${roads.length}`);
