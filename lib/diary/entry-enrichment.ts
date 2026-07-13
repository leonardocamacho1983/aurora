import { after } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { entries, embeddings } from "@/lib/db/schema";
import { embedText } from "@/lib/ai/embeddings";
import { bucketLatency } from "@/lib/ai/error-classification";
import { recordProductEvent } from "@/lib/analytics/product-events";
import { classifyEntryFocusForStorage, type EntryFocusInput } from "@/lib/mapa/focus-classifier";

type EntryEnrichmentInput = EntryFocusInput & {
  entryId: string;
  userId: string;
  requestId?: string;
  entryMode?: string;
  source: "reflect_api" | "entries_api";
};

async function indexEntryEmbedding({
  entryId,
  userId,
  transcript,
}: {
  entryId: string;
  userId: string;
  transcript?: string | null;
}) {
  if (!transcript?.trim()) return false;

  try {
    const vector = await embedText(transcript);
    await db.insert(embeddings).values({
      entryId,
      userId,
      embedding: vector,
    });
    return true;
  } catch (error) {
    console.error("entry enrichment embedding failed:", {
      name: error instanceof Error ? error.name : "unknown_error",
    });
    return false;
  }
}

async function runEntryEnrichment(input: EntryEnrichmentInput) {
  const startedAt = Date.now();
  const [focus, embeddingIndexed] = await Promise.all([
    classifyEntryFocusForStorage({
      transcript: input.transcript,
      reflection: input.reflection,
      mood: input.mood,
    }),
    indexEntryEmbedding({
      entryId: input.entryId,
      userId: input.userId,
      transcript: input.transcript,
    }),
  ]);

  let focusStored = false;
  try {
    await db
      .update(entries)
      .set(focus)
      .where(and(eq(entries.id, input.entryId), eq(entries.userId, input.userId)));
    focusStored = true;
  } catch (error) {
    console.error("entry enrichment focus update failed:", {
      name: error instanceof Error ? error.name : "unknown_error",
    });
  }

  const status = focusStored && embeddingIndexed ? "ok" : "partial";
  await recordProductEvent({
    userId: input.userId,
    eventName: status === "ok" ? "product_diary_enrichment_succeeded" : "product_diary_enrichment_failed",
    source: input.source,
    metadata: {
      status,
      request_id: input.requestId,
      entry_mode: input.entryMode,
      focus_key: focus.focusKey,
      focus_confidence: focus.focusConfidence,
      has_focus: Boolean(focus.focusKey),
      latency_bucket: bucketLatency(Date.now() - startedAt),
    },
  });
}

export function enrichEntryAfterResponse(input: EntryEnrichmentInput) {
  try {
    after(() => runEntryEnrichment(input));
    return true;
  } catch (error) {
    console.error("entry enrichment scheduling failed:", {
      name: error instanceof Error ? error.name : "unknown_error",
    });
    return false;
  }
}
