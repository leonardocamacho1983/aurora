import type { HTMLAttributes, ReactNode } from "react";
import styles from "./StateComponents.module.css";

type EmptyStateProps = HTMLAttributes<HTMLElement> & {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  showOrb?: boolean;
};

export function EmptyState({ title, children, action, showOrb = true, className, ...props }: EmptyStateProps) {
  return (
    <section className={[styles.emptyState, className].filter(Boolean).join(" ")} {...props}>
      {showOrb ? <span className={styles.emptyIcon} aria-hidden="true" /> : null}
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </section>
  );
}
