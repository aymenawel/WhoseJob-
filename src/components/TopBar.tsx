"use client";

import Link from "next/link";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLocale } from "@/lib/i18n/locale";
import styles from "./TopBar.module.css";

/** Wordmark, language toggle and the five-step progress bar, on a dark band. */
export function TopBar({ step, overlay = false }: { step?: 1 | 2 | 3 | 4 | 5; overlay?: boolean }) {
  const { t } = useLocale();
  return (
    <header className={`${styles.bar} ${overlay ? `${styles.overlay} on-dark` : ""}`}>
      <div className={styles.row}>
        <Link href="/" className={styles.mark}>
          {t("app.name")}
        </Link>
        <div className={styles.controls}>
          <ThemeToggle />
          <LanguageToggle />
        </div>
      </div>
      {step && (
        <div className={styles.progress}>
          <p className="sr-only">{t("progress.label", { n: String(step) })}</p>
          <div className={styles.segments} aria-hidden="true">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className={n <= step ? styles.on : undefined} />
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
