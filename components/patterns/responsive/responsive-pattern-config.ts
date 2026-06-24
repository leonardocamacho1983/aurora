export type PatternViewport = "mobile" | "tablet" | "desktop";

export type ResponsivePatternId =
  | "diary-capture"
  | "reflection-result"
  | "timeline-list"
  | "open-thread"
  | "empty-thread";

export type PatternScenarioId =
  | "idle"
  | "recording"
  | "reflecting"
  | "error"
  | "streaming"
  | "saved"
  | "with-feedback"
  | "continue-thread"
  | "filled"
  | "empty"
  | "with-flip"
  | "no-flip"
  | "filtered"
  | "latest"
  | "question"
  | "continuing"
  | "no-thread"
  | "no-continuity"
  | "start-from-diary";

export type PatternActionMode = "minimal" | "actions";
export type PatternBackgroundMode = "texture" | "plain";
export type PatternTypographyChoice = "product" | "editorial" | "compact";
export type PatternTypographySettings = {
  title: PatternTypographyChoice;
  support: PatternTypographyChoice;
  reflection: PatternTypographyChoice;
};

export type ScenarioOption = {
  value: PatternScenarioId;
  label: string;
};

export type PatternOption = {
  value: ResponsivePatternId;
  label: string;
  componentName: string;
  scenarios: ScenarioOption[];
};

export const actionModeOptions: Array<{ value: PatternActionMode; label: string }> = [
  { value: "minimal", label: "Sem botões" },
  { value: "actions", label: "Com botões" },
];

export const backgroundModeOptions: Array<{ value: PatternBackgroundMode; label: string }> = [
  { value: "texture", label: "Textura" },
  { value: "plain", label: "Plano" },
];

export const typographyOptions: Array<{ value: PatternTypographyChoice; label: string }> = [
  { value: "product", label: "Produto" },
  { value: "editorial", label: "Editorial" },
  { value: "compact", label: "Compacta" },
];

export const viewportOptions: Array<{ value: PatternViewport; label: string; size: string; description: string }> = [
  {
    value: "mobile",
    label: "Mobile",
    size: "390 x 760",
    description: "Fluxo vertical, ação principal e navegação inferior.",
  },
  {
    value: "tablet",
    label: "Tablet",
    size: "768 x 820",
    description: "Split entre ação e conteúdo, com mais respiro lateral.",
  },
  {
    value: "desktop",
    label: "Desktop",
    size: "1180 x 720",
    description: "Composição ampla com contexto lateral sem virar admin.",
  },
];

export const patternOptions: PatternOption[] = [
  {
    value: "diary-capture",
    label: "Diário",
    componentName: "DiaryCapturePattern",
    scenarios: [
      { value: "idle", label: "Pronto" },
      { value: "recording", label: "Gravando" },
      { value: "reflecting", label: "Pensando" },
      { value: "error", label: "Erro" },
    ],
  },
  {
    value: "reflection-result",
    label: "Resultado",
    componentName: "ReflectionResultPattern",
    scenarios: [
      { value: "saved", label: "Salvo" },
      { value: "streaming", label: "Streaming" },
      { value: "with-feedback", label: "Feedback" },
      { value: "continue-thread", label: "Continuar fio" },
    ],
  },
  {
    value: "timeline-list",
    label: "Timeline",
    componentName: "TimelineListPattern",
    scenarios: [
      { value: "with-flip", label: "Com flip" },
      { value: "no-flip", label: "Sem flip" },
      { value: "empty", label: "Vazia" },
      { value: "filtered", label: "Filtrada" },
    ],
  },
  {
    value: "open-thread",
    label: "Fio aberto",
    componentName: "OpenThreadPattern",
    scenarios: [
      { value: "latest", label: "Último momento" },
      { value: "question", label: "Pergunta viva" },
      { value: "continuing", label: "Continuando" },
      { value: "empty", label: "Vazio" },
    ],
  },
  {
    value: "empty-thread",
    label: "Fio vazio",
    componentName: "EmptyThreadPattern",
    scenarios: [
      { value: "no-thread", label: "Sem fio" },
      { value: "no-continuity", label: "Sem continuidade" },
      { value: "start-from-diary", label: "Começar diário" },
    ],
  },
];

export function getDefaultScenario(patternId: ResponsivePatternId): PatternScenarioId {
  return patternOptions.find((pattern) => pattern.value === patternId)?.scenarios[0]?.value ?? "idle";
}

export function getDefaultTypography(patternId: ResponsivePatternId): PatternTypographySettings {
  switch (patternId) {
    case "diary-capture":
      return { title: "editorial", support: "product", reflection: "editorial" };
    case "reflection-result":
      return { title: "product", support: "product", reflection: "editorial" };
    case "timeline-list":
      return { title: "product", support: "product", reflection: "editorial" };
    case "open-thread":
    case "empty-thread":
    default:
      return { title: "product", support: "product", reflection: "product" };
  }
}
