"use client";

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { t as translate, type Locale } from "@/lib/i18n";

const KEY = "whosejob.locale";
const EVENT = "whosejob:locale";

// The saved choice lives in browser storage; reading it through
// useSyncExternalStore keeps the server render (English) and the first
// client render consistent, then switches without an extra effect.
function readLocale(): Locale {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "en" || saved === "es") return saved;
  } catch {
    // Private mode or blocked storage: fall through to the browser language.
  }
  return navigator.language.startsWith("es") ? "es" : "en";
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

type Ctx = { locale: Locale; setLocale: (l: Locale) => void; t: (key: string, vars?: Record<string, string>) => string };
const LocaleContext = createContext<Ctx | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, readLocale, () => "en" as Locale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    try {
      localStorage.setItem(KEY, l);
    } catch {
      // Storage blocked: the event below still can't persist, so nothing changes.
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const t = useCallback((key: string, vars?: Record<string, string>) => translate(locale, key, vars), [locale]);

  return <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Ctx {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside <LocaleProvider>");
  return ctx;
}
