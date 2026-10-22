import { afterEach, expect, test } from "vitest";
import { loadMyReports, markFixed, saveMyReport } from "@/lib/map/myReports";
import type { MapReport } from "@/lib/map/cluster";

afterEach(() => localStorage.clear());

const mine: MapReport = {
  id: "r1",
  issue: "streetlight",
  lat: 38.891447,
  lon: -77.085525,
  office: "dominion",
  level: "utility",
  createdAt: "2026-10-22T01:00:00Z",
  sample: false,
  fixed: false,
};

test("a saved report comes back, on this device only", () => {
  saveMyReport(mine);
  expect(loadMyReports()).toEqual([mine]);
});

test("corrupted storage gives an empty list, not a crash", () => {
  localStorage.setItem("whosejob.reports", "{not json");
  expect(loadMyReports()).toEqual([]);
});

test("marking a report fixed is remembered", () => {
  saveMyReport(mine);
  markFixed("r1");
  expect(loadMyReports()[0].fixed).toBe(true);
});
