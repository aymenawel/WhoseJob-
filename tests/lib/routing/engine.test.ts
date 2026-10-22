import { describe, expect, test } from "vitest";
import { route } from "@/lib/routing/engine";
import { offices, rules } from "@/lib/routing/data";
import type { Checks } from "@/lib/types";

function checks(over: Partial<Checks>): Checks {
  return {
    point: { lat: 38.89, lon: -77.08 },
    district: { id: "VA-08", inCoverage: true },
    locality: { id: "arlington", name: "Arlington County" },
    road: { name: "Clarendon BLVD", owner: "county", distanceM: 5 },
    streetlight: { owner: "county", poleId: "190MA01SE", distanceM: 0 },
    fallbacks: [],
    ...over,
  };
}

const run = (issue: Parameters<typeof route>[0], c: Checks) => route(issue, c, rules, offices);

describe("route", () => {
  test("Dominion's light in Arlington goes to Dominion, not the county", () => {
    const r = run("streetlight", checks({ streetlight: { owner: "dominion", poleId: "C0918WL6800", distanceM: 0 } }));
    expect(r).toMatchObject({ kind: "routed", office: "dominion", level: "utility", decidedBy: "streetlight", notOffice: "arlington-streetlights" });
  });

  test("the county's own light in Arlington goes to the county", () => {
    const r = run("streetlight", checks({}));
    expect(r).toMatchObject({ kind: "routed", office: "arlington-streetlights", level: "local", decidedBy: "streetlight" });
  });

  test("a pothole on a Fairfax road goes to VDOT, not Fairfax County", () => {
    const r = run(
      "pothole",
      checks({ locality: { id: "fairfax", name: "Fairfax County" }, road: { name: "VA-244E", owner: "state", distanceM: 4 } }),
    );
    expect(r).toMatchObject({ kind: "routed", office: "vdot", level: "state", decidedBy: "road", notOffice: "fairfax-main" });
  });

  test("a pothole on Glebe Rd, a state road inside Arlington, goes to VDOT", () => {
    const r = run("pothole", checks({ road: { name: "VA-120N", owner: "state", distanceM: 3 } }));
    expect(r).toMatchObject({ kind: "routed", office: "vdot", level: "state" });
  });

  test("a pothole on an Arlington street goes to the county", () => {
    expect(run("pothole", checks({}))).toMatchObject({ kind: "routed", office: "arlington-311", level: "local" });
  });

  test("no road found falls back to the rule's default office", () => {
    expect(run("pothole", checks({ road: null }))).toMatchObject({ kind: "routed", office: "arlington-311" });
  });

  test.each([
    ["owner unknown (near-tie)", { owner: "unknown" as const, distanceM: 7 }],
    ["no light found / no layer", null],
  ])("streetlight with %s asks the resident to read the pole tag", (_name, streetlight) => {
    expect(run("streetlight", checks({ streetlight }))).toEqual({ kind: "ask-pole-tag" });
  });

  test("a point outside VA-08 is out of coverage, whatever the issue", () => {
    const outside = checks({ district: { id: "VA-04", inCoverage: false }, locality: null, road: null, streetlight: null });
    expect(run("pothole", outside)).toEqual({ kind: "out-of-coverage", districtId: "VA-04" });
    expect(run("federal", outside)).toEqual({ kind: "out-of-coverage", districtId: "VA-04" });
  });

  test("a federal issue in VA-08 goes to the Member's district office", () => {
    expect(run("federal", checks({}))).toMatchObject({
      kind: "routed",
      office: "member-district-office",
      level: "federal",
      decidedBy: "federal",
    });
  });

  test("every routed answer carries a reason in English and Spanish", () => {
    const r = run("streetlight", checks({ streetlight: { owner: "dominion", distanceM: 0 } }));
    if (r.kind !== "routed") throw new Error("expected routed");
    expect(r.why.en.length).toBeGreaterThan(10);
    expect(r.why.es.length).toBeGreaterThan(10);
  });
});

describe("pole-tag answer: not sure", () => {
  test("skipPoleTag routes an unknown light to the rule's default office", () => {
    const r = route("streetlight", checks({ streetlight: { owner: "unknown", distanceM: 7 } }), rules, offices, { skipPoleTag: true });
    expect(r).toMatchObject({ kind: "routed", office: "arlington-streetlights", decidedBy: "streetlight" });
  });
});
