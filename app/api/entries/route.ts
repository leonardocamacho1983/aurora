import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { entries, embeddings, crisisEvents } from "@/lib/db/schema";
import { classifyCrisis } from "@/lib/ai/crisis-classifier";
import { getCrisisResources } from "@/lib/ai/crisis-resources";
import { embedText } from "@/lib/ai/embeddings";
import { recordProductEvent } from "@/lib/analytics/product-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TRANSCRIPT_LENGTH = 12_000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ENTRY_MODES = new Set(["new", "continue", "reformulate"]);

function bodyString(value: unknown, maxLength = 180) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanEntryMode(value: unknown) {
  const mode = bodyString(value, 40);
  return ENTRY_MODES.has(mode) ? mode : "new";
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: {
    transcript?: unknown;
    language?: unknown;
    locale?: unknown;
    clientRequestId?: unknown;
    entryId?: unknown;
    entryMode?: unknown;
    intent?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const transcript = bodyString(body.transcript, MAX_TRANSCRIPT_LENGTH);
  if (!transcript) {
    return NextResponse.json({ error: "transcript is required" }, { status: 400 });
  }

  const language = bodyString(body.language, 40) || null;
  const locale = bodyString(body.locale, 40) || "pt-BR";
  const requestId = bodyString(body.clientRequestId, 120) || undefined;
  const entryMode = cleanEntryMode(body.entryMode);
  const previousEntryId = bodyString(body.entryId, 80);
  if (previousEntryId && !UUID_RE.test(previousEntryId)) {
    return NextResponse.json({ error: "invalid entryId" }, { status: 400 });
  }
  if (previousEntryId && !(await entryBelongsToUser(user.id, previousEntryId))) {
    return NextResponse.json({ error: "entry not found" }, { status: 404 });
  }
  const continuedFromEntryId = entryMode === "new" ? null : previousEntryId || null;
  const intent = bodyString(body.intent, 80) || "routine_log";

  try {
    const crisis = await classifyCrisis(transcript);

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

      await recordProductEvent({
        userId: user.id,
        eventName: "product_diary_silent_save_succeeded",
        source: "entries_api",
        metadata: {
          status: "crisis",
          risk_level: "high",
          request_id: requestId,
          entry_mode: entryMode,
          intent,
        },
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

    const [entry] = await db
      .insert(entries)
      .values({
        userId: user.id,
        transcript,
        language,
        riskLevel: crisis.risk,
        entryMode,
        continuedFromEntryId,
      })
      .returning({ id: entries.id });

    try {
      const vector = await embedText(transcript);
      await db.insert(embeddings).values({
        entryId: entry.id,
        userId: user.id,
        embedding: vector,
      });
    } catch {
      // Silent-save must still succeed when background indexing fails.
    }

    await recordProductEvent({
      userId: user.id,
      eventName: "product_diary_silent_save_succeeded",
      source: "entries_api",
      metadata: {
        status: "ok",
        risk_level: crisis.risk,
        request_id: requestId,
        entry_mode: entryMode,
        intent,
      },
    });

    return NextResponse.json({
      status: "ok",
      entryId: entry.id,
      requestId,
    });
  } catch (error) {
    console.error("/api/entries save-only error:", error);
    return NextResponse.json({ error: "pipeline_failed" }, { status: 500 });
  }
}
