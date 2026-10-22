"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { t as translate, type Locale } from "@/lib/i18n";

const KEY = "whosejob.locale";

type Ctx = { locale: Locale; setLocale: (l: Locale) => void; t: (key: string, vars?: Record<string, string>) => string };
const LocaleContext = createContext<Ctx | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  // Read the saved choice after mount so server and first client render match.
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(KEY);
    } catch {
      // Private mode or blocked storage: fall through to the browser language.
    }
    const initial: Locale = saved === "es" || saved === "en" ? saved : navigator.language.startsWith("es") ? "es" : "en";
    setLocaleState(initial);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      // The choice still applies for this visit.
    }
  }, []);

  const t = useCallback((key: string, vars?: Record<string, string>) => translate(locale, key, vars), [locale]);

  return <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Ctx {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside <LocaleProvider>");
  return ctx;
}
