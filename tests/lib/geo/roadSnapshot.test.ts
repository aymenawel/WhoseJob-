import { describe, expect, test } from "vitest";
import { nearestRoadInSnapshot, type RoadSnapshot } from "@/lib/geo/roadSnapshot";

// Two synthetic roads: an east-west county street and a north-south state road.
const snap: RoadSnapshot = {
  generated: "2026-10-22",
  roads: [
    ["Clarendon BLVD (PR - Arlington County)", "02", [[[-77.09, 38.8914], [-77.08, 38.8914]]]],
    ["VA-120N", "01", [[[-77.0745, 38.83], [-77.0745, 38.86]]]],
  ],
};

describe("nearestRoadInSnapshot", () => {
  test("a pin on the county street finds it, as the county's", () => {
    expect(nearestRoadInSnapshot(38.8915, -77.085, snap)).toMatchObject({ name: "Clarendon BLVD (PR - Arlington County)", owner: "county" });
  });

  test("a pin mid-way along a long segment with far-apart vertices still finds it", () => {
    // Nearest vertex is ~1.7 km away; the line itself is ~9 m away.
    const road = nearestRoadInSnapshot(38.845, -77.0746, snap);
    expect(road?.owner).toBe("state");
    expect(road!.distanceM).toBeLessThan(15);
  });

  test("nothing within 60 m → null", () => {
    expect(nearestRoadInSnapshot(38.8, -77.0, snap)).toBeNull();
  });
});

describe("the bundled VA-08 snapshot", () => {
  test.each([
    ["county pole on N Uhle St, Arlington", 38.891372, -77.084805, "county"],
    ["Columbia Pike (VA-244), Annandale", 38.8311219, -77.1945381, "state"],
    ["King St, Alexandria", 38.80457, -77.042607, "city"],
    ["Park Ave, Falls Church", 38.884922, -77.172613, "city"],
    ["US-1, Fairfax", 38.730962, -77.104623, "state"],
  ] as const)("%s", async (_name, lat, lon, owner) => {
    const { loadRoadSnapshot } = await import("@/lib/geo/roadSnapshot");
    const road = nearestRoadInSnapshot(lat, lon, await loadRoadSnapshot());
    expect(road?.owner).toBe(owner);
  });
});
