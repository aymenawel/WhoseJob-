import { distance } from "@turf/distance";
import type { IssueId, Level } from "@/lib/types";

export type MapReport = {
  id: string;
  issue: IssueId;
  lat: number;
  lon: number;
  office: string;
  level: Level;
  createdAt: string;
  /** Sample reports are always labeled as sample data on screen. */
  sample: boolean;
  fixed: boolean;
};

export type Cluster = { lat: number; lon: number; issue: IssueId; office: string; level: Level; reports: MapReport[] };

/**
 * Groups reports of the same problem, sent to the same office, within
 * `radiusM` of a group's center: four neighbors reporting one dark block read
 * as one place. Two lights owned by different offices never merge.
 */
export function clusterReports(reports: MapReport[], radiusM = 150): Cluster[] {
  const clusters: Cluster[] = [];
  const ordered = [...reports].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  for (const r of ordered) {
    const home = clusters.find(
      (c) => c.issue === r.issue && c.office === r.office && distance([c.lon, c.lat], [r.lon, r.lat], { units: "meters" }) <= radiusM,
    );
    if (home) {
      home.reports.push(r);
      home.lat = home.reports.reduce((s, x) => s + x.lat, 0) / home.reports.length;
      home.lon = home.reports.reduce((s, x) => s + x.lon, 0) / home.reports.length;
    } else {
      clusters.push({ lat: r.lat, lon: r.lon, issue: r.issue, office: r.office, level: r.level, reports: [r] });
    }
  }
  return clusters;
}

/**
 * Real reports here are only the resident's own (nothing leaves the device),
 * so a cluster is counted as theirs plus samples, never as "neighbors".
 */
export function reportCounts(reports: MapReport[]): { mine: number; samples: number } {
  const samples = reports.filter((r) => r.sample).length;
  return { mine: reports.length - samples, samples };
}
