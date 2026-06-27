import type { HTMLAttributes, ReactNode } from "react";
import styles from "./StateComponents.module.css";

type PrivacyChipProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
};

export function PrivacyChip({ children, className, ...props }: PrivacyChipProps) {
  return (
    <span className={[styles.privacyChip, className].filter(Boolean).join(" ")} {...props}>
      {children}
    </span>
  );
}
