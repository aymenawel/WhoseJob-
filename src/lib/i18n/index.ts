import en from "@/lib/i18n/en.json";
import es from "@/lib/i18n/es.json";

export type Locale = "en" | "es";

const STRINGS: Record<Locale, Record<string, string>> = { en, es };

/**
 * Looks up a UI string and fills {placeholders}. A key missing in Spanish
 * falls back to English rather than showing a raw key; tests forbid that gap.
 */
export function t(locale: Locale, key: string, vars: Record<string, string> = {}): string {
  const text = STRINGS[locale][key] ?? STRINGS.en[key];
  if (text === undefined) {
    if (process.env.NODE_ENV === "test") throw new Error(`missing i18n key "${key}"`);
    return key;
  }
  return text.replace(/\{(\w[\w-]*)\}/g, (m, name: string) => vars[name] ?? m);
}
