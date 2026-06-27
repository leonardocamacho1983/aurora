"use client";

import { useId, useState } from "react";
import styles from "./SegmentedTabs.module.css";

export type SegmentedTabItem = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SegmentedTabsProps = {
  items: SegmentedTabItem[];
  value?: string;
  defaultValue?: string;
  label: string;
  className?: string;
  layout?: "inline" | "wrap" | "stretch";
  onValueChange?: (value: string) => void;
  size?: "regular" | "compact";
};

export function SegmentedTabs({
  items,
  value,
  defaultValue,
  label,
  className,
  layout = "inline",
  onValueChange,
  size = "regular",
}: SegmentedTabsProps) {
  const generatedId = useId();
  const firstEnabled = items.find((item) => !item.disabled)?.value;
  const [internalValue, setInternalValue] = useState(defaultValue ?? firstEnabled ?? items[0]?.value);
  const selectedValue = value ?? internalValue;

  function select(nextValue: string) {
    setInternalValue(nextValue);
    onValueChange?.(nextValue);
  }

  return (
    <div
      className={[styles.tabs, styles[layout], styles[size], className].filter(Boolean).join(" ")}
      role="tablist"
      aria-label={label}
    >
      {items.map((item) => {
        const selected = item.value === selectedValue;

        return (
          <button
            aria-controls={`${generatedId}-${item.value}-panel`}
            aria-selected={selected}
            className={styles.tab}
            disabled={item.disabled}
            id={`${generatedId}-${item.value}-tab`}
            key={item.value}
            onClick={() => select(item.value)}
            role="tab"
            tabIndex={selected ? 0 : -1}
            type="button"
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
