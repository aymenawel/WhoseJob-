import exifr from "exifr";
import type { Checks, IssueId } from "@/lib/types";

export type Point = { lat: number; lon: number };

export type FlowState = {
  /** Object URL of the resident's photo; it never leaves the device. */
  photoUrl: string | null;
  point: Point | null;
  address: string | null;
  issue: IssueId | null;
  checks: Checks | null;
};

export const initialFlow: FlowState = { photoUrl: null, point: null, address: null, issue: null, checks: null };

/** Merges a patch; checks belong to one exact spot, so moving the pin drops them. */
export function flowReducer(state: FlowState, patch: Partial<FlowState>): FlowState {
  const next = { ...state, ...patch };
  const moved = patch.point !== undefined && (patch.point?.lat !== state.point?.lat || patch.point?.lon !== state.point?.lon);
  if (moved && patch.checks === undefined) next.checks = null;
  return next;
}

export async function readPhotoGps(file: File): Promise<Point | null> {
  try {
    const gps = await exifr.gps(file);
    if (!gps || !Number.isFinite(gps.latitude) || !Number.isFinite(gps.longitude)) return null;
    return { lat: gps.latitude, lon: gps.longitude };
  } catch {
    // Many phones strip location on upload, and HEIC may not parse: the map step covers it.
    return null;
  }
}
