"use client";

import { useState } from "react";
import styles from "./StateComponents.module.css";

type FeedbackValue = "positive" | "negative";

type FeedbackMicroProps = {
  positiveLabel?: string;
  negativeLabel?: string;
  onChange?: (value: FeedbackValue) => void;
};

export function FeedbackMicro({
  positiveLabel = "Fez sentido",
  negativeLabel = "Não tanto",
  onChange,
}: FeedbackMicroProps) {
  const [selected, setSelected] = useState<FeedbackValue | null>(null);

  function choose(value: FeedbackValue) {
    setSelected(value);
    onChange?.(value);
  }

  return (
    <div className={styles.feedbackMicro} aria-label="Feedback sobre a devolutiva">
      <button aria-pressed={selected === "positive"} onClick={() => choose("positive")} type="button">
        {positiveLabel}
      </button>
      <button aria-pressed={selected === "negative"} onClick={() => choose("negative")} type="button">
        {negativeLabel}
      </button>
    </div>
  );
}
