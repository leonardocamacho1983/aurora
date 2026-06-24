import type { HTMLAttributes, ReactNode } from "react";
import styles from "./StateComponents.module.css";

type StreamingTextProps = HTMLAttributes<HTMLParagraphElement> & {
  children: ReactNode;
  streaming?: boolean;
};

export function StreamingText({ children, streaming = true, className, ...props }: StreamingTextProps) {
  return (
    <p className={[styles.streamingText, className].filter(Boolean).join(" ")} aria-live={streaming ? "polite" : undefined} {...props}>
      {children}
      {streaming ? <span className={styles.cursor} aria-hidden="true" /> : null}
    </p>
  );
}
