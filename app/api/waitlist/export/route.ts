import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { waitlist, waitlistProfile } from "@/lib/db/schema";
import { countConfirmedReferrals } from "@/lib/referral/waitlist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const adminToken = process.env.WAITLIST_ADMIN_TOKEN?.trim();
  if (!adminToken) {
    return NextResponse.json({ error: "export not configured" }, { status: 404 });
  }

  const url = new URL(request.url);
  if (url.searchParams.get("token") !== adminToken) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const rows = await db
    .select({
      email: waitlist.email,
      referralCode: waitlist.referralCode,
      referredByCode: waitlist.referredByCode,
      confirmedAt: waitlist.confirmedAt,
      createdAt: waitlist.createdAt,
      milestoneNotified: waitlist.milestoneNotified,
      name: waitlistProfile.name,
      moment: waitlistProfile.moment,
      rhythm: waitlistProfile.rhythm,
      presence: waitlistProfile.presence,
      value: waitlistProfile.value,
    })
    .from(waitlist)
    .leftJoin(waitlistProfile, eq(waitlistProfile.waitlistId, waitlist.id))
    .orderBy(desc(waitlist.createdAt));

  const enriched = await Promise.all(
    rows.map(async (row) => ({
      ...row,
      confirmedReferrals: await countConfirmedReferrals(db, row.referralCode),
    })),
  );

  const headers = [
    "email",
    "name",
    "referral_code",
    "referred_by_code",
    "confirmed_referrals",
    "confirmed_at",
    "created_at",
    "milestone_notified",
    "moment",
    "rhythm",
    "presence",
    "value",
  ];

  const body = [
    headers.join(","),
    ...enriched.map((row) =>
      [
        row.email,
        row.name,
        row.referralCode,
        row.referredByCode,
        row.confirmedReferrals,
        row.confirmedAt?.toISOString(),
        row.createdAt.toISOString(),
        row.milestoneNotified,
        row.moment,
        row.rhythm,
        row.presence,
        row.value,
      ]
        .map(csvCell)
        .join(","),
    ),
  ].join("\n");

  return new NextResponse(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="aurora-waitlist-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
