import { z } from "zod";
import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";

// Humor/tags (§5) — Claude Haiku 4.5. Sugestão; o usuário confirma (é opcional).
export const MOOD_MODEL = "claude-haiku-4-5";

// Humores do design system / §4 (entries.mood). "none" quando não dá pra dizer.
export const MOODS = ["leve", "calmo", "pesado", "sensível", "ansioso"] as const;
export type Mood = (typeof MOODS)[number];

const moodSchema = z.object({
  mood: z.enum([...MOODS, "none"]),
});

export const MOOD_SYSTEM_PROMPT = `Sugira o humor predominante do texto, escolhendo um entre: leve, calmo, pesado, sensível, ansioso. Use "none" se não der pra dizer com confiança. Não explique.`;

/** Sugere um humor (ou null). Nunca decide pela pessoa — é só sugestão. */
export async function suggestMood(text: string): Promise<Mood | null> {
  const { object } = await generateObject({
    model: anthropic(MOOD_MODEL),
    schema: moodSchema,
    system: MOOD_SYSTEM_PROMPT,
    prompt: text,
    temperature: 0,
  });
  return object.mood === "none" ? null : object.mood;
}
