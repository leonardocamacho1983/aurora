import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { entries, embeddings, crisisEvents } from "@/lib/db/schema";
import { runReflectPipeline, createReflectDeps } from "@/lib/ai/reflect";
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

type ReflectBody = {
  transcript?: string;
  language?: string;
  locale?: string;
  entryMode?: string;
  clientRequestId?: string;
  attempt?: number;
};

const DIARY_ENTRY_SAVED_WITHOUT_AI =
  "Seu registro foi guardado no diário. A Aurora não conseguiu preparar uma leitura agora, mas a entrada ficou salva na sua Timeline para você consultar quando quiser.";

function normalizeAttempt(value: number | undefined) {
  if (!Number.isFinite(value) || !value || value < 1) return 1;
  return Math.min(Math.floor(value), 10);
}

function normalizeEntryMode(value: string | undefined) {
  return value === "continue" || value === "reformulate" ? value : "new";
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
      const [entry] = await db
        .insert(entries)
        .values({
          userId: user.id,
          transcript,
          language,
          riskLevel: "high",
        })
        .returning({ id: entries.id });

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
        requestId,
      });
    }

    // ── Caminho normal: salva a entry + embedding e devolve a reflexão.
    const [entry] = await db
      .insert(entries)
      .values({
        userId: user.id,
        transcript,
        language,
        reflection: result.reflection,
        mood: result.mood,
        riskLevel: result.risk,
      })
      .returning({ id: entries.id });

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
      requestId,
    });
  } catch (error) {
    // Não inventa reflexão quando a IA falha, mas não perde a entrada do diário.
    console.error("/api/reflect pipeline error:", error);
    const failure = classifyReflectionError(error);

    try {
      const [entry] = await db
        .insert(entries)
        .values({
          userId: user.id,
          transcript,
          language,
          reflection: DIARY_ENTRY_SAVED_WITHOUT_AI,
          mood: null,
          riskLevel: "none",
        })
        .returning({ id: entries.id });

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
