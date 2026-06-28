import { classifyCrisis, type CrisisType } from "./crisis-classifier";
import { getCrisisResources, type CrisisResources } from "./crisis-resources";
import { retrieveSnippets, type RagSnippet } from "./embeddings";
import { generateReflectionWithFallback } from "./reflection";
import { suggestMood, type Mood } from "./mood";

/**
 * Pipeline central de IA (§5). Ordem OBRIGATÓRIA, garantida estruturalmente:
 *   1. classificador de crise SEMPRE primeiro (§13)
 *   2. se risk=high → protocolo de crise (§8) e PARA (sem reflexão)
 *   3. senão → RAG → reflexão (Sonnet 4.6) → humor/tags (Haiku)
 *
 * A reflexão é fisicamente inalcançável quando risk=high (early return),
 * e qualquer falha no classificador propaga (fail-loud) — nunca cai na
 * reflexão por baixo dos panos.
 */

export interface ReflectInput {
  text: string;
  locale: string; // para os recursos de crise (§8)
}

export type ReflectResult =
  | {
      kind: "crisis";
      risk: "high";
      type: CrisisType;
      resources: CrisisResources;
    }
  | {
      kind: "reflection";
      risk: "none" | "low";
      reflection: string;
      mood: Mood | null;
    };

export interface ReflectDeps {
  classify: (text: string) => Promise<{ risk: "none" | "low" | "high"; type: CrisisType }>;
  retrieve: (text: string) => Promise<RagSnippet[]>;
  reflect: (text: string, context: RagSnippet[]) => Promise<string>;
  suggestMood: (text: string) => Promise<Mood | null>;
}

const REFLECTION_UNAVAILABLE =
  "Seu registro foi guardado. A Aurora não conseguiu preparar uma leitura completa agora, então fica só o momento registrado com segurança.";

export const NO_REFLECTION_NEEDED =
  "Seu registro foi guardado no diário. Parece mais um apontamento rápido do momento do que algo que peça uma leitura da Aurora agora. Ele fica salvo na sua Timeline para você consultar quando quiser.";

export const DIARY_ENTRY_SAVED_WITHOUT_AI =
  "Seu registro foi guardado no diário. A Aurora não conseguiu preparar uma leitura agora, mas a entrada ficou salva na sua Timeline para você consultar quando quiser.";

const SHALLOW_TEST_PATTERNS = [
  /\btest(e|ando|ar|ei|ou)\b/i,
  /\bvalidando\b/i,
  /\bfuncionando\b/i,
  /\bs[oó]\s+pra\s+ver\b/i,
  /\bpra\s+ver\s+se\b/i,
  /\bque\s+legal\b/i,
];

const MEANINGFUL_PATTERNS = [
  /\baprendi(zado|zagem|endo)?\b/i,
  /\bempreend/i,
  /\bfinalmente\b/i,
  /\bfeliz\b/i,
  /\btrilha\b/i,
  /\bsinto\b/i,
  /\bsentindo\b/i,
  /\bdecis[aã]o\b/i,
  /\bmedo\b/i,
  /\bconversando\b/i,
  /\bpessoas?\b/i,
  /\bimportante\b/i,
];

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function shouldUseSimpleRegistration(text: string): boolean {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return true;

  const wordCount = countWords(normalized);
  const isShort = wordCount <= 24;
  const looksLikeTest = SHALLOW_TEST_PATTERNS.some((pattern) => pattern.test(normalized));
  const hasMeaningfulSignal = MEANINGFUL_PATTERNS.some((pattern) => pattern.test(normalized));

  return isShort && looksLikeTest && !hasMeaningfulSignal;
}

/** Constrói as dependências reais para uma requisição (escopo do usuário). */
export function createReflectDeps(userId: string): ReflectDeps {
  if (process.env.NODE_ENV !== "production" && !process.env.ANTHROPIC_API_KEY) {
    return {
      classify: async () => ({ risk: "none", type: "none" }),
      retrieve: async () => [],
      reflect: async () =>
        "Este é um retorno local de teste. Ele existe só para validar o fluxo de gravação, resultado e timeline sem depender das chaves de IA.",
      suggestMood: async () => "calmo",
    };
  }

  return {
    classify: (text) => classifyCrisis(text),
    retrieve: (text) => retrieveSnippets(userId, text),
    reflect: (text, context) => generateReflectionWithFallback(text, context),
    suggestMood: (text) => suggestMood(text),
  };
}

export async function runReflectPipeline(
  input: ReflectInput,
  deps: ReflectDeps,
): Promise<ReflectResult> {
  // (1) §13 — classificador de crise SEMPRE primeiro, sem exceção.
  const crisis = await deps.classify(input.text);

  // (2) §8 — high: NÃO gera reflexão; entra no protocolo de crise e PARA.
  if (crisis.risk === "high") {
    return {
      kind: "crisis",
      risk: "high",
      type: crisis.type,
      resources: getCrisisResources(input.locale),
    };
  }

  if (shouldUseSimpleRegistration(input.text)) {
    return {
      kind: "reflection",
      risk: crisis.risk,
      reflection: NO_REFLECTION_NEEDED,
      mood: null,
    };
  }

  // (3) Caminho normal: RAG → reflexão → humor/tags.
  // Classificação de crise é fail-loud; RAG/reflexão/humor não podem fazer o
  // registro sumir quando um provedor externo fica indisponível.
  let context: RagSnippet[] = [];
  try {
    context = await deps.retrieve(input.text);
  } catch (error) {
    console.warn("reflect retrieve fallback:", error);
  }

  let reflection = REFLECTION_UNAVAILABLE;
  try {
    reflection = await deps.reflect(input.text, context);
  } catch (error) {
    console.warn("reflect generation fallback:", error);
  }

  let mood: Mood | null = null;
  try {
    mood = await deps.suggestMood(input.text);
  } catch (error) {
    console.warn("mood fallback:", error);
  }

  return { kind: "reflection", risk: crisis.risk, reflection, mood };
}
