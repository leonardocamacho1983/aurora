import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { waitlist } from "@/lib/db/schema";
import { createUniqueReferralCode } from "@/lib/referral/code";
import { isRateLimited } from "@/lib/referral/rate-limit";
import { siteUrl } from "@/lib/referral/urls";
import { sendConfirmEmail, sendStatusEmail } from "@/lib/email/waitlist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const REF = /^[A-Za-z0-9]{6,16}$/;

type Body = {
  email?: unknown;
  ref?: unknown;
  hp?: unknown;
};

function clientKey(h: Headers): string {
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "local"
  );
}

async function findReferrer(code: string, email: string) {
  const rows = await db
    .select({
      email: waitlist.email,
      referralCode: waitlist.referralCode,
    })
    .from(waitlist)
    .where(eq(waitlist.referralCode, code))
    .limit(1);

  const referrer = rows[0];
  if (!referrer || referrer.email === email) return null;
  return referrer;
}

async function emailExisting(row: {
  email: string;
  referralCode: string;
  statusToken: string;
  confirmToken: string;
  confirmedAt: Date | null;
}, baseUrl: string) {
  if (row.confirmedAt) {
    await sendStatusEmail(row, baseUrl);
  } else {
    await sendConfirmEmail(row, baseUrl);
  }
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (typeof body.hp === "string" && body.hp.trim()) {
    return NextResponse.json({ status: "ok", mode: "accepted" });
  }

  const h = await headers();
  if (isRateLimited(clientKey(h))) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL.test(email)) {
    return NextResponse.json({ error: "invalid email" }, { status: 400 });
  }

  const rawRef = typeof body.ref === "string" ? body.ref.trim() : "";
  const ref = REF.test(rawRef) ? rawRef : "";
  const baseUrl = siteUrl(request.url);

  try {
    const existingRows = await db
      .select({
        email: waitlist.email,
        referralCode: waitlist.referralCode,
        statusToken: waitlist.statusToken,
        confirmToken: waitlist.confirmToken,
        confirmedAt: waitlist.confirmedAt,
      })
      .from(waitlist)
      .where(eq(waitlist.email, email))
      .limit(1);

    const existing = existingRows[0];
    if (existing) {
      await emailExisting(existing, baseUrl);
      return NextResponse.json({ status: "ok", mode: "email_sent" });
    }

    const referrer = ref ? await findReferrer(ref, email) : null;
    const referralCode = await createUniqueReferralCode(db);
    const inserted = await db
      .insert(waitlist)
      .values({
        email,
        referralCode,
        referredByCode: referrer?.referralCode ?? null,
      })
      .onConflictDoNothing({ target: waitlist.email })
      .returning({
        email: waitlist.email,
        referralCode: waitlist.referralCode,
        statusToken: waitlist.statusToken,
        confirmToken: waitlist.confirmToken,
      });

    const row = inserted[0];
    if (!row) {
      const duplicateRows = await db
        .select({
          email: waitlist.email,
          referralCode: waitlist.referralCode,
          statusToken: waitlist.statusToken,
          confirmToken: waitlist.confirmToken,
          confirmedAt: waitlist.confirmedAt,
        })
        .from(waitlist)
        .where(eq(waitlist.email, email))
        .limit(1);
      const duplicate = duplicateRows[0];
      if (duplicate) {
        await emailExisting(duplicate, baseUrl);
      }
      return NextResponse.json({ status: "ok", mode: "email_sent" });
    }

    await sendConfirmEmail(row, baseUrl);

    return NextResponse.json({
      status: "ok",
      mode: "created",
      referralCode: row.referralCode,
      statusToken: row.statusToken,
    });
  } catch (error) {
    console.error("/api/waitlist error:", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
