export const FOCUS_KEYS = [
  "carreira-direcao",
  "sono-descanso",
  "foco-organizacao",
  "relacoes-decisoes",
  "fase-autoconhecimento",
] as const;

export type FocusKey = (typeof FOCUS_KEYS)[number];

export type FocusSignal = {
  key: FocusKey;
  label: string;
  color: string;
  score: number;
};

export type FocusDefinition = Omit<FocusSignal, "score"> & {
  description: string;
};

const FOCUS_DEFINITIONS: FocusDefinition[] = [
  {
    key: "carreira-direcao",
    label: "Carreira e direção",
    color: "var(--aurora-warm)",
    description: "Trabalho, projetos, clientes, carreira e próximos passos.",
  },
  {
    key: "sono-descanso",
    label: "Sono e descanso",
    color: "var(--aurora-mint)",
    description: "Sono, relaxamento, descanso, ansiedade e momentos de peso.",
  },
  {
    key: "foco-organizacao",
    label: "Foco e organização",
    color: "var(--aurora-blue)",
    description: "Foco, rotina, tempo, organização e transformação de intenção em gesto.",
  },
  {
    key: "relacoes-decisoes",
    label: "Relações e decisões",
    color: "var(--aurora-pink)",
    description: "Relações, decisões, consequências e conversas difíceis.",
  },
  {
    key: "fase-autoconhecimento",
    label: "Fase e autoconhecimento",
    color: "var(--accent-soft)",
    description: "Fase de vida, caminho, padrões pessoais e entendimento emocional.",
  },
];

export function focusDefinitions() {
  return FOCUS_DEFINITIONS.map((definition) => ({ ...definition }));
}

export function getFocusDefinition(key: string) {
  return FOCUS_DEFINITIONS.find((focus) => focus.key === key) ?? null;
}

export function focusSignalFromStored(focusKey: string | null | undefined, confidence: string | null | undefined) {
  if (confidence !== "high" && confidence !== "medium") return null;

  const definition = getFocusDefinition(focusKey ?? "");
  if (!definition) return null;

  return {
    key: definition.key,
    label: definition.label,
    color: definition.color,
    score: confidence === "high" ? 3 : 2,
  };
}

export function liveFocusSignalFromStored({
  focusKey,
  confidence,
  hiddenAt,
  resolvedAt,
}: {
  focusKey: string | null | undefined;
  confidence: string | null | undefined;
  hiddenAt?: Date | string | null;
  resolvedAt?: Date | string | null;
}) {
  if (hiddenAt || resolvedAt) return null;
  return focusSignalFromStored(focusKey, confidence);
}
