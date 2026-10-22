import { describe, expect, test } from "vitest";
import { resolveChecks } from "@/lib/jurisdiction/resolve";
import { handleResolve } from "@/lib/api/resolve";
import ptArlington from "../../fixtures/census/pt-arlington.json";
import ptOutside from "../../fixtures/census/pt-outside.json";
import clarendon from "../../fixtures/vdot/clarendon.json";
import domPoleCounty from "../../fixtures/lights/arl-dom-pole.arl-county.json";
import domPoleDominion from "../../fixtures/lights/arl-dom-pole.arl-dominion.json";

// Pin on Dominion's pole on Clarendon Blvd.
const LAT = 38.891447;
const LON = -77.085525;

type Reply = unknown | Error | "hang";

function fakeFetch(replies: { census: Reply; vdot?: Reply; county?: Reply; dominion?: Reply }) {
  const calls: string[] = [];
  const fn = (async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    const reply = url.includes("geocoding.geo.census.gov")
      ? replies.census
      : url.includes("VDOT_Route")
        ? replies.vdot
        : url.includes("Arlington_Owned")
          ? replies.county
          : url.includes("DominionLights")
            ? replies.dominion
            : new Error(`unexpected ${url}`);
    if (reply === "hang") return new Promise<Response>(() => {});
    if (reply instanceof Error) throw reply;
    return new Response(JSON.stringify(reply));
  }) as typeof fetch;
  return { fn, calls };
}

const arlingtonReplies = { census: ptArlington, vdot: clarendon, county: domPoleCounty, dominion: domPoleDominion };

describe("resolveChecks", () => {
  test("all checks for a pin on Dominion's pole in Arlington", async () => {
    const { fn } = fakeFetch(arlingtonReplies);
    const checks = await resolveChecks(LAT, LON, { fetchFn: fn });
    expect(checks).toMatchObject({
      point: { lat: LAT, lon: LON },
      district: { id: "VA-08", inCoverage: true },
      locality: { id: "arlington" },
      road: { owner: "county" },
      streetlight: { owner: "dominion", poleId: "C0918WL6800" },
      fallbacks: [],
    });
  });

  test("Census timing out falls back to the bundled boundaries, and says so", async () => {
    const { fn } = fakeFetch({ ...arlingtonReplies, census: "hang" });
    const checks = await resolveChecks(LAT, LON, { fetchFn: fn, timeoutMs: 50 });
    expect(checks.locality?.id).toBe("arlington");
    expect(checks.district).toEqual({ id: "VA-08", inCoverage: true });
    expect(checks.fallbacks).toContain("census");
    expect(checks.streetlight?.owner).toBe("dominion");
  });

  test("Census erroring falls back the same way", async () => {
    const { fn } = fakeFetch({ ...arlingtonReplies, census: new Error("503") });
    const checks = await resolveChecks(LAT, LON, { fetchFn: fn });
    expect(checks.locality?.id).toBe("arlington");
    expect(checks.fallbacks).toContain("census");
  });

  test("a point outside VA-08 is out of coverage and runs no local lookups", async () => {
    const { fn, calls } = fakeFetch({ census: ptOutside });
    const checks = await resolveChecks(37.5407, -77.436, { fetchFn: fn });
    expect(checks.district).toEqual({ id: "VA-04", inCoverage: false });
    expect(checks.locality).toBeNull();
    expect(checks.road).toBeNull();
    expect(checks.streetlight).toBeNull();
    expect(calls.every((u) => u.includes("geocoding.geo.census.gov"))).toBe(true);
  });

  test("VDOT down: road is null and the fallback is recorded", async () => {
    const { fn } = fakeFetch({ ...arlingtonReplies, vdot: new Error("down") });
    const checks = await resolveChecks(LAT, LON, { fetchFn: fn });
    expect(checks.road).toBeNull();
    expect(checks.fallbacks).toContain("road");
  });

  test("streetlight layers down: streetlight is null and the fallback is recorded", async () => {
    const { fn } = fakeFetch({ ...arlingtonReplies, county: new Error("down"), dominion: new Error("down") });
    const checks = await resolveChecks(LAT, LON, { fetchFn: fn });
    expect(checks.streetlight).toBeNull();
    expect(checks.fallbacks).toContain("streetlight");
  });
});

describe("GET /api/resolve", () => {
  test("non-numeric coordinates are a 400", async () => {
    const res = await handleResolve(new Request("http://localhost/api/resolve?lat=abc&lon=-77"));
    expect(res.status).toBe(400);
  });

  test("valid coordinates return the checks", async () => {
    const res = await handleResolve(new Request(`http://localhost/api/resolve?lat=${LAT}&lon=${LON}`), async (lat, lon) => ({
      point: { lat, lon },
      district: { id: "VA-08", inCoverage: true },
      locality: { id: "arlington", name: "Arlington County" },
      road: null,
      streetlight: null,
      fallbacks: [],
    }));
    expect(res.status).toBe(200);
    expect((await res.json()).district.id).toBe("VA-08");
  });
});
