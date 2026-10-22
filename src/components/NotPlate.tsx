import styles from "./NotPlate.module.css";

/** The office a resident would guess, struck through on a white regulatory plate. */
export function NotPlate({ office, note }: { office: string; note: string }) {
  return (
    <p className={styles.plate}>
      <s className={styles.office}>{office}</s> <span className={styles.note}>{note}</span>
    </p>
  );
}
