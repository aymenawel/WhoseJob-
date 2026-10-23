import { describe, expect, test } from "vitest";
import { arlingtonOwner, queryArlingtonStreet } from "@/lib/geo/arlingtonStreets";
import gwParkway from "../../fixtures/arl-streets/gw-parkway.json";
import clarendon from "../../fixtures/arl-streets/clarendon.json";
import noStreet from "../../fixtures/arl-streets/airport-no-street.json";
import rateLimited from "../../fixtures/arcgis/rate-limited.json";

const fetchReturning = (body: unknown) => (async () => new Response(JSON.stringify(body))) as unknown as typeof fetch;

describe("arlingtonOwner", () => {
  test.each([
    ["ARL", { owner: "county" }],
    ["VDOT", { owner: "state" }],
    ["NPS", { owner: "federal", agency: "nps" }],
    ["PENT", { owner: "federal", agency: "pentagon" }],
    ["FED", { owner: "federal", agency: "federal" }],
    ["MWAA", { owner: "other", agency: "airport" }],
    ["DDOT", { owner: "other", agency: "dc" }],
    ["PVT", { owner: "private" }],
    ["OT", { owner: "other", agency: "other" }],
    [null, { owner: "unknown" }],
  ] as const)("%s", (code, expected) => {
    expect(arlingtonOwner(code)).toEqual(expected);
  });
});

describe("queryArlingtonStreet", () => {
  test("the GW Parkway is the National Park Service's, not the county's", async () => {
    const road = await queryArlingtonStreet(38.8857, -77.0629, fetchReturning(gwParkway));
    expect(road).toMatchObject({ name: "George Washington Memorial Pkwy", owner: "federal", agency: "nps" });
  });

  test("Clarendon Blvd is the county's", async () => {
    const road = await queryArlingtonStreet(38.891447, -77.085525, fetchReturning(clarendon));
    expect(road).toMatchObject({ owner: "county" });
  });

  test("no street near the pin is null", async () => {
    expect(await queryArlingtonStreet(38.8512, -77.0402, fetchReturning(noStreet))).toBeNull();
  });

  test("an error inside a 200 is a failure", async () => {
    await expect(queryArlingtonStreet(38.8857, -77.0629, fetchReturning(rateLimited))).rejects.toThrow();
  });
});
