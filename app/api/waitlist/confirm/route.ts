import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { waitlist } from "@/lib/db/schema";
import { sendFriendJoinedEmail, sendMilestoneEmail } from "@/lib/email/waitlist";
import { siteUrl, statusUrl } from "@/lib/referral/urls";
import { countConfirmedReferrals } from "@/lib/referral/waitlist";
import { currentMilestone } from "@/lib/referral/milestones";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const baseUrl = siteUrl(request.url);

  if (!UUID.test(token)) {
    return NextResponse.redirect(`${baseUrl}/lista/invalid`);
  }

  const rows = await db
    .select()
    .from(waitlist)
    .where(eq(waitlist.confirmToken, token))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return NextResponse.redirect(`${baseUrl}/lista/invalid`);
  }

  const wasAlreadyConfirmed = Boolean(row.confirmedAt);
  if (!wasAlreadyConfirmed) {
    await db
      .update(waitlist)
      .set({ confirmedAt: new Date() })
      .where(eq(waitlist.id, row.id));
  }

  if (!wasAlreadyConfirmed && row.referredByCode) {
    const referrerRows = await db
      .select()
      .from(waitlist)
      .where(eq(waitlist.referralCode, row.referredByCode))
      .limit(1);

    const referrer = referrerRows[0];
    if (referrer) {
      const confirmedCount = await countConfirmedReferrals(db, referrer.referralCode);
      await sendFriendJoinedEmail({ row: referrer, confirmedCount, baseUrl });

      const milestone = currentMilestone(confirmedCount);
      if (milestone && milestone.count > referrer.milestoneNotified) {
        await db
          .update(waitlist)
          .set({
            milestoneNotified: milestone.count,
            unlockedAt: referrer.unlockedAt ?? new Date(),
          })
          .where(eq(waitlist.id, referrer.id));

        await sendMilestoneEmail({
          row: referrer,
          milestone,
          confirmedCount,
          baseUrl,
        });
      }
    }
  }

  return NextResponse.redirect(statusUrl(row.statusToken, baseUrl));
}
