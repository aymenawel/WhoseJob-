import type { MapReport } from "@/lib/map/cluster";

// The resident's own reports live only in this browser: there is no server
// database, so nothing about them leaves the device.
const KEY = "whosejob.reports";

export function loadMyReports(): MapReport[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function store(reports: MapReport[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(reports));
  } catch {
    // Storage blocked or full: the map just won't remember this one.
  }
}

export function saveMyReport(report: MapReport): void {
  store([...loadMyReports().filter((r) => r.id !== report.id), report]);
}

export function markFixed(id: string): void {
  store(loadMyReports().map((r) => (r.id === id ? { ...r, fixed: true } : r)));
}
