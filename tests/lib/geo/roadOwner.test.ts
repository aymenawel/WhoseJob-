import { describe, expect, test } from "vitest";
import { mapMaintenance, queryRoadOwner, vdotOwner } from "@/lib/geo/roadOwner";
import clarendon from "../../fixtures/vdot/clarendon.json";
import glebe from "../../fixtures/vdot/glebe.json";
import kingSt from "../../fixtures/vdot/king-st.json";
import us1 from "../../fixtures/vdot/us-1.json";
import empty from "../../fixtures/vdot/empty.json";
import rateLimited from "../../fixtures/arcgis/rate-limited.json";

const fetchReturning = (body: unknown) => (async () => new Response(JSON.stringify(body))) as unknown as typeof fetch;

describe("mapMaintenance", () => {
  test.each([
    ["01-State Hwy Agency (1,2)", "state"],
    ["02-County Hwy Agency (3)", "county"],
    ["04-Municipal or City Hwy Agency (4* Verify)", "city"],
    ["04a-City no VDOT Payment", "city"],
    ["26-Private: other than railroad-Incl private toll facilities", "private"],
    ["66-National Park Service (D)", "federal"],
    ["60-Other Federal Agency (A)", "federal"],
    ["74-Army", "federal"],
    ["03-Town or Twnship Hwy Agency (4* Verify)", "other"],
    ["12-Local Park, Forest, or Reservation Agency", "other"],
    ["40-Other Public Instrumentality (Airport,School/College,etc)", "other"],
    [null, "unknown"],
  ] as const)("%s → %s", (code, owner) => {
    expect(mapMaintenance(code)).toBe(owner);
  });

  test("federal and other owners name who they are", () => {
    expect(vdotOwner("66-National Park Service (D)")).toEqual({ owner: "federal", agency: "nps" });
    expect(vdotOwner("74-Army")).toEqual({ owner: "federal", agency: "army" });
    expect(vdotOwner("40-Other Public Instrumentality (Airport,School/College,etc)")).toEqual({ owner: "other", agency: "institution" });
    expect(vdotOwner("02-County Hwy Agency (3)")).toEqual({ owner: "county" });
  });
});

describe("queryRoadOwner", () => {
  test("picks Clarendon Blvd, not the cross streets, and it is the county's", async () => {
    const road = await queryRoadOwner(38.8914, -77.0849, fetchReturning(clarendon));
    expect(road).toMatchObject({ name: "Clarendon BLVD (PR - Arlington County)", owner: "county" });
    expect(road!.distanceM).toBeLessThan(60);
  });

  test.each([
    ["Glebe Rd in Arlington is still a state road", glebe, 38.8445, -77.0745, "state"],
    ["King St is Alexandria's", kingSt, 38.8046, -77.0426, "city"],
    ["US-1 in Fairfax is VDOT's", us1, 38.731, -77.1046, "state"],
  ] as const)("%s", async (_name, fixture, lat, lon, owner) => {
    const road = await queryRoadOwner(lat, lon, fetchReturning(fixture));
    expect(road?.owner).toBe(owner);
    expect(road!.distanceM).toBeLessThan(60);
  });

  test("no road within range is null", async () => {
    expect(await queryRoadOwner(38.815, -77.03, fetchReturning(empty))).toBeNull();
  });

  test("an ArcGIS error inside a 200 response is a failure, not 'no road nearby'", async () => {
    await expect(queryRoadOwner(38.8914, -77.0849, fetchReturning(rateLimited))).rejects.toThrow(/429/);
  });
});
