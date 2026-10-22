import { describe, expect, test } from "vitest";
import { clusterReports, type MapReport } from "@/lib/map/cluster";

const report = (id: string, lat: number, lon: number, createdAt = "2026-10-20T12:00:00Z"): MapReport => ({
  id,
  issue: "streetlight",
  lat,
  lon,
  office: "dominion",
  level: "utility",
  createdAt,
  sample: true,
  fixed: false,
});

describe("clusterReports", () => {
  test("four reports on one block become one group of 4", () => {
    // Each ~25 m apart along the street.
    const clusters = clusterReports([
      report("a", 38.8914, -77.0855),
      report("b", 38.8914, -77.0852),
      report("c", 38.8914, -77.0849),
      report("d", 38.8914, -77.0846),
    ]);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].reports).toHaveLength(4);
  });

  test("two reports 500 m apart stay separate", () => {
    expect(clusterReports([report("a", 38.8914, -77.0855), report("b", 38.8959, -77.0855)])).toHaveLength(2);
  });

  test("different problems at the same spot are not merged", () => {
    const pothole = { ...report("p", 38.8914, -77.0855), issue: "pothole" as const };
    expect(clusterReports([report("a", 38.8914, -77.0855), pothole])).toHaveLength(2);
  });

  test("the same problem 60 m apart but owned by different offices stays separate", () => {
    const county = { ...report("c", 38.891372, -77.084805), office: "arlington-streetlights", level: "local" as const };
    expect(clusterReports([report("d", 38.891447, -77.085525), county])).toHaveLength(2);
  });

  test("an empty list gives no groups", () => {
    expect(clusterReports([])).toEqual([]);
  });
});
