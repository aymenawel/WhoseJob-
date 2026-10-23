"use client";

import { useLocale } from "@/lib/i18n/locale";
import { setBasemap, useBasemap, type Basemap } from "@/lib/map/basemap";
import styles from "./MapStyleToggle.module.css";

/** Map / Satellite, floating in a corner of the map. */
export function MapStyleToggle({ placement = "top-right" }: { placement?: "top-right" | "bottom-left" }) {
  const { t } = useLocale();
  const current = useBasemap();
  return (
    <div className={`${styles.toggle} ${placement === "bottom-left" ? styles.bottomLeft : ""}`} role="group" aria-label={t("map.style")}>
      {(["map", "satellite"] as Basemap[]).map((b) => (
        <button key={b} type="button" className={styles.option} aria-pressed={current === b} onClick={() => setBasemap(b)}>
          {t(b === "map" ? "map.styleMap" : "map.styleSatellite")}
        </button>
      ))}
    </div>
  );
}
