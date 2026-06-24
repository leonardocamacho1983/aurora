import type { HTMLAttributes, ReactNode } from "react";
import styles from "./Chip.module.css";

type ChipTone = "mood" | "status" | "privacy" | "date";

type ChipProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  tone?: ChipTone;
  withDot?: boolean;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Chip({ children, tone = "status", withDot = false, className, ...props }: ChipProps) {
  return (
    <span className={cx(styles.chip, styles[tone], className)} {...props}>
      {withDot ? <span className={styles.dot} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
