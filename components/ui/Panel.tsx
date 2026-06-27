import type { HTMLAttributes, ReactNode } from "react";
import styles from "./Surface.module.css";

type PanelVariant = "default" | "raised";

type PanelProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  variant?: PanelVariant;
  compact?: boolean;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Panel({ children, variant = "default", compact = false, className, ...props }: PanelProps) {
  return (
    <section
      className={cx(styles.panel, variant === "raised" && styles.raised, compact && styles.compact, className)}
      {...props}
    >
      {children}
    </section>
  );
}
