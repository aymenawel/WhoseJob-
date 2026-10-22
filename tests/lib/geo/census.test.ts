import { describe, expect, test } from "vitest";
import { geocodeAddress, lookupPoint, parseGeographies } from "@/lib/geo/census";
import ptArlington from "../../fixtures/census/pt-arlington.json";
import ptAlexandria from "../../fixtures/census/pt-alexandria.json";
import ptFallsChurch from "../../fixtures/census/pt-falls-church.json";
import ptFairfax from "../../fixtures/census/pt-fairfax.json";
import ptOutside from "../../fixtures/census/pt-outside.json";
import addrArlington from "../../fixtures/census/addr-arlington.json";
import addrNoMatch from "../../fixtures/census/addr-nomatch.json";

/** A fetch stand-in that records the URL and returns canned JSON. */
function stubFetch(body: unknown) {
  const calls: string[] = [];
  const fetchFn = (async (input: RequestInfo | URL) => {
    calls.push(String(input));
    return new Response(JSON.stringify(body), { status: 200 });
  }) as typeof fetch;
  return { fetchFn, calls };
}

describe("parseGeographies", () => {
  test("Arlington point is VA-08 in Arlington County", () => {
    expect(parseGeographies(ptArlington)).toEqual({
      districtId: "VA-08",
      locality: { id: "arlington", name: "Arlington County" },
      localityFips: "51013",
    });
  });

  test.each([
    [ptAlexandria, "alexandria"],
    [ptFallsChurch, "falls-church"],
    [ptFairfax, "fairfax"],
  ])("other VA-08 localities resolve (%#)", (fixture, id) => {
    const parsed = parseGeographies(fixture);
    expect(parsed.districtId).toBe("VA-08");
    expect(parsed.locality?.id).toBe(id);
  });

  test("Richmond is VA-04 and not one of our localities", () => {
    const parsed = parseGeographies(ptOutside);
    expect(parsed.districtId).toBe("VA-04");
    expect(parsed.locality).toBeNull();
  });

  test("garbage input gives all-null fields instead of throwing", () => {
    expect(parseGeographies({})).toEqual({ districtId: null, locality: null, localityFips: null });
  });
});

describe("geocodeAddress", () => {
  test("returns the matched point", async () => {
    const { fetchFn } = stubFetch(addrArlington);
    const hit = await geocodeAddress("2100 Clarendon Blvd, Arlington, VA 22201", fetchFn);
    expect(hit?.lat).toBeCloseTo(38.8914, 3);
    expect(hit?.lon).toBeCloseTo(-77.0849, 3);
    expect(hit?.matchedAddress).toContain("CLARENDON");
  });

  test("returns null when the Census finds no match", async () => {
    const { fetchFn } = stubFetch(addrNoMatch);
    expect(await geocodeAddress("1600 Wilsn Blvd Nowhere VA", fetchFn)).toBeNull();
  });
});

describe("lookupPoint", () => {
  test("asks for the vintage that returns 119th Congress districts", async () => {
    const { fetchFn, calls } = stubFetch(ptArlington);
    const parsed = await lookupPoint(38.8914, -77.0849, fetchFn);
    expect(parsed.districtId).toBe("VA-08");
    expect(calls[0]).toContain("vintage=ACS2025_Current");
    expect(calls[0]).toContain("benchmark=Public_AR_Current");
  });
});
