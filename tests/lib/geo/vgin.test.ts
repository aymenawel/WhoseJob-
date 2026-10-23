import { describe, expect, test } from "vitest";
import { locateSuggestion, locateText, prettyAddress, suggestAddresses } from "@/lib/geo/vgin";

function fakeFetch(body: unknown) {
  const urls: string[] = [];
  const fn = (async (input: RequestInfo | URL) => {
    urls.push(String(input));
    return new Response(JSON.stringify(body));
  }) as typeof fetch;
  return { fn, urls };
}

describe("prettyAddress", () => {
  test("turns the locator's capitals into a readable address", () => {
    expect(prettyAddress("2400 LANGSTON BLVD, ARLINGTON, VA, 22201")).toBe("2400 Langston Blvd, Arlington, VA 22201");
    expect(prettyAddress("301 N ST ASAPH ST, ALEXANDRIA, VA, 22314")).toBe("301 N St Asaph St, Alexandria, VA 22314");
    expect(prettyAddress("1600 19TH ST N, ARLINGTON, VA, 22209")).toBe("1600 19th St N, Arlington, VA 22209");
  });

  test("leaves place names that are already mixed case alone", () => {
    expect(prettyAddress("Ronald Reagan Washington National Airport (DCA), Arlington, VA")).toBe(
      "Ronald Reagan Washington National Airport (DCA), Arlington, VA",
    );
  });
});

describe("suggestAddresses", () => {
  test("asks Virginia's statewide locator, limited to the area around VA-08", async () => {
    const { fn, urls } = fakeFetch({
      suggestions: [
        { text: "2400 LANGSTON BLVD, ARLINGTON, VA, 22201", magicKey: "k1", isCollection: false },
        { text: "Arlington", magicKey: "k2", isCollection: true },
      ],
    });
    const out = await suggestAddresses("2400 Langs", { fetchFn: fn });
    expect(out).toEqual([{ label: "2400 Langston Blvd, Arlington, VA 22201", text: "2400 LANGSTON BLVD, ARLINGTON, VA, 22201", magicKey: "k1" }]);
    const u = new URL(urls[0]);
    expect(u.pathname).toMatch(/VGIN_Composite_Locator\/GeocodeServer\/suggest$/);
    expect(u.searchParams.get("text")).toBe("2400 Langs");
    expect(JSON.parse(u.searchParams.get("searchExtent")!)).toMatchObject({ xmin: expect.any(Number), ymax: expect.any(Number) });
  });

  test("fewer than 3 characters asks nothing", async () => {
    const { fn, urls } = fakeFetch({ suggestions: [] });
    expect(await suggestAddresses("24", { fetchFn: fn })).toEqual([]);
    expect(urls).toHaveLength(0);
  });

  test("an error inside a 200 is a failure, not 'no matches'", async () => {
    const { fn } = fakeFetch({ error: { code: 500, message: "boom" } });
    await expect(suggestAddresses("2400 Langs", { fetchFn: fn })).rejects.toThrow();
  });
});

describe("locateSuggestion", () => {
  test("turns a picked suggestion into a point", async () => {
    const { fn, urls } = fakeFetch({
      candidates: [{ address: "2400 LANGSTON BLVD, ARLINGTON, VA, 22201", location: { x: -77.0891, y: 38.895 }, score: 100 }],
    });
    const hit = await locateSuggestion({ text: "2400 LANGSTON BLVD, ARLINGTON, VA, 22201", magicKey: "k1" }, fn);
    expect(hit).toEqual({ lat: 38.895, lon: -77.0891, matchedAddress: "2400 Langston Blvd, Arlington, VA 22201" });
    expect(new URL(urls[0]).searchParams.get("magicKey")).toBe("k1");
  });

  test("no candidate is null", async () => {
    const { fn } = fakeFetch({ candidates: [] });
    expect(await locateSuggestion({ text: "x", magicKey: "k" }, fn)).toBeNull();
  });
});

describe("locateText (Enter without picking a suggestion)", () => {
  const cand = (address: string, score: number, type: string) => ({ address, score, location: { x: -77.08, y: 38.89 }, attributes: { Addr_type: type } });

  test("an exact address is accepted", async () => {
    const { fn } = fakeFetch({ candidates: [cand("3001 RICHMOND HWY, ARLINGTON, VA, 22202", 100, "StreetAddress")] });
    expect(await locateText("3001 Richmond Hwy, Arlington VA", fn)).toMatchObject({ matchedAddress: "3001 Richmond Hwy, Arlington, VA 22202" });
  });

  test("a whole street is not accepted for a typed house number", async () => {
    const { fn } = fakeFetch({ candidates: [cand("FAIRFAX DR, ARLINGTON, VA, 22205", 90.84, "StreetName")] });
    expect(await locateText("901 N Fairfax Dr, Arlington VA", fn)).toBeNull();
  });

  test("a near miss on another street (Dr typed, St found) is not accepted", async () => {
    const { fn } = fakeFetch({ candidates: [cand("901 N FAIRFAX ST, ALEXANDRIA, VA, 22314", 95.99, "PointAddress")] });
    expect(await locateText("901 N Fairfax Dr", fn)).toBeNull();
  });

  test("a different house number is not accepted", async () => {
    const { fn } = fakeFetch({ candidates: [cand("900 N GLEBE RD, ARLINGTON, VA, 22203", 98, "StreetAddress")] });
    expect(await locateText("901 N Glebe Rd", fn)).toBeNull();
  });

  test("a landmark by name is accepted", async () => {
    const { fn } = fakeFetch({ candidates: [cand("Ronald Reagan Washington National Airport (DCA), Arlington, VA", 100, "POI")] });
    expect(await locateText("Reagan National Airport", fn)).not.toBeNull();
  });
});
