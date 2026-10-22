export type LocalityId = "arlington" | "alexandria" | "falls-church" | "fairfax";
export type Level = "local" | "state" | "utility" | "federal";
export type RoadOwner = "state" | "county" | "city" | "private" | "unknown";
export type LightOwner = "dominion" | "novec" | "county" | "city" | "private" | "unknown";
export type IssueId =
  | "pothole"
  | "streetlight"
  | "signal"
  | "sign-traffic"
  | "sign-street-name"
  | "flooding"
  | "trash"
  | "abandoned-car"
  | "federal";
export type FallbackId = "census" | "road" | "streetlight";

export type Locality = { id: LocalityId; name: string };

export type Checks = {
  point: { lat: number; lon: number };
  /** id like "VA-08" */
  district: { id: string; inCoverage: boolean } | null;
  /** null outside our four VA-08 localities */
  locality: Locality | null;
  road: { name: string; owner: RoadOwner; distanceM: number } | null;
  streetlight: { owner: LightOwner; poleId?: string; formUrl?: string; distanceM: number } | null;
  /** checks that fell back to bundled data or a default; shown to the resident */
  fallbacks: FallbackId[];
};

export type Localized = { en: string; es: string };

export type Route =
  | {
      kind: "routed";
      office: string;
      level: Level;
      decidedBy: "road" | "streetlight" | "locality" | "federal";
      notOffice?: string;
      why: Localized;
      verified: string | null;
    }
  | { kind: "out-of-coverage"; districtId: string | null }
  /** streetlight owner unknown: ask the resident to read the pole tag */
  | { kind: "ask-pole-tag" };
