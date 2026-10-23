"use client";

import { useMemo, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { CommunityMap } from "@/components/CommunityMap";
import { MapStyleToggle } from "@/components/MapStyleToggle";
import { LevelMarker } from "@/components/LevelMarker";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useLocale } from "@/lib/i18n/locale";
import { clusterReports, reportCounts, type Cluster, type MapReport } from "@/lib/map/cluster";
import { loadMyReports, markFixed } from "@/lib/map/myReports";
import { offices } from "@/lib/routing/data";
import sample from "@/data/sample-reports.json";
import s from "./map.module.css";

export default function MapPage() {
  const { t, locale } = useLocale();
  // Own reports only affect the map layer drawn after mount, never the server HTML.
  const [mine, setMine] = useState<MapReport[]>(() => (typeof window === "undefined" ? [] : loadMyReports()));
  const [selected, setSelected] = useState<Cluster | null>(null);

  const clusters = useMemo(() => clusterReports([...(sample.reports as MapReport[]), ...mine]), [mine]);

  const fresh = selected && clusters.find((c) => c.reports.some((r) => r.id === selected.reports[0].id));
  const own = fresh?.reports.filter((r) => !r.sample) ?? [];

  // "Your report · 3 sample reports": samples are labeled, never passed off as neighbors.
  function countOf(c: Cluster): string {
    const { mine: m, samples } = reportCounts(c.reports);
    const parts = [];
    if (m) parts.push(m === 1 ? t("map.countMineOne") : t("map.countMine", { n: String(m) }));
    if (samples) parts.push(samples === 1 ? t("map.countSampleOne") : t("map.countSample", { n: String(samples) }));
    return parts.join(" · ");
  }

  return (
    <div className={s.screen}>
      <TopBar />
      <h1 className="sr-only">{t("map.title")}</h1>
      <div className={s.mapArea}>
        <CommunityMap
          clusters={clusters}
          label={t("map.mapLabel")}
          nameOf={(c) =>
            t("map.markerName", {
              issue: t(`issue.${c.issue}`),
              count: countOf(c),
            })
          }
          onSelect={setSelected}
        />
        <MapStyleToggle placement="bottom-left" />
        <p className={s.banner} role="note">
          {t("map.sampleBanner")}
        </p>
      </div>

      {fresh ? (
        <section className={s.card} aria-live="polite">
          <div className={s.cardHead}>
            <h2 className={s.cardTitle}>{t(`issue.${fresh.issue}`)}</h2>
            <button type="button" className={s.close} onClick={() => setSelected(null)}>
              {t("map.close")}
            </button>
          </div>
          <LevelMarker level={fresh.level} label={t("map.sentTo", { office: offices[fresh.office].name[locale] })} />
          <p className={s.count}>{countOf(fresh)}</p>
          <p className={s.chips}>
            {fresh.reports.some((r) => r.sample) && <span className={s.sampleChip}>{t("map.sampleChip")}</span>}
            {own.length > 0 && <span className={s.chip}>{t("map.yours")}</span>}
            {fresh.reports.every((r) => r.fixed) && <span className={s.chip}>{t("map.fixed")}</span>}
          </p>
          {own.some((r) => !r.fixed) && (
            <PrimaryButton
              variant="secondary"
              onClick={() => {
                own.forEach((r) => markFixed(r.id));
                setMine(loadMyReports());
              }}
            >
              {t("map.markFixed")}
            </PrimaryButton>
          )}
        </section>
      ) : (
        <div className={s.legend}>
          <LevelMarker level="local" label={t("level.local")} />
          <LevelMarker level="state" label={t("level.state")} />
          <LevelMarker level="utility" label={t("level.utility")} />
        </div>
      )}
    </div>
  );
}
