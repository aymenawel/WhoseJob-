import { Icon } from "@/components/Icon";
import styles from "./PrimaryButton.module.css";

/**
 * The main "copy and open the form" action. It is a real link, not
 * window.open(): browsers and in-app browsers can silently block a
 * script-opened window as a pop-up, but they always follow a tapped link.
 */
export function OpenFormLink({ href, label, onOpen }: { href: string; label: string; onOpen: () => void }) {
  return (
    <a className={`${styles.button} ${styles.primary}`} href={href} target="_blank" rel="noopener noreferrer" onClick={onOpen}>
      <Icon name="form" />
      {label}
    </a>
  );
}
