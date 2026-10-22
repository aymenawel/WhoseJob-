import rulesJson from "@/data/routing-rules.json";
import officesJson from "@/data/offices.json";
import { validateRules } from "@/lib/routing/schema";

// Validated once at load, so a typo in the team's JSON fails loudly in
// tests and the build instead of quietly misrouting a resident.
export const { rules, offices } = validateRules(rulesJson, officesJson);
