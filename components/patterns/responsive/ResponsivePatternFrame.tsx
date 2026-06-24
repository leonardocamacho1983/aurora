import type { ReactNode } from "react";
import { viewportOptions, type PatternViewport } from "./responsive-pattern-config";
import styles from "./ResponsivePatterns.module.css";

type ResponsivePatternFrameProps = {
  viewport: PatternViewport;
  title: string;
  scenarioLabel: string;
  children: ReactNode;
};

export function ResponsivePatternFrame({ viewport, title, scenarioLabel, children }: ResponsivePatternFrameProps) {
  const viewportMeta = viewportOptions.find((option) => option.value === viewport) ?? viewportOptions[0];

  return (
    <section className={styles.frameWrap} aria-label="Preview responsivo do pattern">
      <div className={styles.frameHeader}>
        <div>
          <h2>{title}</h2>
          <p>{viewportMeta.description}</p>
        </div>
        <span className={styles.frameMeta}>{viewportMeta.label} · {viewportMeta.size} · {scenarioLabel}</span>
      </div>
      <div className={styles.stage}>
        <div className={styles.frame} data-viewport={viewport}>
          {children}
        </div>
      </div>
    </section>
  );
}
