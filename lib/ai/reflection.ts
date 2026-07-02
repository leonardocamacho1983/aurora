import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import type { RagSnippet } from "./embeddings";
import { MOODS, type Mood } from "./mood";

// Reflexão (§5) — Claude Sonnet 4.6.
export const REFLECTION_MODEL = "claude-sonnet-4-6";

const reflectionResultSchema = z.object({
  reflection: z.string().min(1),
  mood: z.enum([...MOODS, "none"]),
});

export type ReflectionResult = {
  reflection: string;
  mood: Mood | null;
};

// System prompt da reflexão (handoff §5, verbatim).
export const REFLECTION_SYSTEM_PROMPT = `Você é a Aurora, uma presença calma que ajuda a pessoa a refletir sobre o que ela acabou de falar no diário. Você NÃO é terapeuta, não diagnostica, não dá conselho nem ordem. Você acolhe.

Responda SEMPRE no mesmo idioma da entrada da pessoa.

Sua reflexão é curta (2–4 frases) e faz três coisas, nesta ordem:
1. Reflete de volta, em poucas palavras, o que parece estar no centro — nomeando a emoção quando fizer sentido.
2. Aponta um padrão concreto se houver (ex.: uma palavra repetida, uma distorção como "deveria"/"sempre"/"nunca"), de forma gentil, sem rótulo técnico.
3. Termina com UMA pergunta aberta, de autocompaixão ou de perspectiva. Nunca mais de uma pergunta.

Use molduras de TCC e ACT como lente para a boa pergunta, jamais como jargão. Tom: caloroso, íntimo, sem clichê de coach, sem "que lindo que você compartilhou", sem se vender. Nunca use rótulo "IA:". Nunca prometa cura. Se a pessoa parecer em sofrimento agudo, não tente resolver — acolha e o sistema cuidará dos recursos.

Também sugira o humor predominante escolhendo um entre: leve, calmo, pesado, sensível, ansioso. Use "none" se não der para dizer com confiança.`;

function buildPrompt(text: string, context: RagSnippet[]): string {
  const ctx =
    context.length > 0
      ? `Trechos relevantes do histórico desta pessoa (contexto, NÃO cite literalmente):\n${context
          .map((c) => `- ${c.content}`)
          .join("\n")}\n\n`
      : "";
  return `${ctx}O que a pessoa acabou de falar:\n${text}`;
}

/**
 * Gera a reflexão da Aurora e sugere humor em uma única chamada.
 * Contexto = trechos do RAG (não o histórico inteiro).
 * Prompt caching (§5): system+persona marcados como `ephemeral` para reaproveitar
 * o prefixo entre requisições (90% off no input cacheado). O contexto do RAG e a
 * entrada ficam na mensagem do usuário (parte volátil), depois do prefixo cacheável.
 */
export async function generateReflectionResult(
  text: string,
  context: RagSnippet[],
): Promise<ReflectionResult> {
  const { object } = await generateObject({
    model: anthropic(REFLECTION_MODEL),
    schema: reflectionResultSchema,
    messages: [
      {
        role: "system",
        content: REFLECTION_SYSTEM_PROMPT,
        providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } },
      },
      { role: "user", content: buildPrompt(text, context) },
    ],
  });
  return {
    reflection: object.reflection.trim(),
    mood: object.mood === "none" ? null : object.mood,
  };
}

export async function generateReflection(
  text: string,
  context: RagSnippet[],
): Promise<string> {
  const result = await generateReflectionResult(text, context);
  return result.reflection;
}
