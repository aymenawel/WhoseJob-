export type LocalityId = "arlington" | "alexandria" | "falls-church" | "fairfax";
export type Level = "local" | "state" | "utility" | "federal";
/** federal and other: an owner none of our offices answers for (see Agency). */
export type RoadOwner = "state" | "county" | "city" | "private" | "federal" | "other" | "unknown";
/** Who a federal or other road belongs to, when the map data says. */
export type Agency = "nps" | "pentagon" | "army" | "federal" | "airport" | "dc" | "town" | "park" | "institution" | "other";
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
/** no-road: the lookup worked but found no street near the pin. */
export type FallbackId = "census" | "road" | "no-road" | "streetlight";

export type Locality = { id: LocalityId; name: string };

export type Checks = {
  point: { lat: number; lon: number };
  /** id like "VA-08" */
  district: { id: string; inCoverage: boolean } | null;
  /** null outside our four VA-08 localities */
  locality: Locality | null;
  road: { name: string; owner: RoadOwner; agency?: Agency; distanceM: number } | null;
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
  | { kind: "ask-pole-tag" }
  /** the road belongs to someone none of our offices answers for: say who, never guess */
  | { kind: "not-ours"; owner: "federal" | "private" | "other"; agency?: Agency; road: string };
