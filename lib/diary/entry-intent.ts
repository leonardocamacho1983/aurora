import { z } from "zod";
import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";

export type EntryIntent = "routine_log" | "reflection";

export type EntryIntentResult = {
  intent: EntryIntent;
  reason: string;
  confidence?: "low" | "medium" | "high";
};

export const ENTRY_INTENT_MODEL = "claude-haiku-4-5";
const MAX_REASON_LENGTH = 120;

const entryIntentSchema = z.object({
  intent: z.enum(["practical_log", "reflection", "unclear"]),
  confidence: z.enum(["low", "medium", "high"]),
  reason: z.string().max(500),
});

type ModelEntryIntentResult = z.infer<typeof entryIntentSchema>;

export const ENTRY_INTENT_SYSTEM_PROMPT = `Você classifica uma fala curta de diário da Aurora.

Escolha:
- "practical_log": tarefa, lembrete, agenda, compra, rotina, lista, compromisso, cuidado prático, registro factual do dia.
- "reflection": emoção, sofrimento, dúvida, decisão, pedido de ajuda, elaboração pessoal, sentido, conflito, ansiedade, medo, tristeza, raiva.
- "unclear": ambíguo ou sem confiança suficiente.

Regras:
- Se houver risco, sofrimento intenso ou pedido de ajuda emocional, use "reflection".
- "preciso" sozinho não define reflexão. "preciso comprar/agendar/pagar/buscar/tomar/levar" tende a practical_log. "preciso decidir/entender/ajuda/resolver como me sinto" tende a reflection.
- Seja conservador: se a classificação puder afetar valor ao usuário e estiver ambígua, use "unclear".
- Não explique além de uma razão curta.`;

export interface EntryIntentDeps {
  generate: (text: string) => Promise<unknown>;
}

const defaultGenerate = async (text: string): Promise<unknown> => {
  const { object } = await generateObject({
    model: anthropic(ENTRY_INTENT_MODEL),
    schema: entryIntentSchema,
    system: ENTRY_INTENT_SYSTEM_PROMPT,
    prompt: text,
    temperature: 0,
  });
  return object;
};

const defaultDeps: EntryIntentDeps = { generate: defaultGenerate };

const ROUTINE_TERMS = [
  "academia",
  "agendar",
  "almocei",
  "almoco",
  "banho",
  "banco",
  "buscar",
  "cachorro",
  "comprar",
  "comprei",
  "compras",
  "consulta",
  "dentista",
  "exame",
  "fui",
  "jantei",
  "levar",
  "marcar",
  "mercado",
  "medico",
  "paguei",
  "pagar",
  "passei",
  "remedio",
  "reuniao",
  "pet",
  "supermercado",
  "tomar",
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
  "preciso decidir",
  "preciso entender",
  "preciso de ajuda",
  "preciso falar",
  "preciso resolver",
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

export function classifyEntryIntentHeuristic(transcript: string): EntryIntentResult {
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

function toProductIntent(result: ModelEntryIntentResult): EntryIntentResult {
  const reason = result.reason.trim().slice(0, MAX_REASON_LENGTH);

  if (result.intent === "practical_log" && result.confidence !== "low") {
    return {
      intent: "routine_log",
      reason: reason || "model_practical_log",
      confidence: result.confidence,
    };
  }

  return {
    intent: "reflection",
    reason: result.intent === "unclear" ? "model_unclear" : reason || "model_reflection",
    confidence: result.confidence,
  };
}

export async function classifyEntryIntent(
  transcript: string,
  deps: EntryIntentDeps = defaultDeps,
): Promise<EntryIntentResult> {
  if (!transcript.trim()) {
    return { intent: "reflection", reason: "empty_text", confidence: "low" };
  }

  const heuristic = classifyEntryIntentHeuristic(transcript);
  if (heuristic.reason === "risk_signal") {
    return heuristic;
  }

  try {
    const raw = await deps.generate(transcript);
    return toProductIntent(entryIntentSchema.parse(raw));
  } catch {
    return { intent: "reflection", reason: "intent_classifier_failed", confidence: "low" };
  }
}
