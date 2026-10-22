import type { Level } from "@/lib/types";
import { LevelMarker } from "@/components/LevelMarker";
import { Icon } from "@/components/Icon";
import styles from "./Sign.module.css";

/** The answer, drawn as a green highway guide sign pointing at the office. */
export function Sign({ level, kicker, office, detail }: {
  level: Level;
  /** "Fixed by a utility company": names the level in words next to its shape. */
  kicker: string;
  office: string;
  detail?: string | null;
}) {
  return (
    <section className={styles.sign} aria-label={`${kicker}: ${office}`}>
      <div className={styles.inset}>
        <p className={styles.kicker}>
          <LevelMarker level={level} label={kicker} size="sm" />
        </p>
        <div className={styles.row}>
          <h2 className={styles.office}>{office}</h2>
          <Icon name="arrow" size={44} className={styles.arrow} />
        </div>
        {detail && <p className={styles.detail}>{detail}</p>}
      </div>
    </section>
  );
}
