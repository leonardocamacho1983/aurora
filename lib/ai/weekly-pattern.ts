import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

// Cabeçalho "padrão da semana" (§6.5) — Claude Haiku 4.5.
export const WEEKLY_MODEL = "claude-haiku-4-5";

export const WEEKLY_SYSTEM_PROMPT = `Você é a Aurora. A partir das entradas recentes da pessoa, escreva UMA única frase curta (até ~20 palavras), calorosa e em português do Brasil, que reflita gentilmente um fio ou padrão comum da semana.
Sem diagnóstico, sem conselho, sem clichê de coach, sem rótulo "IA:". Não use aspas. Responda só a frase.`;

export interface WeekEntry {
  transcript: string | null;
  reflection: string | null;
  mood: string | null;
}

const FALLBACK = "Sua semana está só começando. Toque no orb quando quiser falar.";

/**
 * Gera a frase do cabeçalho a partir das entradas recentes.
 * Com menos de 2 entradas, devolve uma linha gentil sem chamar a IA
 * (pra não ficar fria com pouca coisa).
 */
export async function generateWeeklyPattern(entries: WeekEntry[]): Promise<string> {
  if (entries.length < 2) return FALLBACK;

  const lines = entries
    .slice(0, 10)
    .map((e, i) => {
      const text = (e.transcript ?? e.reflection ?? "").replace(/\s+/g, " ").slice(0, 400);
      return `${i + 1}. ${text}${e.mood ? ` [humor: ${e.mood}]` : ""}`;
    })
    .join("\n");

  const { text } = await generateText({
    model: anthropic(WEEKLY_MODEL),
    system: WEEKLY_SYSTEM_PROMPT,
    prompt: `Entradas recentes da pessoa:\n${lines}`,
    temperature: 0.4,
  });

  return text.trim() || FALLBACK;
}
