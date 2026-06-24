import type { HTMLAttributes, ReactNode } from "react";
import styles from "./Surface.module.css";

type CardSurfaceVariant = "default" | "raised";

type CardSurfaceProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  variant?: CardSurfaceVariant;
  compact?: boolean;
  interactive?: boolean;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function CardSurface({
  children,
  variant = "default",
  compact = false,
  interactive = false,
  className,
  ...props
}: CardSurfaceProps) {
  return (
    <div
      className={cx(
        styles.surface,
        variant === "raised" && styles.raised,
        compact && styles.compact,
        interactive && styles.interactive,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
