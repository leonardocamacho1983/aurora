import { and, count, eq, isNotNull } from "drizzle-orm";
import type { db as dbProxy } from "@/lib/db";
import { waitlist } from "@/lib/db/schema";
import { currentMilestone } from "./milestones";

type Db = typeof dbProxy;

export async function countConfirmedReferrals(db: Db, referralCode: string): Promise<number> {
  const rows = await db
    .select({ value: count() })
    .from(waitlist)
    .where(and(eq(waitlist.referredByCode, referralCode), isNotNull(waitlist.confirmedAt)));

  return Number(rows[0]?.value ?? 0);
}

export async function maybeUpdateMilestone(db: Db, input: { id: string; count: number; previous: number }) {
  const milestone = currentMilestone(input.count);
  if (!milestone || milestone.count <= input.previous) return null;

  await db
    .update(waitlist)
    .set({
      milestoneNotified: milestone.count,
      unlockedAt: milestone.count >= 5 ? new Date() : undefined,
    })
    .where(eq(waitlist.id, input.id));

  return milestone;
}
