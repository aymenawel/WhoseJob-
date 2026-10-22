import { describe, expect, test } from "vitest";
import { validateRules } from "@/lib/routing/schema";
import rulesJson from "@/data/routing-rules.json";
import officesJson from "@/data/offices.json";

type Editable = {
  localities: Record<string, Record<string, { byValue: Record<string, string>; why: Record<string, Record<string, string>> }>>;
};
const clone = (x: unknown): Editable => JSON.parse(JSON.stringify(x));

describe("validateRules", () => {
  test("the real rules and offices files are valid", () => {
    expect(() => validateRules(rulesJson, officesJson)).not.toThrow();
  });

  test("every locality has a rule for every local issue", () => {
    const { rules } = validateRules(rulesJson, officesJson);
    for (const locality of ["arlington", "alexandria", "falls-church", "fairfax"] as const) {
      for (const issue of ["pothole", "streetlight", "signal", "sign-traffic", "sign-street-name", "flooding", "trash", "abandoned-car"] as const) {
        expect(rules.localities[locality][issue], `${locality}.${issue}`).toBeDefined();
      }
    }
  });

  test("an empty Spanish reason is rejected, naming where it is", () => {
    const bad = clone(rulesJson);
    bad.localities.arlington.pothole.why.county.es = "";
    expect(() => validateRules(bad, officesJson)).toThrow(/localities\.arlington\.pothole\.why\.county\.es/);
  });

  test("a rule pointing at an office that doesn't exist is rejected", () => {
    const bad = clone(rulesJson);
    bad.localities.arlington.pothole.byValue.county = "no-such-office";
    expect(() => validateRules(bad, officesJson)).toThrow(/no-such-office/);
  });

  test("a value with an office but no reason is rejected", () => {
    const bad = clone(rulesJson);
    delete bad.localities.fairfax.pothole.why.state;
    expect(() => validateRules(bad, officesJson)).toThrow(/localities\.fairfax\.pothole\.why\.state/);
  });
});
