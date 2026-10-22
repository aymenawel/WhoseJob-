import type { IssueId, Level, LightOwner, LocalityId, Localized, RoadOwner } from "@/lib/types";

export type OwnerValue = RoadOwner | LightOwner;
export type LocalIssueId = Exclude<IssueId, "federal">;

export type Office = {
  name: Localized;
  detail: Localized | null;
  level: Level;
  phone: string | null;
  formUrl: string | null;
  email: string | null;
  hours: Localized | null;
  source: string;
  verified: string | null;
};

export type Rule = {
  decidedBy: "road" | "streetlight" | "locality" | "federal";
  byValue: Partial<Record<OwnerValue, string>>;
  default: string;
  /** The office a resident would wrongly assume, shown struck through. */
  notOffice?: Partial<Record<OwnerValue | "default", string>>;
  why: Partial<Record<OwnerValue | "default", Localized>>;
  source: string;
  verified: string | null;
};

export type RulesFile = {
  localities: Record<LocalityId, Record<LocalIssueId, Rule>>;
  federal: Rule;
};

const LOCALITIES: LocalityId[] = ["arlington", "alexandria", "falls-church", "fairfax"];
export const LOCAL_ISSUES: LocalIssueId[] = [
  "pothole", "streetlight", "signal", "sign-traffic", "sign-street-name", "flooding", "trash", "abandoned-car",
];
const LEVELS: Level[] = ["local", "state", "utility", "federal"];

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

function fail(path: string, problem: string): never {
  throw new Error(`${path}: ${problem}`);
}

function checkLocalized(v: unknown, path: string) {
  if (!isObj(v)) fail(path, "expected { en, es }");
  for (const lang of ["en", "es"] as const) {
    if (typeof v[lang] !== "string" || !(v[lang] as string).trim()) fail(`${path}.${lang}`, "missing or empty text");
  }
}

function checkRule(rule: unknown, path: string, offices: Record<string, Office>) {
  if (!isObj(rule)) fail(path, "expected a rule object");
  const office = (id: unknown, p: string) => {
    if (typeof id !== "string" || !offices[id]) fail(p, `unknown office "${String(id)}" (add it to offices.json)`);
  };
  if (!["road", "streetlight", "locality", "federal"].includes(rule.decidedBy as string)) fail(`${path}.decidedBy`, "must be road, streetlight, locality or federal");
  if (!isObj(rule.byValue)) fail(`${path}.byValue`, "expected an object");
  office(rule.default, `${path}.default`);
  if (!isObj(rule.why)) fail(`${path}.why`, "expected an object");
  // Every value that picks an office needs its own reason, plus the default.
  for (const [value, id] of Object.entries(rule.byValue)) {
    office(id, `${path}.byValue.${value}`);
    checkLocalized(rule.why[value], `${path}.why.${value}`);
  }
  checkLocalized(rule.why.default, `${path}.why.default`);
  if (rule.notOffice !== undefined) {
    if (!isObj(rule.notOffice)) fail(`${path}.notOffice`, "expected an object");
    for (const [value, id] of Object.entries(rule.notOffice)) office(id, `${path}.notOffice.${value}`);
  }
  if (typeof rule.source !== "string" || !rule.source.startsWith("http")) fail(`${path}.source`, "needs the official page it came from");
  if (rule.verified !== null && typeof rule.verified !== "string") fail(`${path}.verified`, "a date like 2026-10-22, or null");
}

/** Checks the team-edited files and names the first problem by its JSON path. */
export function validateRules(rulesJson: unknown, officesJson: unknown): { rules: RulesFile; offices: Record<string, Office> } {
  if (!isObj(officesJson)) fail("offices", "expected an object");
  for (const [id, o] of Object.entries(officesJson)) {
    if (!isObj(o)) fail(`offices.${id}`, "expected an office object");
    checkLocalized(o.name, `offices.${id}.name`);
    if (!LEVELS.includes(o.level as Level)) fail(`offices.${id}.level`, "must be local, state, utility or federal");
  }
  const offices = officesJson as Record<string, Office>;

  if (!isObj(rulesJson) || !isObj(rulesJson.localities)) fail("localities", "expected an object");
  for (const loc of LOCALITIES) {
    const issues = rulesJson.localities[loc];
    if (!isObj(issues)) fail(`localities.${loc}`, "missing locality");
    for (const issue of LOCAL_ISSUES) checkRule(issues[issue], `localities.${loc}.${issue}`, offices);
  }
  checkRule(rulesJson.federal, "federal", offices);
  return { rules: rulesJson as unknown as RulesFile, offices };
}
