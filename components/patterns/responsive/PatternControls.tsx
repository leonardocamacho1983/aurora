"use client";

import { SegmentedTabs } from "@/components/ui";
import {
  actionModeOptions,
  backgroundModeOptions,
  patternOptions,
  typographyOptions,
  viewportOptions,
  type PatternActionMode,
  type PatternBackgroundMode,
  type PatternScenarioId,
  type PatternTypographyChoice,
  type PatternTypographySettings,
  type PatternViewport,
  type ResponsivePatternId,
} from "./responsive-pattern-config";
import styles from "./ResponsivePatterns.module.css";

type PatternControlsProps = {
  pattern: ResponsivePatternId;
  viewport: PatternViewport;
  scenario: PatternScenarioId;
  actionMode: PatternActionMode;
  backgroundMode: PatternBackgroundMode;
  typography: PatternTypographySettings;
  onPatternChange: (value: ResponsivePatternId) => void;
  onViewportChange: (value: PatternViewport) => void;
  onScenarioChange: (value: PatternScenarioId) => void;
  onActionModeChange: (value: PatternActionMode) => void;
  onBackgroundModeChange: (value: PatternBackgroundMode) => void;
  onTypographyChange: (area: keyof PatternTypographySettings, value: PatternTypographyChoice) => void;
};

export function PatternControls({
  pattern,
  viewport,
  scenario,
  actionMode,
  backgroundMode,
  typography,
  onPatternChange,
  onViewportChange,
  onScenarioChange,
  onActionModeChange,
  onBackgroundModeChange,
  onTypographyChange,
}: PatternControlsProps) {
  const activePattern = patternOptions.find((option) => option.value === pattern) ?? patternOptions[0];
  const showDiaryOptions = pattern === "diary-capture";
  const typographyLabels =
    pattern === "reflection-result"
      ? {
          title: "Ação",
          titleAria: "Selecionar tipografia das ações",
          support: "Apoio",
          supportAria: "Selecionar tipografia de apoio",
          reflection: "Reflexão",
          reflectionAria: "Selecionar tipografia de reflexão",
        }
      : {
          title: "Título",
          titleAria: "Selecionar tipografia do título",
          support: "Apoio",
          supportAria: "Selecionar tipografia de apoio",
          reflection: "Reflexão",
          reflectionAria: "Selecionar tipografia de reflexão",
        };

  return (
    <section className={styles.controls} aria-label="Controles do laboratório responsivo">
      <div className={styles.controlSection}>
        <div className={styles.controlGrid}>
          <div className={`${styles.controlGroup} ${styles.controlGroupWide}`}>
            <span className={styles.label}>Pattern</span>
            <SegmentedTabs
              items={patternOptions.map((option) => ({ value: option.value, label: option.label }))}
              label="Selecionar pattern"
              layout="wrap"
              onValueChange={(nextValue) => onPatternChange(nextValue as ResponsivePatternId)}
              size="compact"
              value={pattern}
            />
          </div>

          <div className={styles.controlGroup}>
            <span className={styles.label}>Ambiente</span>
            <SegmentedTabs
              items={viewportOptions.map((option) => ({ value: option.value, label: option.label }))}
              label="Selecionar ambiente responsivo"
              layout="wrap"
              onValueChange={(nextValue) => onViewportChange(nextValue as PatternViewport)}
              size="compact"
              value={viewport}
            />
          </div>

          <div className={styles.controlGroup}>
            <span className={styles.label}>Cenário</span>
            <SegmentedTabs
              items={activePattern.scenarios}
              label="Selecionar cenário"
              layout="wrap"
              onValueChange={(nextValue) => onScenarioChange(nextValue as PatternScenarioId)}
              size="compact"
              value={scenario}
            />
          </div>
        </div>
      </div>

      {showDiaryOptions ? (
        <div className={styles.controlSection}>
          <div className={styles.controlSectionHeader}>
            <span className={styles.controlSectionTitle}>Ajustes do Diário</span>
            <span className={styles.controlSectionHint}>Exceções previstas sem mudar o padrão de produção.</span>
          </div>
          <div className={styles.controlGrid}>
            <div className={styles.controlGroup}>
              <span className={styles.label}>Ações</span>
              <SegmentedTabs
                items={actionModeOptions}
                label="Mostrar ou ocultar ações do Diário"
                layout="wrap"
                onValueChange={(nextValue) => onActionModeChange(nextValue as PatternActionMode)}
                size="compact"
                value={actionMode}
              />
            </div>

            <div className={styles.controlGroup}>
              <span className={styles.label}>Fundo</span>
              <SegmentedTabs
                items={backgroundModeOptions}
                label="Selecionar fundo do Diário"
                layout="wrap"
                onValueChange={(nextValue) => onBackgroundModeChange(nextValue as PatternBackgroundMode)}
                size="compact"
                value={backgroundMode}
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className={styles.controlSection}>
        <div className={styles.controlSectionHeader}>
          <span className={styles.controlSectionTitle}>Tipografia por área</span>
          <span className={styles.controlSectionHint}>Presets do DS aplicados ao preview atual.</span>
        </div>
        <div className={styles.controlGrid}>
          <div className={styles.controlGroup}>
            <span className={styles.label}>{typographyLabels.title}</span>
            <SegmentedTabs
              items={typographyOptions}
              label={typographyLabels.titleAria}
              layout="wrap"
              onValueChange={(nextValue) => onTypographyChange("title", nextValue as PatternTypographyChoice)}
              size="compact"
              value={typography.title}
            />
          </div>

          <div className={styles.controlGroup}>
            <span className={styles.label}>{typographyLabels.support}</span>
            <SegmentedTabs
              items={typographyOptions}
              label={typographyLabels.supportAria}
              layout="wrap"
              onValueChange={(nextValue) => onTypographyChange("support", nextValue as PatternTypographyChoice)}
              size="compact"
              value={typography.support}
            />
          </div>

          <div className={styles.controlGroup}>
            <span className={styles.label}>{typographyLabels.reflection}</span>
            <SegmentedTabs
              items={typographyOptions}
              label={typographyLabels.reflectionAria}
              layout="wrap"
              onValueChange={(nextValue) => onTypographyChange("reflection", nextValue as PatternTypographyChoice)}
              size="compact"
              value={typography.reflection}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
