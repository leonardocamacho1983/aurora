import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { waitlist, waitlistEvents } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const eventSchema = z
  .object({
    eventName: z.enum(["invite_copied", "invite_shared", "invite_whatsapp_clicked"]),
    referralCode: z.string().trim().regex(/^[A-Za-z0-9]{6,16}$/),
    source: z.string().trim().max(40).optional(),
  })
  .strict();

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = eventSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid event" }, { status: 400 });
  }

  const rows = await db
    .select({ id: waitlist.id })
    .from(waitlist)
    .where(eq(waitlist.referralCode, parsed.data.referralCode))
    .limit(1);

  const row = rows[0];
  if (!row) return NextResponse.json({ status: "ok" });

  await db.insert(waitlistEvents).values({
    waitlistId: row.id,
    eventName: parsed.data.eventName,
    source: parsed.data.source ?? "share_invite",
  });

  return NextResponse.json({ status: "ok" });
}
