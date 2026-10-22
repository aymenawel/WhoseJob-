import type { Checks } from "@/lib/types";
import { distanceToGeometry } from "@/lib/geo/nearest";
import { mapMaintenance } from "@/lib/geo/roadOwner";

/** [common name, maintenance code prefix, lines]; built by scripts/build-roads.mjs. */
export type SnapshotRoad = [name: string, code: string, lines: number[][][]];
export type RoadSnapshot = { generated: string; roads: SnapshotRoad[] };

const RADIUS_M = 60;
// ~90 m in degrees at this latitude: a cheap box test before the exact distance.
const PAD = 0.0009;

type Box = [minX: number, minY: number, maxX: number, maxY: number];
const boxes = new WeakMap<SnapshotRoad, Box>();

function boxOf(road: SnapshotRoad): Box {
  let b = boxes.get(road);
  if (!b) {
    b = [Infinity, Infinity, -Infinity, -Infinity];
    for (const line of road[2]) {
      for (const [x, y] of line) {
        if (x < b[0]) b[0] = x;
        if (y < b[1]) b[1] = y;
        if (x > b[2]) b[2] = x;
        if (y > b[3]) b[3] = y;
      }
    }
    boxes.set(road, b);
  }
  return b;
}

export function nearestRoadInSnapshot(lat: number, lon: number, snap: RoadSnapshot): Checks["road"] {
  let best: { road: SnapshotRoad; d: number } | null = null;
  for (const road of snap.roads) {
    const [minX, minY, maxX, maxY] = boxOf(road);
    if (lon < minX - PAD || lon > maxX + PAD || lat < minY - PAD || lat > maxY + PAD) continue;
    const d = distanceToGeometry(lon, lat, { type: "MultiLineString", coordinates: road[2] });
    if (d <= RADIUS_M && (!best || d < best.d)) best = { road, d };
  }
  return best ? { name: best.road[0], owner: mapMaintenance(best.road[1]), distanceM: Math.round(best.d) } : null;
}

/** Loaded only when the live VDOT service fails, so the large file stays off the common path. */
export async function loadRoadSnapshot(): Promise<RoadSnapshot> {
  return (await import("@/data/roads-va08.json")).default as unknown as RoadSnapshot;
}
