import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { entries, entryThreads, embeddings, crisisEvents } from "@/lib/db/schema";
import {
  DIARY_ENTRY_SAVED_WITHOUT_AI,
  runReflectPipeline,
  createReflectDeps,
} from "@/lib/ai/reflect";
import { embedText } from "@/lib/ai/embeddings";
import {
  bucketLatency,
  bucketTranscriptLength,
  classifyReflectionError,
  createProcessingRequestId,
} from "@/lib/ai/error-classification";
import { recordProductEvent, type ProductEventMetadata } from "@/lib/analytics/product-events";

export const runtime = "nodejs"; // postgres-js + IA precisam do runtime Node
export const dynamic = "force-dynamic";

type EntryMode = "new" | "continue" | "reformulate";

type ReflectBody = {
  transcript?: string;
  language?: string;
  locale?: string;
  entryId?: string;
  segmentId?: string;
  entryMode?: string;
  clientRequestId?: string;
  attempt?: number;
};

type EntryInsertValues = {
  userId: string;
  transcript: string;
  language: string | null;
  reflection?: string | null;
  mood?: string | null;
  riskLevel: string;
};

function normalizeEntryMode(value: string | undefined): EntryMode {
  return value === "continue" || value === "reformulate" ? value : "new";
}

function normalizeAttempt(value: number | undefined) {
  if (!Number.isFinite(value) || !value || value < 1) return 1;
  return Math.min(Math.floor(value), 10);
}

function titleFromText(text: string | null | undefined) {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return "Fio do diário";
  return clean.length > 72 ? `${clean.slice(0, 72).trim()}...` : clean;
}

function summaryFromText(text: string | null | undefined) {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return null;
  return clean.length > 180 ? `${clean.slice(0, 180).trim()}...` : clean;
}

