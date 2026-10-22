import type { Checks, IssueId, Route } from "@/lib/types";
import type { Office, OwnerValue, Rule, RulesFile } from "@/lib/routing/schema";

type Options = {
  /** The resident answered "not sure" to the pole-tag question: use the rule's default. */
  skipPoleTag?: boolean;
};

function decide(rule: Rule, value: OwnerValue | undefined, offices: Record<string, Office>): Route {
  const office = (value && rule.byValue[value]) || rule.default;
  const key = value && rule.byValue[value] ? value : "default";
  return {
    kind: "routed",
    office,
    level: offices[office].level,
    decidedBy: rule.decidedBy,
    notOffice: rule.notOffice?.[key],
    // validateRules guarantees why.default exists.
    why: rule.why[key] ?? rule.why.default!,
    verified: rule.verified,
  };
}

export function route(issue: IssueId, checks: Checks, rules: RulesFile, offices: Record<string, Office>, opts: Options = {}): Route {
  // Never route a spot outside the district we have rules for.
  if (checks.district?.inCoverage === false || !checks.locality) {
    return { kind: "out-of-coverage", districtId: checks.district?.id || null };
  }
  if (issue === "federal") return decide(rules.federal, undefined, offices);

  const rule = rules.localities[checks.locality.id][issue];
  switch (rule.decidedBy) {
    case "road":
      return decide(rule, checks.road?.owner, offices);
    case "streetlight": {
      const owner = checks.streetlight?.owner;
      if ((!owner || owner === "unknown") && !opts.skipPoleTag) return { kind: "ask-pole-tag" };
      return decide(rule, owner, offices);
    }
    default:
      return decide(rule, undefined, offices);
  }
}
