import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { entries } from "@/lib/db/schema";
import { MOODS } from "@/lib/ai/mood";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PATCH /api/entries/[id] — atualiza transcrição e/ou humor da PRÓPRIA entrada.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { transcript?: unknown; mood?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const updates: { transcript?: string; mood?: string | null } = {};

  if (typeof body.transcript === "string") {
    updates.transcript = body.transcript.trim();
  }
  if ("mood" in body) {
    const m = body.mood;
    if (m === null || (typeof m === "string" && (MOODS as readonly string[]).includes(m))) {
      updates.mood = m;
    } else {
      return NextResponse.json({ error: "invalid mood" }, { status: 400 });
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }

  // Ownership no WHERE (a conexão direta do drizzle ignora RLS).
  const rows = await db
    .update(entries)
    .set(updates)
    .where(and(eq(entries.id, id), eq(entries.userId, user.id)))
    .returning({ id: entries.id });

  if (rows.length === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ status: "ok", entryId: rows[0].id });
}
