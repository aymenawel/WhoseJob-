import { Icon, type IconName } from "@/components/Icon";
import styles from "./ActionRail.module.css";

export type RailAction = { id: string; label: string; icon: IconName; href?: string; onClick?: () => void };

/** Labeled actions down the right edge of the photo, like a full-screen story. */
export function ActionRail({ actions, label }: { actions: RailAction[]; label: string }) {
  return (
    <nav className={styles.rail} aria-label={label}>
      {actions.map((a) => {
        const inner = (
          <>
            <span className={styles.icon}>
              <Icon name={a.icon} />
            </span>
            <span className={styles.label}>{a.label}</span>
          </>
        );
        return a.href ? (
          <a key={a.id} className={styles.action} href={a.href}>
            {inner}
          </a>
        ) : (
          <button key={a.id} type="button" className={styles.action} onClick={a.onClick}>
            {inner}
          </button>
        );
      })}
    </nav>
  );
}
