import { classifyCrisis, type CrisisType } from "./crisis-classifier";
import { getCrisisResources, type CrisisResources } from "./crisis-resources";
import { retrieveSnippets, type RagSnippet } from "./embeddings";
import { generateReflection } from "./reflection";
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

/** Constrói as dependências reais para uma requisição (escopo do usuário). */
export function createReflectDeps(userId: string): ReflectDeps {
  return {
    classify: (text) => classifyCrisis(text),
    retrieve: (text) => retrieveSnippets(userId, text),
    reflect: (text, context) => generateReflection(text, context),
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

  // (3) Caminho normal: RAG → reflexão → humor/tags.
  const context = await deps.retrieve(input.text);
  const reflection = await deps.reflect(input.text, context);
  const mood = await deps.suggestMood(input.text);

  return { kind: "reflection", risk: crisis.risk, reflection, mood };
}
