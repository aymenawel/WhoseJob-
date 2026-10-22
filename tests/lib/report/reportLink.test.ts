import { describe, expect, test } from "vitest";
import { reportLink } from "@/lib/report/reportLink";
import { offices } from "@/lib/routing/data";
import type { Checks } from "@/lib/types";

const checks = (over: Partial<Checks> = {}): Checks => ({
  point: { lat: 38.891372, lon: -77.084805 },
  district: { id: "VA-08", inCoverage: true },
  locality: { id: "arlington", name: "Arlington County" },
  road: { name: "N Uhle ST (PR - Arlington County)", owner: "county", distanceM: 3 },
  streetlight: { owner: "county", poleId: "190MA01SE", distanceM: 0 },
  fallbacks: [],
  ...over,
});

describe("reportLink", () => {
  test("Arlington pothole opens the pothole form with the typed address filled in", () => {
    const link = reportLink(offices["arlington-311"], "pothole", checks(), "2100 Clarendon Blvd, Arlington, VA 22201");
    expect(link?.url).toBe(
      "https://arlingtonva.qscend.com/311/request/add?typeId=395&location=2100%20Clarendon%20Blvd%2C%20Arlington%2C%20VA%2022201",
    );
    expect(link?.specific).toBe(true);
    expect(link?.steps?.en).toMatch(/Comments/);
  });

  test("without a typed address it fills the nearest road and locality instead", () => {
    const link = reportLink(offices["arlington-311"], "pothole", checks(), null);
    expect(link?.url).toContain("location=N%20Uhle%20St%2C%20Arlington%20County");
  });

  test("with no address and no road, the location parameter is left out rather than sent empty", () => {
    const link = reportLink(offices["arlington-311"], "pothole", checks({ road: null }), null);
    expect(link?.url).toBe("https://arlingtonva.qscend.com/311/request/add?typeId=395");
  });

  test("Fairfax's own streetlight link, pre-filled with the pole, wins over the office's form", () => {
    const formUrl = "https://www.fairfaxcounty.gov/gisapps/StreetlightReporter/ReportProblem.aspx?provider=Dominion&poleId=C0911LB4100";
    const link = reportLink(offices.dominion, "streetlight", checks({ streetlight: { owner: "dominion", poleId: "C0911LB4100", formUrl, distanceM: 0 } }), null);
    expect(link).toMatchObject({ url: formUrl, specific: true });
  });

  test("Dominion streetlights open Dominion's streetlight-outage page, not its general outage page", () => {
    const link = reportLink(offices.dominion, "streetlight", checks({ streetlight: { owner: "dominion", poleId: "C0918WL6800", distanceM: 0 } }), null);
    expect(link?.url).toBe("https://www.dominionenergy.com/virginia/report-outage-or-emergency/streetlight-and-watchlight-outages");
  });

  test("an office with no form for this problem falls back to its general page, marked not specific", () => {
    const link = reportLink(offices.novec, "streetlight", checks(), null);
    expect(link).toEqual({ url: null, specific: false, steps: null });
  });

  test("every office form is https and has steps in both languages", () => {
    for (const [id, office] of Object.entries(offices)) {
      for (const [issue, form] of Object.entries(office.forms ?? {})) {
        expect(form!.url, `${id}.${issue}`).toMatch(/^https:\/\//);
        expect(form!.steps.en.trim(), `${id}.${issue} en`).not.toBe("");
        expect(form!.steps.es.trim(), `${id}.${issue} es`).not.toBe("");
      }
    }
  });
});
