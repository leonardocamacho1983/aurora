"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import type { MoodPeriod } from "@/lib/account/profile-dashboard";
import styles from "./Account.module.css";

type PeriodKey = "semana" | "mes" | "tudo";

const PERIOD_LABELS: Record<PeriodKey, string> = {
  semana: "Semana",
  mes: "Mês",
  tudo: "Tudo",
};

export function ProfileMoodTabs({
  periods,
}: {
  periods: Record<PeriodKey, MoodPeriod>;
}) {
  const [selected, setSelected] = useState<PeriodKey>("semana");
  const active = periods[selected];

  return (
    <div className={styles.moodTabs}>
      <div className={styles.segmented} role="tablist" aria-label="Período dos humores">
        {(Object.keys(PERIOD_LABELS) as PeriodKey[]).map((period) => (
          <button
            aria-selected={period === selected}
            key={period}
            onClick={() => setSelected(period)}
            role="tab"
            type="button"
          >
            {PERIOD_LABELS[period]}
          </button>
        ))}
      </div>

      {active.points.length > 0 ? (
        <div className={styles.moodTrack} role="img" aria-label="Sequência de humores no período selecionado">
          {active.points.map((point) => (
            <span className={styles.moodCol} key={point.key}>
              <i
                className={styles.moodBead}
                style={{ "--mood-color": point.color } as CSSProperties}
                title={point.moodLabel}
              />
              <span>{point.label}</span>
            </span>
          ))}
        </div>
      ) : (
        <p className={styles.emptyState}>Os humores aparecem aqui quando houver registros suficientes.</p>
      )}

      <div className={styles.moodLegend} aria-hidden="true">
        <span><i style={{ background: "var(--mood-leve)" }} /> Leve</span>
        <span><i style={{ background: "var(--mood-calmo)" }} /> Calmo</span>
        <span><i style={{ background: "var(--mood-sensivel)" }} /> Sensível</span>
        <span><i style={{ background: "var(--mood-pesado)" }} /> Pesado</span>
        <span><i style={{ background: "var(--mood-ansioso)" }} /> Ansioso</span>
      </div>

      <p className={styles.moodCaption}>{active.caption}</p>
    </div>
  );
}
