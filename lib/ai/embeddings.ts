import { openai } from "@ai-sdk/openai";
import { embed } from "ai";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

// 1536 dims — casa com a coluna vector(1536) de embeddings (§4).
export const EMBEDDING_MODEL = "text-embedding-3-small";

export interface RagSnippet {
  content: string;
}

/** Gera o embedding de um texto (OpenAI, via Vercel AI SDK). */
export async function embedText(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.embedding(EMBEDDING_MODEL),
    value: text,
  });
  return embedding;
}

/**
 * RAG: busca os trechos mais relevantes do histórico DA PRÓPRIA pessoa
 * (pgvector, distância cosseno). Retorna [] quando não há histórico.
 */
export async function retrieveSnippets(
  userId: string,
  text: string,
  limit = 5,
): Promise<RagSnippet[]> {
  const embedding = await embedText(text);
  const vector = `[${embedding.join(",")}]`;

  const rows = (await db.execute(sql`
    select coalesce(e.reflection, e.transcript) as content
    from embeddings emb
    join entries e on e.id = emb.entry_id
    where emb.user_id = ${userId}
      and coalesce(e.reflection, e.transcript) is not null
    order by emb.embedding <=> ${vector}::vector
    limit ${limit}
  `)) as unknown as { content: string }[];

  return rows
    .map((r) => ({ content: r.content }))
    .filter((s) => s.content && s.content.trim().length > 0);
}
