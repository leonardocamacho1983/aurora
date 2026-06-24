import type { HTMLAttributes, ReactNode } from "react";
import styles from "./ProductCards.module.css";

type ThreadCardVariant = "latest" | "pattern" | "question";

type ThreadCardProps = HTMLAttributes<HTMLElement> & {
  title: string;
  children: ReactNode;
  meta?: string;
  variant?: ThreadCardVariant;
};

export function ThreadCard({ title, children, meta, variant = "pattern", className, ...props }: ThreadCardProps) {
  return (
    <article className={[styles.threadCard, className].filter(Boolean).join(" ")} data-variant={variant} {...props}>
      {meta ? <p className={styles.threadType}>{meta}</p> : null}
      <h3>{title}</h3>
      <p>{children}</p>
    </article>
  );
}
