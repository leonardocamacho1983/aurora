import { z } from "zod";
import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { CRISIS_TYPES, RISK_LEVELS, type CrisisType, type RiskLevel } from "./crisis-classifier";

export const DIARY_ROUTER_MODEL = "claude-haiku-4-5";

export const DIARY_INTENTS = ["practical_log", "reflection", "unclear"] as const;
export const ROUTER_CONFIDENCE = ["low", "medium", "high"] as const;

export type DiaryIntent = (typeof DIARY_INTENTS)[number];
export type RouterConfidence = (typeof ROUTER_CONFIDENCE)[number];

export const diaryRouteSchema = z.object({
  risk: z.enum(RISK_LEVELS),
  crisisType: z.enum(CRISIS_TYPES),
  intent: z.enum(DIARY_INTENTS),
  confidence: z.enum(ROUTER_CONFIDENCE),
  reason: z.string().max(120),
});

export type DiaryRoute = z.infer<typeof diaryRouteSchema>;

export const DIARY_ROUTER_SYSTEM_PROMPT = `Você roteia uma fala curta de diário da Aurora.

Classifique risco e intenção em um JSON curto.

Risco:
- risk="high" para ideação suicida, intenção/plano de autoagressão, abuso ou risco iminente.
- risk="low" para sofrimento elevado sem intenção/plano.
- risk="none" caso contrário.
- crisisType deve usar "none" quando risk="none".

Intenção:
- "practical_log": tarefa, lembrete, agenda, compra, rotina, lista, compromisso, cuidado prático, registro factual.
- "reflection": emoção, sofrimento, dúvida, decisão, pedido de ajuda, elaboração pessoal, conflito, ansiedade, medo, tristeza, raiva.
- "unclear": ambíguo ou sem confiança suficiente.

Regras:
- risk="high" sempre vence; nesses casos intent deve ser "reflection".
- "preciso" sozinho não define reflexão. "preciso comprar/agendar/pagar/buscar/tomar/levar" tende a practical_log. "preciso decidir/entender/ajuda/resolver como me sinto" tende a reflection.
- Se for ambíguo, use intent="unclear".
- Não explique além de uma razão curta.`;

export interface DiaryRouterDeps {
  generate: (text: string) => Promise<unknown>;
}

const defaultGenerate = async (text: string): Promise<unknown> => {
  const { object } = await generateObject({
    model: anthropic(DIARY_ROUTER_MODEL),
    schema: diaryRouteSchema,
    system: DIARY_ROUTER_SYSTEM_PROMPT,
    prompt: text,
    temperature: 0,
  });
  return object;
};

const defaultDeps: DiaryRouterDeps = { generate: defaultGenerate };

function normalizeRoute(route: DiaryRoute): DiaryRoute {
  if (route.risk === "high") {
    return {
      ...route,
      intent: "reflection",
      confidence: route.confidence === "low" ? "medium" : route.confidence,
    };
  }

  if (route.risk === "none" && route.crisisType !== "none") {
    return { ...route, crisisType: "none" };
  }

  return route;
}

export async function classifyDiaryRoute(
  text: string,
  deps: DiaryRouterDeps = defaultDeps,
): Promise<DiaryRoute> {
  if (!text.trim()) {
    return {
      risk: "none",
      crisisType: "none",
      intent: "unclear",
      confidence: "low",
      reason: "empty_text",
    };
  }

  const raw = await deps.generate(text);
  return normalizeRoute(diaryRouteSchema.parse(raw));
}

export function isHighRisk(route: Pick<DiaryRoute, "risk">): route is DiaryRoute & {
  risk: "high";
  crisisType: CrisisType;
} {
  return route.risk === "high";
}

export function isConfidentPracticalLog(route: Pick<DiaryRoute, "intent" | "confidence">) {
  return route.intent === "practical_log" && route.confidence !== "low";
}

export function toCrisisResult(route: DiaryRoute): { risk: RiskLevel; type: CrisisType } {
  return {
    risk: route.risk,
    type: route.crisisType,
  };
}
