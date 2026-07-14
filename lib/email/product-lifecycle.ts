import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { entries, waitlist, waitlistProfile } from "@/lib/db/schema";
import { classifyRitualIntent } from "@/lib/email/ritual-intent";
import { lifecycleStateFromSignals } from "@/lib/email/lifecycle-contract";
import { recordAuroraLifecycleEvent } from "@/lib/email/lifecycle-events";

type ProductLifecycleRow = {
  id: string;
  email: string;
  unlockedAt: Date | null;
  name: string | null;
  moment: string | null;
  rhythm: string | null;
  presence: string | null;
  value: string | null;
};

function rows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === "object" && "rows" in result) {
    return (result as { rows?: T[] }).rows ?? [];
  }
  return [];
}

function profileComplete(profile: Pick<ProductLifecycleRow, "moment" | "rhythm" | "presence" | "value">) {
  return Boolean(
    profile.moment?.trim() &&
      profile.rhythm?.trim() &&
      profile.presence?.trim() &&
      profile.value?.trim(),
  );
}

async function findWaitlistLifecycle(email: string) {
  const [row] = await db
    .select({
      id: waitlist.id,
      email: waitlist.email,
      unlockedAt: waitlist.unlockedAt,
      name: waitlistProfile.name,
      moment: waitlistProfile.moment,
      rhythm: waitlistProfile.rhythm,
      presence: waitlistProfile.presence,
      value: waitlistProfile.value,
    })
    .from(waitlist)
    .leftJoin(waitlistProfile, eq(waitlistProfile.waitlistId, waitlist.id))
    .where(eq(waitlist.email, email.trim().toLowerCase()))
    .limit(1);

  return row ?? null;
}

async function productCounts(userId: string) {
  const [row] = rows<{
    entries: number | string;
    reflectedEntries: number | string;
    activeDays: number | string;
  }>(
    await db.execute(sql`
      select
        count(*)::int as entries,
        count(*) filter (
          where reflection is not null and nullif(trim(reflection), '') is not null
        )::int as "reflectedEntries",
        count(distinct date_trunc('day', created_at at time zone 'America/Sao_Paulo'))::int as "activeDays"
      from entries
      where user_id = ${userId}::uuid
    `),
  );

  return {
    entries: Number(row?.entries ?? 0),
    reflectedEntries: Number(row?.reflectedEntries ?? 0),
    activeDays: Number(row?.activeDays ?? 0),
  };
}

async function lifecycleEventExists(waitlistId: string, eventName: string) {
  const [row] = rows<{ exists: boolean }>(
    await db.execute(sql`
      select exists (
        select 1
        from waitlist_events
        where waitlist_id = ${waitlistId}
          and event_name = ${eventName}
      ) as "exists"
    `),
  );
  return Boolean(row?.exists);
}

export async function recordProductLifecycleAfterEntry(input: {
  userId: string;
  email?: string | null;
  source: "entries_api" | "reflect_api";
  entryId: string;
  hasReflection: boolean;
}) {
  const email = input.email?.trim().toLowerCase();
  if (!email) return;

  const waitlistRow = await findWaitlistLifecycle(email);
  if (!waitlistRow) return;

  const counts = await productCounts(input.userId);
  const ritualStatus = profileComplete(waitlistRow)
    ? "completed"
    : waitlistRow.moment || waitlistRow.rhythm || waitlistRow.presence || waitlistRow.value
      ? "started"
      : "not_started";
  const accessStatus = waitlistRow.unlockedAt ? "active" : "no_access";
  const contact = {
    waitlistId: waitlistRow.id,
    email: waitlistRow.email,
    firstName: waitlistRow.name,
    ritualStatus,
    ritualIntent: classifyRitualIntent(waitlistRow),
    accessStatus,
    lifecycleState: lifecycleStateFromSignals({
      ritualStatus,
      accessStatus,
      hasAccount: true,
      hasEntry: counts.entries > 0,
      hasReflection: counts.reflectedEntries > 0,
      activeTester: counts.activeDays >= 2,
    }),
    testerStatus: counts.activeDays >= 2 ? "active" : accessStatus === "active" ? "tester" : "candidate",
    lastProductEventAt: new Date().toISOString(),
  } as const;

  if (counts.entries === 1 && !(await lifecycleEventExists(waitlistRow.id, "aurora_first_entry_created"))) {
    await recordAuroraLifecycleEvent({
      waitlistId: waitlistRow.id,
      eventName: "aurora.first_entry.created",
      source: input.source,
      contact,
      metadata: {
        entry_id_present: Boolean(input.entryId),
      },
    });
  }

  if (
    input.hasReflection &&
    counts.reflectedEntries === 1 &&
    !(await lifecycleEventExists(waitlistRow.id, "aurora_first_reflection_created"))
  ) {
    await recordAuroraLifecycleEvent({
      waitlistId: waitlistRow.id,
      eventName: "aurora.first_reflection.created",
      source: input.source,
      contact,
      metadata: {
        reflected_entries: counts.reflectedEntries,
      },
    });
  }

  if (counts.activeDays >= 2 && !(await lifecycleEventExists(waitlistRow.id, "aurora_returned_day2"))) {
    await recordAuroraLifecycleEvent({
      waitlistId: waitlistRow.id,
      eventName: "aurora.returned_day2",
      source: input.source,
      contact,
      metadata: {
        active_days: counts.activeDays,
      },
    });
  }
}
