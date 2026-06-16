import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { entries, embeddings, crisisEvents } from "@/lib/db/schema";
import { runReflectPipeline, createReflectDeps } from "@/lib/ai/reflect";
import { embedText } from "@/lib/ai/embeddings";

export const runtime = "nodejs"; // postgres-js + IA precisam do runtime Node
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Auth: a sessão Supabase identifica o dono (RLS por user_id = auth.uid()).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { transcript?: string; language?: string; locale?: string };
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

      return NextResponse.json({
        status: "crisis",
        risk: "high",
        type: result.type,
        resources: result.resources,
        entryId: entry.id,
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

    return NextResponse.json({
      status: "ok",
      risk: result.risk,
      reflection: result.reflection,
      mood: result.mood,
      entryId: entry.id,
    });
  } catch (error) {
    // Fail-loud: classificador/pipeline falhou → NÃO inventamos reflexão (§13).
    console.error("/api/reflect pipeline error:", error);
    return NextResponse.json({ error: "pipeline_failed" }, { status: 500 });
  }
}
