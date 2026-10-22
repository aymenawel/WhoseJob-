import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./PrimaryButton.module.css";

type Props = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  type?: "button" | "submit";
};

/** The one big action at the bottom of each step. */
export function PrimaryButton({ children, href, onClick, variant = "primary", disabled, type = "button" }: Props) {
  const cls = `${styles.button} ${styles[variant]}`;
  if (href) {
    const external = /^(https?:|mailto:|tel:)/.test(href);
    return external ? (
      <a className={cls} href={href} {...(href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}>
        {children}
      </a>
    ) : (
      <Link className={cls} href={href}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} type={type} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
