import type { HTMLAttributes, ReactNode } from "react";
import styles from "./ProductCards.module.css";

type ReflectionCardVariant = "compact" | "expanded" | "result";

type ReflectionCardProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  kicker?: string;
  support?: ReactNode;
  variant?: ReflectionCardVariant;
};

export function ReflectionCard({
  children,
  kicker = "Aurora",
  support,
  variant = "compact",
  className,
  ...props
}: ReflectionCardProps) {
  return (
    <article className={[styles.reflectionCard, className].filter(Boolean).join(" ")} data-variant={variant} {...props}>
      <p className={styles.kicker}>{kicker}</p>
      <p className={styles.reflectionText}>{children}</p>
      {support ? <p className={styles.support}>{support}</p> : null}
    </article>
  );
}
