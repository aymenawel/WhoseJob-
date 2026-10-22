"use client";

import { useLocale } from "@/lib/i18n/locale";
import styles from "./LanguageToggle.module.css";

export function LanguageToggle() {
  const { locale, setLocale, t } = useLocale();
  return (
    <div className={styles.toggle} role="group" aria-label={t("lang.label")}>
      {(["en", "es"] as const).map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={locale === l}
          className={styles.option}
          onClick={() => setLocale(l)}
        >
          <span aria-hidden="true">{l.toUpperCase()}</span>
          <span className="sr-only">{l === "en" ? "English" : "Español"}</span>
        </button>
      ))}
    </div>
  );
}
