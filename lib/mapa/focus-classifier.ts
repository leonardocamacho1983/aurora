import { z } from "zod";
import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { FOCUS_KEYS, focusDefinitions, getFocusDefinition, type FocusKey, type FocusSignal } from "./focus";

export const MAPA_FOCUS_MODEL = "claude-haiku-4-5";
export const MAPA_FOCUS_CONFIDENCE = ["low", "medium", "high"] as const;
export const MAPA_FOCUS_CHOICES = [...FOCUS_KEYS, "none"] as const;
export const MAPA_FOCUS_REASON_STORAGE_MAX_LENGTH = 120;

export type MapaFocusConfidence = (typeof MAPA_FOCUS_CONFIDENCE)[number];
export type ClassifiedFocusKey = FocusKey | "none";

export type EntryFocusInput = {
  transcript?: string | null;
  reflection?: string | null;
  mood?: string | null;
};

export type EntryFocusStorageValues = {
  focusKey: FocusKey | null;
  focusConfidence: MapaFocusConfidence | null;
  focusReason: string | null;
  focusEvidence: string[] | null;
  focusClassifiedAt: Date | null;
};

export const mapaFocusClassificationSchema = z.object({
  focus: z.enum(MAPA_FOCUS_CHOICES),
  confidence: z.enum(MAPA_FOCUS_CONFIDENCE),
  reason: z.string().max(320),
  evidence: z.array(z.string().max(120)).max(3).default([]),
});

export type MapaFocusClassification = z.infer<typeof mapaFocusClassificationSchema>;

const focusListForPrompt = focusDefinitions()
  .map((focus) => `- ${focus.key}: ${focus.description}`)
  .join("\n");

export const MAPA_FOCUS_SYSTEM_PROMPT = `Você classifica uma entrada de diário da Aurora em um Foco do Mapa.

Focos possíveis:
${focusListForPrompt}
- none: use quando não houver tema claro, quando for só um registro prático solto, ou quando a evidência for fraca.

Regras:
- Classifique pelo significado da entrada e da reflexão, não por palavra isolada.
- Palavras amplas como tempo, vida, direção, dor, mercado ou caminho não bastam sozinhas.
- Se houver mais de um foco, escolha o mais central para a pessoa naquele registro.
- Primeiro tente um foco concreto. Não use fase-autoconhecimento como fallback para textos reflexivos.
- carreira-direcao vence quando o centro for trabalho, projeto, cliente, carreira ou direção profissional.
- foco-organizacao vence quando o centro for rotina, foco, tempo, clareza, organização ou próximo passo prático.
- relacoes-decisoes vence quando o centro for conversa, família, parceria, vínculo, consequência ou decisão com outra pessoa.
- sono-descanso vence quando o centro for sono, cansaço, corpo, ansiedade, peso, desligar ou regulação.
- fase-autoconhecimento só entra quando houver fase de vida, identidade, padrão pessoal recorrente ou entendimento emocional como tema central.
- Reflexão genérica sobre vida, sensação ampla ou pensamento solto sem padrão concreto deve ser none.
- Use confidence="high" só quando o foco for evidente.
- Use confidence="high" em fase-autoconhecimento só quando o padrão/fase pessoal estiver explícito.
- Use confidence="medium" quando o foco for plausível, mas ainda depender de contexto.
- Use confidence="low" quando a decisão for fraca; nesses casos prefira focus="none".
- Não faça diagnóstico, não dê conselho e não invente detalhes.
- reason deve ter até 90 caracteres, em linguagem curta de produto, sem repetir conteúdo íntimo da pessoa.
- evidence deve conter 1 a 3 rótulos curtos, não trechos literais íntimos.`;

export interface MapaFocusClassifierDeps {
  generate: (input: EntryFocusInput) => Promise<unknown>;
}

function cleanText(value: string | null | undefined, max = 900) {
  return (value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function hasClassifiableText(input: EntryFocusInput) {
  return Boolean(cleanText(input.transcript) || cleanText(input.reflection));
}

export function formatEntryFocusPrompt(input: EntryFocusInput) {
  const transcript = cleanText(input.transcript);
  const reflection = cleanText(input.reflection);
  const mood = cleanText(input.mood, 80);

  return [
    transcript ? `Entrada: ${transcript}` : "",
    reflection ? `Resposta da Aurora: ${reflection}` : "",
    mood ? `Humor sugerido: ${mood}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

const defaultGenerate = async (input: EntryFocusInput): Promise<unknown> => {
  const { object } = await generateObject({
    model: anthropic(MAPA_FOCUS_MODEL),
    schema: mapaFocusClassificationSchema,
    system: MAPA_FOCUS_SYSTEM_PROMPT,
    prompt: formatEntryFocusPrompt(input),
    temperature: 0,
  });
  return object;
};

const defaultDeps: MapaFocusClassifierDeps = { generate: defaultGenerate };

const EMPTY_FOCUS_STORAGE: EntryFocusStorageValues = {
  focusKey: null,
  focusConfidence: null,
  focusReason: null,
  focusEvidence: null,
  focusClassifiedAt: null,
};

function withConciseReason(
  classification: MapaFocusClassification,
  fallbackReason: string,
): MapaFocusClassification {
  return {
    ...classification,
    reason: (classification.reason || fallbackReason).slice(0, MAPA_FOCUS_REASON_STORAGE_MAX_LENGTH),
  };
}

export async function classifyEntryFocus(
  input: EntryFocusInput,
  deps: MapaFocusClassifierDeps = defaultDeps,
): Promise<MapaFocusClassification> {
  if (!hasClassifiableText(input)) {
    return {
      focus: "none",
      confidence: "low",
      reason: "empty_text",
      evidence: [],
    };
  }

  const raw = await deps.generate(input);
  const result = mapaFocusClassificationSchema.parse(raw);

  if (result.focus === "none" && result.confidence !== "low") {
    return withConciseReason({
      ...result,
      confidence: "low",
    }, "no_focus");
  }

  if (result.confidence === "low" && result.focus !== "none") {
    return withConciseReason({
      ...result,
      focus: "none",
    }, "low_confidence");
  }

  return withConciseReason(result, "classified");
}

export function focusClassificationToSignal(classification: MapaFocusClassification): FocusSignal | null {
  if (classification.focus === "none" || classification.confidence === "low") return null;

  const definition = getFocusDefinition(classification.focus);
  if (!definition) return null;

  return {
    key: definition.key,
    label: definition.label,
    color: definition.color,
    score: classification.confidence === "high" ? 3 : 2,
  };
}

export function focusClassificationToStorageValues(
  classification: MapaFocusClassification,
  classifiedAt = new Date(),
): EntryFocusStorageValues {
  return {
    focusKey: classification.focus === "none" ? null : classification.focus,
    focusConfidence: classification.confidence,
    focusReason: classification.reason ? classification.reason.slice(0, MAPA_FOCUS_REASON_STORAGE_MAX_LENGTH) : null,
    focusEvidence: classification.evidence.length ? classification.evidence.map((item) => item.slice(0, 120)) : null,
    focusClassifiedAt: classifiedAt,
  };
}

export async function classifyEntryFocusForStorage(
  input: EntryFocusInput,
  deps: MapaFocusClassifierDeps = defaultDeps,
): Promise<EntryFocusStorageValues> {
  try {
    return focusClassificationToStorageValues(await classifyEntryFocus(input, deps));
  } catch (error) {
    console.error("entry focus classification failed:", {
      name: error instanceof Error ? error.name : "unknown_error",
    });
    return EMPTY_FOCUS_STORAGE;
  }
}
