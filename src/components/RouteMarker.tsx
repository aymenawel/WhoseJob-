import type { Level } from "@/lib/types";
import styles from "./RouteMarker.module.css";

/** One check the app ran, styled like a route marker; the deciding one is outlined. */
export function RouteMarker({ label, level, decided = false, decidedLabel = "", style }: {
  label: string;
  level: Level | "district" | "unknown";
  decided?: boolean;
  /** Screen-reader note for the deciding check, already translated. */
  decidedLabel?: string;
  style?: React.CSSProperties;
}) {
  return (
    <li className={`${styles.marker} ${styles[level]} ${decided ? styles.decided : ""}`} style={style}>
      {label}
      {decided && decidedLabel && <span className="sr-only"> ({decidedLabel})</span>}
    </li>
  );
}
