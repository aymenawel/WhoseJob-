import { Icon, type IconName } from "@/components/Icon";
import styles from "./IssueTile.module.css";

export function IssueTile({ icon, label, onClick, wide = false, selected = false }: {
  icon: IconName;
  label: string;
  onClick: () => void;
  wide?: boolean;
  selected?: boolean;
}) {
  return (
    <button type="button" className={`${styles.tile} ${wide ? styles.wide : ""}`} onClick={onClick} aria-pressed={selected}>
      <Icon name={icon} size={30} />
      <span className={styles.label}>{label}</span>
    </button>
  );
}
