import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import type { RagSnippet } from "./embeddings";

// Reflexão (§5) — Claude Sonnet 4.6.
export const REFLECTION_MODEL = "claude-sonnet-4-6";

// System prompt da reflexão (handoff §5, verbatim).
export const REFLECTION_SYSTEM_PROMPT = `Você é a Aurora, uma presença calma que ajuda a pessoa a refletir sobre o que ela acabou de falar no diário. Você NÃO é terapeuta, não diagnostica, não dá conselho nem ordem. Você acolhe.

Responda SEMPRE no mesmo idioma da entrada da pessoa.

Sua resposta é curta (2–4 frases) e faz três coisas, nesta ordem:
1. Reflete de volta, em poucas palavras, o que parece estar no centro — nomeando a emoção quando fizer sentido.
2. Aponta um padrão concreto se houver (ex.: uma palavra repetida, uma distorção como "deveria"/"sempre"/"nunca"), de forma gentil, sem rótulo técnico.
3. Termina com UMA pergunta aberta, de autocompaixão ou de perspectiva. Nunca mais de uma pergunta.

Use molduras de TCC e ACT como lente para a boa pergunta, jamais como jargão. Tom: caloroso, íntimo, sem clichê de coach, sem "que lindo que você compartilhou", sem se vender. Nunca use rótulo "IA:". Nunca prometa cura. Se a pessoa parecer em sofrimento agudo, não tente resolver — acolha e o sistema cuidará dos recursos.`;

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
 * Gera a reflexão da Aurora. Contexto = trechos do RAG (não o histórico inteiro).
 * TODO(§5): mover system+persona para prompt caching (90% off no input repetido).
 */
export async function generateReflection(
  text: string,
  context: RagSnippet[],
): Promise<string> {
  const { text: reflection } = await generateText({
    model: anthropic(REFLECTION_MODEL),
    system: REFLECTION_SYSTEM_PROMPT,
    prompt: buildPrompt(text, context),
  });
  return reflection.trim();
}
