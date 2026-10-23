"use client";

import { useSyncExternalStore } from "react";
import { Icon } from "@/components/Icon";
import { useLocale } from "@/lib/i18n/locale";
import { readTheme, setTheme, subscribeTheme, type Theme } from "@/lib/theme";
import styles from "./LanguageToggle.module.css";

/** One tap flips light and dark; the icon shows the mode it switches to. */
export function ThemeToggle() {
  const { t } = useLocale();
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "dark" as Theme);
  const next: Theme = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      className={`${styles.toggle} ${styles.option}`}
      aria-label={t(next === "light" ? "theme.toLight" : "theme.toDark")}
      onClick={() => setTheme(next)}
    >
      <Icon name={next === "light" ? "sun" : "moon"} size={22} />
    </button>
  );
}
