import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { waitlist, waitlistEvents, waitlistProfile } from "@/lib/db/schema";
import {
  profileFieldNames,
  profileValues,
  waitlistProfilePatchSchema,
} from "@/lib/referral/profile";
import { captureAuroraServer } from "@/lib/analytics/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = waitlistProfilePatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid profile" }, { status: 400 });
  }

  const values = profileValues(parsed.data);
  const fields = profileFieldNames(values);
  if (fields.length === 0) {
    return NextResponse.json({ error: "empty profile" }, { status: 400 });
  }

  const rows = await db
    .select({ id: waitlist.id, referralCode: waitlist.referralCode })
    .from(waitlist)
    .where(eq(waitlist.statusToken, parsed.data.statusToken))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const now = new Date();
  await db
    .insert(waitlistProfile)
    .values({
      waitlistId: row.id,
      ...values,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: waitlistProfile.waitlistId,
      set: {
        ...values,
        updatedAt: now,
      },
    });

  await db.insert(waitlistEvents).values({
    waitlistId: row.id,
    eventName: "profile_updated",
    source: parsed.data.source ?? "unknown",
    metadata: { fields },
  });
  await captureAuroraServer("waitlist_profile_updated", `ref_${row.referralCode}`, {
    source: parsed.data.source ?? "unknown",
    referral_code: row.referralCode,
    fields: fields.join(","),
    field_count: fields.length,
  });

  return NextResponse.json({ status: "ok", fields });
}
