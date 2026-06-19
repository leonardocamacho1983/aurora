import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { waitlist, waitlistEvents } from "@/lib/db/schema";
import { sendFriendJoinedEmail, sendMilestoneEmail } from "@/lib/email/waitlist";
import { siteUrl, statusUrl } from "@/lib/referral/urls";
import { countConfirmedReferrals } from "@/lib/referral/waitlist";
import { currentMilestone } from "@/lib/referral/milestones";
import { analyticsEmailId, captureAuroraServer } from "@/lib/analytics/server";

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
    await db.insert(waitlistEvents).values({
      waitlistId: row.id,
      eventName: "signup_confirmed",
      source: row.referredByCode ? "referral" : "email",
      metadata: row.referredByCode ? { referredByCode: row.referredByCode } : undefined,
    });
    await captureAuroraServer("waitlist_signup_confirmed", analyticsEmailId(row.email), {
      source: row.referredByCode ? "referral" : "email",
      has_referral: Boolean(row.referredByCode),
      referral_code: row.referralCode,
      referred_by_code: row.referredByCode ?? null,
    });
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
      await captureAuroraServer("referral_confirmed", `ref_${referrer.referralCode}`, {
        referral_code: referrer.referralCode,
        confirmed_count: confirmedCount,
      });
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
        await db.insert(waitlistEvents).values({
          waitlistId: referrer.id,
          eventName: "milestone_reached",
          source: "confirm_route",
          metadata: { milestone: milestone.count, confirmedCount },
        });
        await captureAuroraServer("referral_milestone_reached", `ref_${referrer.referralCode}`, {
          referral_code: referrer.referralCode,
          milestone: milestone.count,
          confirmed_count: confirmedCount,
        });
      }
    }
  }

  return NextResponse.redirect(statusUrl(row.statusToken, baseUrl));
}
