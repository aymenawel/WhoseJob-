"use client";

import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { Icon } from "@/components/Icon";
import { useLocale } from "@/lib/i18n/locale";
import s from "./home.module.css";

export default function Home() {
  const { t } = useLocale();
  return (
    <div className={s.screen}>
      <TopBar />
      <main className={s.main}>
        <h1 className={s.title}>{t("home.title")}</h1>
        <p className={s.lede}>{t("home.lede")}</p>

        {/* The way in is itself a guide sign: the app's one visual idea, from the first screen. */}
        <Link href="/report/photo" className={s.sign}>
          <span className={s.inset}>
            <span className={s.signText}>{t("home.start")}</span>
            <Icon name="arrow" size={44} className={s.arrow} />
          </span>
        </Link>

        <Link href="/report/federal" className={s.secondary}>
          <Icon name="federal" size={28} />
          <span>
            <span className={s.secondaryTitle}>{t("home.federal")}</span>
            <span className={s.secondaryHint}>{t("home.federalHint")}</span>
          </span>
        </Link>

        <p className={s.coverage}>{t("home.coverage")}</p>
        <p className={s.note}>{t("home.sendNote")}</p>
      </main>
    </div>
  );
}
