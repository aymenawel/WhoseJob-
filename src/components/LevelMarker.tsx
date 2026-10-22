import type { Level } from "@/lib/types";
import styles from "./LevelMarker.module.css";

// Shapes borrowed from road signage, so a level reads in grayscale:
// local = blue square, state = white plate, utility = yellow diamond, federal = shield.
const SHAPE: Record<Level, string> = {
  local: "square",
  state: "plate",
  utility: "diamond",
  federal: "shield",
};

export function LevelMarker({ level, label, size = "md" }: { level: Level; label: string; size?: "sm" | "md" }) {
  return (
    <span className={`${styles.marker} ${styles[size]}`}>
      <span className={`${styles.shape} ${styles[SHAPE[level]]}`} data-shape={SHAPE[level]} aria-hidden="true">
        {level === "federal" && (
          <svg viewBox="0 0 20 22" width="100%" height="100%">
            <path d="M10 1 2 4v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V4z" fill="#fff" stroke="#101314" strokeWidth="2" />
            <path d="M10 5 5 7v3.5c0 3 2 5.5 5 6.8 3-1.3 5-3.8 5-6.8V7z" fill="#101314" />
          </svg>
        )}
      </span>
      <span className={styles.label}>{label}</span>
    </span>
  );
}
