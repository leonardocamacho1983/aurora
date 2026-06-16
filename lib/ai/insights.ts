import { z } from "zod";
import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";

// Insights da timeline (§6.5) — Claude Haiku 4.5, UMA chamada estruturada.
export const INSIGHTS_MODEL = "claude-haiku-4-5";

export const INSIGHTS_SYSTEM_PROMPT = `Você é a Aurora. A partir das entradas recentes da pessoa, devolva:
- "main": UMA frase curta e calorosa (pt-BR, até ~20 palavras) com o fio ou padrão principal da semana.
- "secondary": 2 a 3 frases curtas, gentis e específicas (um padrão, uma palavra recorrente, um contraste), cada uma autossuficiente.
Sem diagnóstico, sem conselho, sem clichê de coach, sem rótulo "IA:", sem aspas.`;

export interface InsightSource {
  transcript: string | null;
  reflection: string | null;
  mood: string | null;
}

export interface Insights {
  main: string;
  secondary: string[];
}

const FALLBACK: Insights = {
  main: "Sua semana está só começando. Toque no orb quando quiser falar.",
  secondary: [],
};

const schema = z.object({
  main: z.string(),
  secondary: z.array(z.string()).max(3),
});

/** Gera insights das entradas recentes. < 2 entradas → fallback sem chamar a IA. */
export async function generateInsights(entries: InsightSource[]): Promise<Insights> {
  if (entries.length < 2) return FALLBACK;

  const lines = entries
    .slice(0, 12)
    .map((e, i) => {
      const text = (e.transcript ?? e.reflection ?? "").replace(/\s+/g, " ").slice(0, 400);
      return `${i + 1}. ${text}${e.mood ? ` [humor: ${e.mood}]` : ""}`;
    })
    .join("\n");

  const { object } = await generateObject({
    model: anthropic(INSIGHTS_MODEL),
    schema,
    system: INSIGHTS_SYSTEM_PROMPT,
    prompt: `Entradas recentes da pessoa:\n${lines}`,
    temperature: 0.5,
  });

  return {
    main: object.main.trim() || FALLBACK.main,
    secondary: object.secondary.map((s) => s.trim()).filter(Boolean).slice(0, 3),
  };
}
