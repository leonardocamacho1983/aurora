import type { ButtonHTMLAttributes } from "react";
import { Button } from "@/components/ui";
import styles from "./ProductCards.module.css";

type ContinueThreadState = "idle" | "loading" | "disabled" | "error";

type ContinueThreadButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  state?: ContinueThreadState;
  label?: string;
};

export function ContinueThreadButton({
  state = "idle",
  label,
  className,
  disabled,
  ...props
}: ContinueThreadButtonProps) {
  const copy = label ?? (state === "error" ? "Tentar continuar" : "Continuar o fio");

  return (
    <Button
      className={[styles.continueButton, className].filter(Boolean).join(" ")}
      data-state={state}
      disabled={disabled || state === "disabled"}
      loading={state === "loading"}
      variant={state === "error" ? "danger" : "primary"}
      {...props}
    >
      <span className={styles.continueMeta}>{copy}</span>
    </Button>
  );
}
