import type { RitualIntent } from "@/lib/email/lifecycle-contract";

export type RitualIntentSource = {
  moment?: string | null;
  value?: string | null;
  presence?: string | null;
  rhythm?: string | null;
};

const GROUP_TERMS: Record<Exclude<RitualIntent, "unknown">, string[]> = {
  tasks_projects: [
    "tarefa",
    "tarefas",
    "projeto",
    "projetos",
    "trabalho",
    "carreira",
    "empresa",
    "decidir",
    "decisao",
    "prioridade",
    "prioridades",
    "produtividade",
    "organizar",
    "planejar",
    "foco",
  ],
  hard_moments: [
    "dificil",
    "dificeis",
    "pesado",
    "ansiedade",
    "ansioso",
    "ansiosa",
    "sono",
    "triste",
    "tristeza",
    "medo",
    "crise",
    "crises",
    "dor",
    "sofrimento",
    "estresse",
    "cansado",
    "cansada",
  ],
  self_understanding: [
    "entender",
    "compreender",
    "clareza",
    "padrao",
    "padroes",
    "sentir",
    "sinto",
    "autoconhecimento",
    "conhecer",
    "refletir",
    "reflexao",
    "emocao",
    "emocoes",
    "sentimento",
    "sentimentos",
  ],
  habit_practice: [
    "diario",
    "diariamente",
    "habito",
    "habitos",
    "rotina",
    "constancia",
    "consistencia",
    "pratica",
    "praticar",
    "manha",
    "noite",
  ],
};

const PRIORITY: Exclude<RitualIntent, "unknown">[] = [
  "hard_moments",
  "tasks_projects",
  "self_understanding",
  "habit_practice",
];

export function normalizeRitualText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function classifyRitualIntent(input: RitualIntentSource): RitualIntent {
  const text = normalizeRitualText(
    [input.moment, input.value, input.presence, input.rhythm].filter(Boolean).join(" "),
  );

  if (!text.trim()) return "unknown";

  const scores = new Map<Exclude<RitualIntent, "unknown">, number>();
  for (const [intent, terms] of Object.entries(GROUP_TERMS) as Array<
    [Exclude<RitualIntent, "unknown">, string[]]
  >) {
    const score = terms.reduce((count, term) => count + (text.includes(term) ? 1 : 0), 0);
    if (score > 0) scores.set(intent, score);
  }

  if (scores.size === 0) return "unknown";

  return PRIORITY.reduce<Exclude<RitualIntent, "unknown"> | null>((best, intent) => {
    if (!scores.has(intent)) return best;
    if (!best) return intent;
    const currentScore = scores.get(intent) ?? 0;
    const bestScore = scores.get(best) ?? 0;
    return currentScore > bestScore ? intent : best;
  }, null) ?? "unknown";
}
