import { describe, expect, test } from "vitest";
import { queryStreetlight } from "@/lib/geo/streetlight";
import domPoleCounty from "../../fixtures/lights/arl-dom-pole.arl-county.json";
import domPoleDominion from "../../fixtures/lights/arl-dom-pole.arl-dominion.json";
import ctyPoleCounty from "../../fixtures/lights/arl-cty-pole.arl-county.json";
import ctyPoleDominion from "../../fixtures/lights/arl-cty-pole.arl-dominion.json";
import wilsonCounty from "../../fixtures/lights/arl-wilson.arl-county.json";
import wilsonDominion from "../../fixtures/lights/arl-wilson.arl-dominion.json";
import alxKing from "../../fixtures/lights/alx-king.alx.json";
import ffxRichmond from "../../fixtures/lights/ffx-richmond.ffx-dominion.json";
import rateLimited from "../../fixtures/arcgis/rate-limited.json";
import fcCityDominion from "../../fixtures/lights/fc-city-light.fc-dominion.json";
import fcCityCity from "../../fixtures/lights/fc-city-light.fc-city.json";
import fcParkDominion from "../../fixtures/lights/fc-park.fc-dominion.json";
import fcParkCity from "../../fixtures/lights/fc-park.fc-city.json";

const EMPTY = { type: "FeatureCollection", features: [] };

/** Routes each layer URL to a fixture by a distinctive URL fragment. */
function fetchByLayer(byFragment: Record<string, unknown>) {
  const calls: string[] = [];
  const fn = (async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    const key = Object.keys(byFragment).find((k) => url.includes(k));
    if (!key) throw new Error(`unexpected ${url}`);
    const body = byFragment[key];
    if (body instanceof Error) throw body;
    return new Response(JSON.stringify(body));
  }) as typeof fetch;
  return { fn, calls };
}

const point = (lon: number, lat: number, props: Record<string, unknown>) => ({
  type: "Feature",
  geometry: { type: "Point", coordinates: [lon, lat] },
  properties: props,
});

describe("queryStreetlight", () => {
  test("pin on Dominion's pole on Clarendon Blvd → Dominion", async () => {
    const { fn } = fetchByLayer({ Arlington_Owned: domPoleCounty, DominionLights: domPoleDominion });
    const light = await queryStreetlight("arlington", 38.891447, -77.085525, fn);
    expect(light).toMatchObject({ owner: "dominion", poleId: "C0918WL6800" });
    expect(light!.distanceM).toBeLessThan(3);
  });

  test("pin on the county's pole a block away → Arlington County", async () => {
    const { fn } = fetchByLayer({ Arlington_Owned: ctyPoleCounty, DominionLights: ctyPoleDominion });
    const light = await queryStreetlight("arlington", 38.891372, -77.084805, fn);
    expect(light).toMatchObject({ owner: "county", poleId: "190MA01SE" });
  });

  test("county and Dominion lights within 3 m of each other → unknown (ask the pole tag)", async () => {
    const { fn } = fetchByLayer({ Arlington_Owned: wilsonCounty, DominionLights: wilsonDominion });
    const light = await queryStreetlight("arlington", 38.891248, -77.085917, fn);
    expect(light?.owner).toBe("unknown");
  });

  test("the 3 m rule uses distance, not order: 10 m vs 25 m picks the nearer", async () => {
    // ~10 m and ~25 m north of the pin.
    const near = point(-77.0, 38.00009, { PoleNumber: "NEAR1", MaintainedBy: "Arlington County" });
    const far = point(-77.0, 38.000225, { GRID_ADDRE: "FAR1" });
    const { fn } = fetchByLayer({
      Arlington_Owned: { type: "FeatureCollection", features: [near] },
      DominionLights: { type: "FeatureCollection", features: [far] },
    });
    expect((await queryStreetlight("arlington", 38.0, -77.0, fn))?.owner).toBe("county");
  });

  test("Alexandria reads the owner from SL_OWNER", async () => {
    const { fn } = fetchByLayer({ alxCCCStreetlights: alxKing });
    const light = await queryStreetlight("alexandria", 38.80457, -77.042607, fn);
    expect(light).toMatchObject({ owner: "dominion", poleId: "C1014XJ3700" });
  });

  test("Fairfax gives the pole and the county's pre-filled report form", async () => {
    const { fn } = fetchByLayer({ "MapServer/1/": ffxRichmond, "MapServer/0/": EMPTY });
    const light = await queryStreetlight("fairfax", 38.730962, -77.104623, fn);
    expect(light).toMatchObject({ owner: "dominion", poleId: "C0911LB4100" });
    expect(light!.formUrl).toMatch(/^https:\/\/www\.fairfaxcounty\.gov\/gisapps\/StreetlightReporter\/ReportProblem\.aspx/);
  });

  test("Falls Church: a city-owned light gives the city and its streetlight ID for the repair form", async () => {
    const { fn } = fetchByLayer({ "FeatureServer/1/": fcCityDominion, "FeatureServer/2/": fcCityCity });
    const light = await queryStreetlight("falls-church", 38.894499, -77.190152, fn);
    expect(light).toMatchObject({ owner: "city", poleId: "1002" });
  });

  test("Falls Church: a Dominion-maintained light near Park Ave gives Dominion and its pole number", async () => {
    const { fn } = fetchByLayer({ "FeatureServer/1/": fcParkDominion, "FeatureServer/2/": fcParkCity });
    const light = await queryStreetlight("falls-church", 38.884922, -77.172613, fn);
    expect(light).toMatchObject({ owner: "dominion", poleId: "C0718UH2800" });
  });

  test("one layer failing fails the whole lookup, so the resident is asked instead", async () => {
    const { fn } = fetchByLayer({ Arlington_Owned: new Error("down"), DominionLights: domPoleDominion });
    await expect(queryStreetlight("arlington", 38.891447, -77.085525, fn)).rejects.toThrow();
  });

  test("an ArcGIS error body on one layer fails the lookup too", async () => {
    const { fn } = fetchByLayer({ Arlington_Owned: rateLimited, DominionLights: domPoleDominion });
    await expect(queryStreetlight("arlington", 38.891447, -77.085525, fn)).rejects.toThrow(/429/);
  });

  test("every layer answering with no lights nearby → null", async () => {
    const { fn } = fetchByLayer({ Arlington_Owned: EMPTY, DominionLights: EMPTY });
    expect(await queryStreetlight("arlington", 38.891447, -77.085525, fn)).toBeNull();
  });
});
