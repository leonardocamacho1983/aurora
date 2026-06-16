import { z } from "zod";
import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";

/**
 * Classificador de crise — Fase 2, §5/§8/§13 do handoff.
 *
 * GUARDRAIL (§13): este classificador roda SEMPRE antes da reflexão, sem exceção.
 * Se retornar risk="high", o pipeline NÃO gera reflexão normal e entra no
 * protocolo de crise (§8). Nunca descreve métodos; nunca interroga a pessoa.
 *
 * Modelo: Claude Haiku 4.5 (`claude-haiku-4-5`), via Vercel AI SDK (§1).
 */

export const CRISIS_MODEL = "claude-haiku-4-5";

export const RISK_LEVELS = ["none", "low", "high"] as const;
export const CRISIS_TYPES = [
  "none",
  "self_harm",
  "suicidal",
  "abuse",
  "harm_to_others",
] as const;

export type RiskLevel = (typeof RISK_LEVELS)[number];
export type CrisisType = (typeof CRISIS_TYPES)[number];

export const crisisSchema = z.object({
  risk: z.enum(RISK_LEVELS),
  type: z.enum(CRISIS_TYPES),
});

export type CrisisResult = z.infer<typeof crisisSchema>;

// Prompt do classificador (handoff §5). A forma do JSON é garantida pelo schema;
// o prompt foca o critério de "high".
export const CRISIS_SYSTEM_PROMPT = `Você é um classificador de risco. Classifique o risco no texto a seguir.
Marque "high" para ideação suicida, intenção ou plano de autoagressão, ou risco iminente a si mesmo ou a outros.
Marque "low" para sofrimento elevado sem intenção/plano. Caso contrário, "none".
Escolha o "type" que melhor descreve o risco; use "none" quando risk for "none".
Não explique.`;

/** Seam de injeção: permite testar a lógica sem chamar a API. */
export interface ClassifyDeps {
  generate: (text: string) => Promise<unknown>;
}

const defaultGenerate = async (text: string): Promise<unknown> => {
  const { object } = await generateObject({
    model: anthropic(CRISIS_MODEL),
    schema: crisisSchema,
    system: CRISIS_SYSTEM_PROMPT,
    prompt: text,
    temperature: 0, // classificação determinística (Haiku 4.5 aceita temperature)
  });
  return object;
};

const defaultDeps: ClassifyDeps = { generate: defaultGenerate };

/**
 * Classifica o risco de um texto. Sempre retorna {risk, type} validados.
 * Texto vazio curto-circuita para "none" sem chamar o modelo.
 * Lança se a saída do modelo não validar contra o schema (fail-loud:
 * o pipeline decide o fallback conservador, nunca silencia uma falha).
 */
export async function classifyCrisis(
  text: string,
  deps: ClassifyDeps = defaultDeps,
): Promise<CrisisResult> {
  if (!text || !text.trim()) {
    return { risk: "none", type: "none" };
  }

  const raw = await deps.generate(text);
  return crisisSchema.parse(raw);
}