async function insertEntryWithContinuity({
  values,
  entryMode,
  continueFromEntryId,
}: {
  values: EntryInsertValues;
  entryMode: EntryMode;
  continueFromEntryId?: string;
}) {
  return db.transaction(async (tx) => {
    let threadId: string | null = null;
    let threadPosition: number | null = null;
    let continuedFromEntryId: string | null = null;

    if (entryMode === "continue" && continueFromEntryId) {
      const [source] = await tx
        .select({
          id: entries.id,
          transcript: entries.transcript,
          reflection: entries.reflection,
          threadId: entries.threadId,
          threadPosition: entries.threadPosition,
        })
        .from(entries)
        .where(and(eq(entries.id, continueFromEntryId), eq(entries.userId, values.userId)))
        .limit(1);

      if (source) {
        continuedFromEntryId = source.id;

        if (source.threadId) {
          threadId = source.threadId;
          const [lastInThread] = await tx
            .select({ threadPosition: entries.threadPosition })
            .from(entries)
            .where(and(eq(entries.threadId, source.threadId), eq(entries.userId, values.userId)))
            .orderBy(desc(entries.threadPosition))
            .limit(1);
          threadPosition = (lastInThread?.threadPosition ?? source.threadPosition ?? 1) + 1;
        } else {
          const [thread] = await tx
            .insert(entryThreads)
            .values({
              userId: values.userId,
              rootEntryId: source.id,
              title: titleFromText(source.transcript ?? source.reflection),
            })
            .returning({ id: entryThreads.id });

          threadId = thread.id;
          threadPosition = 2;

          await tx
            .update(entries)
            .set({
              threadId,
              threadPosition: 1,
            })
            .where(and(eq(entries.id, source.id), eq(entries.userId, values.userId)));
        }

        await tx
          .update(entryThreads)
          .set({ updatedAt: new Date() })
          .where(and(eq(entryThreads.id, threadId), eq(entryThreads.userId, values.userId)));
      }
    }

    const [entry] = await tx
      .insert(entries)
      .values({
        ...values,
        entryMode,
        threadId,
        threadPosition,
        continuedFromEntryId,
      })
      .returning({ id: entries.id, threadId: entries.threadId });

    if (entry.threadId) {
      await tx
        .update(entryThreads)
        .set({
          summary: summaryFromText(values.reflection ?? values.transcript),
          updatedAt: new Date(),
        })
        .where(and(eq(entryThreads.id, entry.threadId), eq(entryThreads.userId, values.userId)));
    }

    return entry;
  });
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  // Auth: a sessão Supabase identifica o dono (RLS por user_id = auth.uid()).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: ReflectBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const transcript = (body.transcript ?? "").trim();
  if (!transcript) {
    return NextResponse.json({ error: "transcript is required" }, { status: 400 });
  }
  const language = body.language ?? null;
  const locale = body.locale ?? "pt-BR";
  const entryMode = normalizeEntryMode(body.entryMode);
  const continueFromEntryId = typeof body.entryId === "string" ? body.entryId : undefined;
  const requestId =
    typeof body.clientRequestId === "string" && body.clientRequestId.trim()
      ? body.clientRequestId.trim().slice(0, 120)
      : createProcessingRequestId();
  const attempt = normalizeAttempt(body.attempt);
  const baseMetadata: ProductEventMetadata = {
    request_id: requestId,
    provider: "anthropic_openai",
    entry_mode: entryMode,
    transcript_length_bucket: bucketTranscriptLength(transcript),
    attempt,
  };

  await recordProductEvent({
    userId: user.id,
    eventName: "product_reflection_attempted",
    source: "reflect_api",
    metadata: baseMetadata,
  });

  try {
    const result = await runReflectPipeline(
      { text: transcript, locale },
      createReflectDeps(user.id),
    );

    // ── Protocolo de crise (§8): NÃO gera reflexão; registra e devolve recursos.
    if (result.kind === "crisis") {
      const entry = await insertEntryWithContinuity({
        values: {
          userId: user.id,
          transcript,
          language,
          riskLevel: "high",
        },
        entryMode,
        continueFromEntryId,
      });

      await db.insert(crisisEvents).values({
        userId: user.id,
        entryId: entry.id,
        level: "high",
        shownResources: true,
      });

      await recordProductEvent({
        userId: user.id,
        eventName: "product_reflection_succeeded",
        source: "reflect_api",
        metadata: {
          ...baseMetadata,
          status: "crisis",
          risk_level: "high",
          latency_bucket: bucketLatency(Date.now() - startedAt),
        },
      });

      return NextResponse.json({
        status: "crisis",
        risk: "high",
        type: result.type,
        resources: result.resources,
        entryId: entry.id,
        threadId: entry.threadId,
        requestId,
      });
    }

    // ── Caminho normal: salva a entry + embedding e devolve a reflexão.
    const entry = await insertEntryWithContinuity({
      values: {
        userId: user.id,
        transcript,
        language,
        reflection: result.reflection,
        mood: result.mood,
        riskLevel: result.risk,
      },
      entryMode,
      continueFromEntryId,
    });

    // TODO(§5): mover a geração do embedding para o Inngest (assíncrono) e
    // deduplicar com o embedding já calculado no RAG.
    try {
      const vector = await embedText(transcript);
      await db.insert(embeddings).values({
        entryId: entry.id,
        userId: user.id,
        embedding: vector,
      });
    } catch {
      // Falha ao indexar não deve derrubar a reflexão já entregue.
    }

    await recordProductEvent({
      userId: user.id,
      eventName: "product_reflection_succeeded",
      source: "reflect_api",
      metadata: {
        ...baseMetadata,
        status: "ok",
        risk_level: result.risk,
        has_mood: Boolean(result.mood),
        reflection_type: result.mood ? "with_mood" : "without_mood",
        latency_bucket: bucketLatency(Date.now() - startedAt),
      },
    });

    return NextResponse.json({
      status: "ok",
      risk: result.risk,
      reflection: result.reflection,
      mood: result.mood,
      entryId: entry.id,
      threadId: entry.threadId,
      requestId,
    });
  } catch (error) {
    // Não inventa reflexão quando a IA falha, mas não perde a entrada do diário.
    console.error("/api/reflect pipeline error:", error);
    const failure = classifyReflectionError(error);

    try {
      const entry = await insertEntryWithContinuity({
        values: {
          userId: user.id,
          transcript,
          language,
          reflection: DIARY_ENTRY_SAVED_WITHOUT_AI,
          mood: null,
          riskLevel: "none",
        },
        entryMode,
        continueFromEntryId,
      });

      await recordProductEvent({
        userId: user.id,
        eventName: "product_reflection_fallback_saved",
        source: "reflect_api",
        metadata: {
          ...baseMetadata,
          status: String(failure.status),
          error_class: failure.errorClass,
          error_code: failure.errorCode,
          retryable: failure.retryable,
          fallback_saved: true,
          latency_bucket: bucketLatency(Date.now() - startedAt),
        },
      });

      return NextResponse.json({
        status: "ok",
        risk: "none",
        reflection: DIARY_ENTRY_SAVED_WITHOUT_AI,
        mood: null,
        entryId: entry.id,
        threadId: entry.threadId,
        requestId,
        fallbackSaved: true,
      });
    } catch (saveError) {
      console.error("/api/reflect fallback save error:", saveError);
      const saveFailure = classifyReflectionError(saveError);
      await recordProductEvent({
        userId: user.id,
        eventName: "product_reflection_failed",
        source: "reflect_api",
        metadata: {
          ...baseMetadata,
          status: String(saveFailure.status),
          error_class: saveFailure.errorClass,
          error_code: saveFailure.errorCode,
          retryable: saveFailure.retryable,
          fallback_saved: false,
          latency_bucket: bucketLatency(Date.now() - startedAt),
        },
      });
      return NextResponse.json(
        {
          error: "pipeline_failed",
          errorCode: saveFailure.errorCode,
          errorClass: saveFailure.errorClass,
          retryable: saveFailure.retryable,
          requestId,
          userMessage: saveFailure.userMessage,
        },
        { status: saveFailure.status },
      );
    }
  }
}
