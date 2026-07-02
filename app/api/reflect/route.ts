import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { entries, embeddings, crisisEvents } from "@/lib/db/schema";
import { runReflectPipeline, createReflectDeps } from "@/lib/ai/reflect";
import { classifyCrisis } from "@/lib/ai/crisis-classifier";
import { getCrisisResources } from "@/lib/ai/crisis-resources";
import { embedText } from "@/lib/ai/embeddings";
import { classifyEntryIntent } from "@/lib/diary/entry-intent";

export const runtime = "nodejs"; // postgres-js + IA precisam do runtime Node
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ENTRY_MODES = new Set(["new", "continue", "reformulate"]);

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

export async function POST(request: Request) {
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
  const previousEntryId = typeof body.entryId === "string" ? body.entryId.trim() : "";
  if (previousEntryId && !UUID_RE.test(previousEntryId)) {
    return NextResponse.json({ error: "invalid entryId" }, { status: 400 });
  }
  if (previousEntryId && !(await entryBelongsToUser(user.id, previousEntryId))) {
    return NextResponse.json({ error: "entry not found" }, { status: 404 });
  }
  const continuedFromEntryId = entryMode === "new" ? null : previousEntryId || null;

  try {
    const crisis = await classifyCrisis(transcript);

    // ── Protocolo de crise (§8): roda antes de qualquer decisão de silêncio.
    if (crisis.risk === "high") {
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
        type: crisis.type,
        resources: getCrisisResources(locale),
        entryId: entry.id,
        requestId,
      });
    }

    const entryIntent = await classifyEntryIntent(transcript);
    if (!body.forceReflection && entryIntent.intent === "routine_log") {
      return NextResponse.json({
        status: "routine",
        intent: entryIntent.intent,
        reason: entryIntent.reason,
        confidence: entryIntent.confidence,
        requestId,
      });
    }

    const deps = createReflectDeps(user.id);
    const result = await runReflectPipeline(
      { text: transcript, locale },
      {
        ...deps,
        classify: async () => crisis,
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
    return NextResponse.json({ error: "pipeline_failed" }, { status: 500 });
  }
}
