import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { entries, users } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function exportFilename() {
  const stamp = new Intl.DateTimeFormat("en-CA").format(new Date());
  return `aurora-reflexoes-${stamp}.json`;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [account] = await db
    .select({
      email: users.email,
      locale: users.locale,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  const rows = await db
    .select({
      id: entries.id,
      transcript: entries.transcript,
      reflection: entries.reflection,
      mood: entries.mood,
      focusKey: entries.focusKey,
      entryMode: entries.entryMode,
      continuedFromEntryId: entries.continuedFromEntryId,
      createdAt: entries.createdAt,
    })
    .from(entries)
    .where(eq(entries.userId, user.id))
    .orderBy(asc(entries.createdAt));

  return NextResponse.json(
    {
      exportedAt: new Date().toISOString(),
      account: {
        email: account?.email ?? user.email ?? null,
        locale: account?.locale ?? "pt-BR",
        createdAt: account?.createdAt ?? null,
      },
      entries: rows,
    },
    {
      headers: {
        "cache-control": "no-store",
        "content-disposition": `attachment; filename="${exportFilename()}"`,
      },
    },
  );
}
