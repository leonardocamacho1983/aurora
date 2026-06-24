"use client";

import { useMemo, useState } from "react";
import { DiaryCapturePattern } from "@/components/patterns/DiaryCapturePattern";
import { EmptyThreadPattern } from "@/components/patterns/EmptyThreadPattern";
import { OpenThreadPattern } from "@/components/patterns/OpenThreadPattern";
import { ReflectionResultPattern } from "@/components/patterns/ReflectionResultPattern";
import { TimelineListPattern } from "@/components/patterns/TimelineListPattern";
import { PatternControls } from "./PatternControls";
import { ResponsivePatternFrame } from "./ResponsivePatternFrame";
import {
  getDefaultScenario,
  getDefaultTypography,
  patternOptions,
  type PatternActionMode,
  type PatternBackgroundMode,
  type PatternScenarioId,
  type PatternTypographyChoice,
  type PatternTypographySettings,
  type PatternViewport,
  type ResponsivePatternId,
} from "./responsive-pattern-config";
import styles from "./ResponsivePatterns.module.css";

type PatternDisplayOptions = {
  actionMode: PatternActionMode;
  backgroundMode: PatternBackgroundMode;
  typography: PatternTypographySettings;
};

function renderPattern(
  pattern: ResponsivePatternId,
  viewport: PatternViewport,
  scenario: PatternScenarioId,
  displayOptions: PatternDisplayOptions,
) {
  switch (pattern) {
    case "diary-capture":
      return (
        <DiaryCapturePattern
          actionMode={displayOptions.actionMode}
          backgroundMode={displayOptions.backgroundMode}
          scenario={scenario}
          typography={displayOptions.typography}
          viewport={viewport}
        />
      );
    case "reflection-result":
      return <ReflectionResultPattern scenario={scenario} typography={displayOptions.typography} viewport={viewport} />;
    case "timeline-list":
      return <TimelineListPattern scenario={scenario} typography={displayOptions.typography} viewport={viewport} />;
    case "open-thread":
      return <OpenThreadPattern scenario={scenario} typography={displayOptions.typography} viewport={viewport} />;
    case "empty-thread":
      return <EmptyThreadPattern scenario={scenario} typography={displayOptions.typography} viewport={viewport} />;
    default:
      return <DiaryCapturePattern scenario="idle" viewport={viewport} />;
  }
}

export function ResponsivePatternLab() {
  const [pattern, setPattern] = useState<ResponsivePatternId>("diary-capture");
  const [viewport, setViewport] = useState<PatternViewport>("mobile");
  const [actionMode, setActionMode] = useState<PatternActionMode>("minimal");
  const [backgroundMode, setBackgroundMode] = useState<PatternBackgroundMode>("texture");
  const [typographyByPattern, setTypographyByPattern] = useState<Record<string, PatternTypographySettings>>({
    "diary-capture": getDefaultTypography("diary-capture"),
  });
  const [scenarioByPattern, setScenarioByPattern] = useState<Record<string, PatternScenarioId>>({
    "diary-capture": "idle",
  });

  const activePattern = patternOptions.find((option) => option.value === pattern) ?? patternOptions[0];
  const scenario = scenarioByPattern[pattern] ?? getDefaultScenario(pattern);
  const typography = typographyByPattern[pattern] ?? getDefaultTypography(pattern);
  const activeScenario = activePattern.scenarios.find((option) => option.value === scenario) ?? activePattern.scenarios[0];
  const renderedPattern = useMemo(
    () => renderPattern(pattern, viewport, scenario, { actionMode, backgroundMode, typography }),
    [actionMode, backgroundMode, pattern, scenario, typography, viewport],
  );

  function handlePatternChange(nextPattern: ResponsivePatternId) {
    setPattern(nextPattern);
    setScenarioByPattern((current) => ({
      ...current,
      [nextPattern]: current[nextPattern] ?? getDefaultScenario(nextPattern),
    }));
    setTypographyByPattern((current) => ({
      ...current,
      [nextPattern]: current[nextPattern] ?? getDefaultTypography(nextPattern),
    }));
  }

  function handleScenarioChange(nextScenario: PatternScenarioId) {
    setScenarioByPattern((current) => ({
      ...current,
      [pattern]: nextScenario,
    }));
  }

  function handleTypographyChange(area: keyof PatternTypographySettings, value: PatternTypographyChoice) {
    setTypographyByPattern((current) => ({
      ...current,
      [pattern]: {
        ...(current[pattern] ?? getDefaultTypography(pattern)),
        [area]: value,
      },
    }));
  }

  return (
    <div className={styles.lab}>
      <PatternControls
        actionMode={actionMode}
        backgroundMode={backgroundMode}
        onActionModeChange={setActionMode}
        onBackgroundModeChange={setBackgroundMode}
        onPatternChange={handlePatternChange}
        onScenarioChange={handleScenarioChange}
        onTypographyChange={handleTypographyChange}
        onViewportChange={setViewport}
        pattern={pattern}
        scenario={scenario}
        typography={typography}
        viewport={viewport}
      />
      <ResponsivePatternFrame
        scenarioLabel={activeScenario.label}
        title={activePattern.componentName}
        viewport={viewport}
      >
        {renderedPattern}
      </ResponsivePatternFrame>
    </div>
  );
}
