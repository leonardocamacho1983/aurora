import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { entries, embeddings, crisisEvents } from "@/lib/db/schema";
import { runReflectPipeline, createReflectDeps } from "@/lib/ai/reflect";
import { getCrisisResources } from "@/lib/ai/crisis-resources";
import { embedText } from "@/lib/ai/embeddings";
import { bucketLatency } from "@/lib/ai/error-classification";
import { recordProductEvent, type ProductEventMetadata } from "@/lib/analytics/product-events";
import {
  classifyDiaryRoute,
  isConfidentPracticalLog,
  isHighRisk,
  toCrisisResult,
} from "@/lib/ai/diary-router";

export const runtime = "nodejs"; // postgres-js + IA precisam do runtime Node
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ENTRY_MODES = new Set(["new", "continue", "reformulate"]);

function transcriptLengthBucket(text: string) {
  const words = wordCount(text);
  if (words < 10) return "lt_10w";
  if (words < 40) return "lt_40w";
  if (words < 80) return "lt_80w";
  return "gte_80w";
}

function cleanEntryMode(value: unknown) {
  return typeof value === "string" && ENTRY_MODES.has(value) ? value : "new";
}

async function entryBelongsToUser(userId: string, entryId: string) {
  const rows = await db
    .select({ id: entries.id })
    .from(entries)
    .where(and(eq(entries.id, entryId), eq(entries.userId, userId)))
    .limit(1);
  return rows.length > 0;
}

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

async function shouldUseRag({
  userId,
  text,
  entryMode,
}: {
  userId: string;
  text: string;
  entryMode: string;
}) {
  if (entryMode === "continue" || entryMode === "reformulate") return true;
  if (wordCount(text) >= 80) return true;

  const [stats] = await db.execute<{ reflectedEntries: number }>(sql`
    select count(*) filter (
      where reflection is not null and nullif(trim(reflection), '') is not null
    )::int as "reflectedEntries"
    from entries
    where user_id = ${userId}::uuid
  `);

  return Number(stats?.reflectedEntries ?? 0) >= 2;
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

  let body: {
    transcript?: string;
    language?: string;
    locale?: string;
    entryId?: unknown;
    entryMode?: unknown;
    clientRequestId?: string;
    forceReflection?: boolean;
  };
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
  const requestId = body.clientRequestId;
  const entryMode = cleanEntryMode(body.entryMode);
  const baseMetadata: ProductEventMetadata = {
    request_id: requestId,
    entry_mode: entryMode,
    transcript_length_bucket: transcriptLengthBucket(transcript),
  };
  const previousEntryId = typeof body.entryId === "string" ? body.entryId.trim() : "";
  if (previousEntryId && !UUID_RE.test(previousEntryId)) {
    return NextResponse.json({ error: "invalid entryId" }, { status: 400 });
  }
  if (previousEntryId && !(await entryBelongsToUser(user.id, previousEntryId))) {
    return NextResponse.json({ error: "entry not found" }, { status: 404 });
  }
  const continuedFromEntryId = entryMode === "new" ? null : previousEntryId || null;

  try {
    await recordProductEvent({
      userId: user.id,
      eventName: "product_reflection_attempted",
      source: "reflect_api",
      metadata: baseMetadata,
    });

    const routeStartedAt = Date.now();
    const route = await classifyDiaryRoute(transcript);
    const routeLatencyBucket = bucketLatency(Date.now() - routeStartedAt);

    await recordProductEvent({
      userId: user.id,
      eventName: "product_reflection_routed",
      source: "reflect_api",
      metadata: {
        ...baseMetadata,
        route_intent: route.intent,
        route_confidence: route.confidence,
        risk_level: route.risk,
        route_latency_bucket: routeLatencyBucket,
      },
    });

    // ── Protocolo de crise (§8): roda antes de qualquer decisão de silêncio.
    if (isHighRisk(route)) {
      const [entry] = await db
        .insert(entries)
        .values({
          userId: user.id,
          transcript,
          language,
          riskLevel: "high",
          entryMode,
          continuedFromEntryId,
        })
        .returning({ id: entries.id });

      await db.insert(crisisEvents).values({
        userId: user.id,
        entryId: entry.id,
        level: "high",
        shownResources: true,
      });

      return NextResponse.json({
        status: "crisis",
        risk: "high",
        type: route.crisisType,
        resources: getCrisisResources(locale),
        entryId: entry.id,
        requestId,
      });
    }

    if (!body.forceReflection && isConfidentPracticalLog(route)) {
      return NextResponse.json({
        status: "routine",
        intent: "routine_log",
        reason: route.reason,
        confidence: route.confidence,
        requestId,
      });
    }

    const deps = createReflectDeps(user.id);
    const useRag = await shouldUseRag({ userId: user.id, text: transcript, entryMode });
    const result = await runReflectPipeline(
      { text: transcript, locale, useRag },
      {
        ...deps,
        classify: async () => toCrisisResult(route),
      },
    );

    // Mantém o contrato defensivo caso a implementação do pipeline mude.
    if (result.kind === "crisis") {
      const [entry] = await db
        .insert(entries)
        .values({
          userId: user.id,
          transcript,
          language,
          riskLevel: "high",
          entryMode,
          continuedFromEntryId,
        })
        .returning({ id: entries.id });

      await db.insert(crisisEvents).values({
        userId: user.id,
        entryId: entry.id,
        level: "high",
        shownResources: true,
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
        entryMode,
        continuedFromEntryId,
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
        route_intent: route.intent,
        route_confidence: route.confidence,
        route_latency_bucket: routeLatencyBucket,
        total_latency_bucket: bucketLatency(Date.now() - startedAt),
        rag_used: useRag,
        has_mood: Boolean(result.mood),
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
    // Fail-loud: classificador/pipeline falhou → NÃO inventamos reflexão (§13).
    console.error("/api/reflect pipeline error:", error);
    await recordProductEvent({
      userId: user.id,
      eventName: "product_reflection_failed",
      source: "reflect_api",
      metadata: {
        ...baseMetadata,
        status: "500",
        error_code: "pipeline_failed",
        error_class: "network_or_unknown",
        total_latency_bucket: bucketLatency(Date.now() - startedAt),
      },
    });
    return NextResponse.json({ error: "pipeline_failed" }, { status: 500 });
  }
}
