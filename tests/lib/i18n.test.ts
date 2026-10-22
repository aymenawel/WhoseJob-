import { describe, expect, test } from "vitest";
import en from "@/lib/i18n/en.json";
import es from "@/lib/i18n/es.json";
import { t } from "@/lib/i18n";

const keys = (o: Record<string, string>) => Object.keys(o).filter((k) => !k.startsWith("_")).sort();

describe("strings", () => {
  test("English and Spanish have exactly the same keys", () => {
    expect(keys(es)).toEqual(keys(en));
  });

  test("no Spanish string is empty", () => {
    const empty = keys(es).filter((k) => !(es as Record<string, string>)[k].trim());
    expect(empty).toEqual([]);
  });

  test("the answer screen title exists in both languages", () => {
    expect(t("en", "answer.title")).toBe("Here's who fixes it");
    expect(t("es", "answer.title")).toBe("Esto es quién lo arregla");
  });

  test("placeholders are filled", () => {
    expect(t("en", "answer.report", { office: "Dominion Energy" })).toBe("Report to Dominion Energy");
  });

  test("a missing key throws in tests instead of showing a raw key", () => {
    expect(() => t("en", "no.such.key")).toThrow(/no\.such\.key/);
  });
});
