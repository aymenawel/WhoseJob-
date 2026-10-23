import { describe, expect, test } from "vitest";
import { handleGeocode } from "@/lib/api/geocode";

const req = (q?: string) => new Request(`http://localhost/api/geocode${q === undefined ? "" : `?q=${encodeURIComponent(q)}`}`);

describe("GET /api/geocode", () => {
  test("an address the Census can't match is a 404, not a crash", async () => {
    const res = await handleGeocode(req("1600 Wilsn Blvd Nowhere VA"), {
      geocodeAddress: async () => null,
      lookupPoint: async () => {
        throw new Error("should not be called");
      },
    });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not-found" });
  });

  test("a match returns the point with its district and locality", async () => {
    const res = await handleGeocode(req("2100 Clarendon Blvd, Arlington, VA 22201"), {
      geocodeAddress: async () => ({ lat: 38.8914, lon: -77.0849, matchedAddress: "2100 CLARENDON BLVD, ARLINGTON, VA, 22201" }),
      lookupPoint: async () => ({ districtId: "VA-08", locality: { id: "arlington", name: "Arlington County" }, localityFips: "51013" }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      lat: 38.8914,
      lon: -77.0849,
      districtId: "VA-08",
      locality: { id: "arlington" },
    });
  });

  test("Census failing is 'unavailable', never 'not found': the resident isn't blamed for our upstream", async () => {
    const res = await handleGeocode(req("2300 Wilson Blvd, Arlington, VA"), {
      geocodeAddress: async () => {
        throw new Error("Census 503");
      },
      lookupPoint: async () => ({ districtId: null, locality: null, localityFips: null }),
    });
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "unavailable" });
  });

  test("Census hanging becomes 'unavailable' after the timeout", async () => {
    const res = await handleGeocode(req("2300 Wilson Blvd, Arlington, VA"), {
      geocodeAddress: () => new Promise(() => {}),
      lookupPoint: async () => ({ districtId: null, locality: null, localityFips: null }),
      timeoutMs: 20,
    });
    expect(res.status).toBe(503);
  });

  test("one failed try is retried once", async () => {
    let calls = 0;
    const res = await handleGeocode(req("2300 Wilson Blvd, Arlington, VA"), {
      geocodeAddress: async () => {
        if (++calls === 1) throw new Error("Census 502");
        return { lat: 38.89, lon: -77.08, matchedAddress: "2300 WILSON BLVD, ARLINGTON, VA, 22201" };
      },
      lookupPoint: async () => ({ districtId: "VA-08", locality: { id: "arlington", name: "Arlington County" }, localityFips: "51013" }),
    });
    expect(res.status).toBe(200);
    expect(calls).toBe(2);
  });

  test("a missing query is a 400", async () => {
    const res = await handleGeocode(req(), { geocodeAddress: async () => null, lookupPoint: async () => ({ districtId: null, locality: null, localityFips: null }) });
    expect(res.status).toBe(400);
  });
});
