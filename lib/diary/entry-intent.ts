export type EntryIntent = "routine_log" | "reflection";

export type EntryIntentResult = {
  intent: EntryIntent;
  reason: string;
};

const ROUTINE_TERMS = [
  "academia",
  "almocei",
  "almoco",
  "banco",
  "comprei",
  "compras",
  "consulta",
  "dentista",
  "fui",
  "jantei",
  "mercado",
  "medico",
  "paguei",
  "passei",
  "reuniao",
  "supermercado",
  "treinei",
  "trabalho",
  "viagem",
] as const;

const REFLECTION_TERMS = [
  "ansiedade",
  "ansioso",
  "ansiosa",
  "culpa",
  "decidir",
  "decisao",
  "duvida",
  "entender",
  "estou preocupado",
  "estou preocupada",
  "medo",
  "me ajuda",
  "me deixou",
  "me senti",
  "nao aguento",
  "nao sei",
  "preciso",
  "preocupado",
  "preocupada",
  "raiva",
  "triste",
  "vergonha",
] as const;

const RISK_TERMS = [
  "acabar com tudo",
  "me machucar",
  "me matar",
  "morrer",
  "nao quero viver",
  "suicidio",
  "suicidar",
] as const;

function normalizeText(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function hasAny(text: string, terms: readonly string[]) {
  return terms.some((term) => text.includes(term));
}

function wordCount(text: string) {
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

function hasScheduleShape(text: string) {
  return /\b(\d{1,2}h|\d{1,2}:\d{2}|segunda|terca|quarta|quinta|sexta|sabado|domingo|hoje|amanha|ontem)\b/.test(text);
}

export function classifyEntryIntent(transcript: string): EntryIntentResult {
  const text = normalizeText(transcript);
  const words = wordCount(text);

  if (hasAny(text, RISK_TERMS)) {
    return { intent: "reflection", reason: "risk_signal" };
  }

  if (hasAny(text, REFLECTION_TERMS) || text.includes("?")) {
    return { intent: "reflection", reason: "reflection_signal" };
  }

  if (words <= 3) {
    return { intent: "routine_log", reason: "brief_neutral_log" };
  }

  const hasRoutineSignal = hasAny(text, ROUTINE_TERMS) || hasScheduleShape(text);
  if (hasRoutineSignal && words <= 34) {
    return { intent: "routine_log", reason: "routine_signal" };
  }

  return { intent: "reflection", reason: "default_reflection" };
}
