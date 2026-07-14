import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { waitlistEvents } from "@/lib/db/schema";

function rows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === "object" && "rows" in result) {
    return (result as { rows?: T[] }).rows ?? [];
  }
  return [];
}

export async function hasNonTransactionalEmailToday(waitlistId: string) {
  const [row] = rows<{ exists: boolean }>(
    await db.execute(sql`
      select exists (
        select 1
        from waitlist_events
        where waitlist_id = ${waitlistId}
          and event_name like '%email_sent'
          and created_at >= ((now() at time zone 'America/Sao_Paulo')::date at time zone 'America/Sao_Paulo')
      ) as "exists"
    `),
  );

  return Boolean(row?.exists);
}

export async function canSendNonTransactionalEmailToday(waitlistId: string) {
  return !(await hasNonTransactionalEmailToday(waitlistId));
}

export async function recordEmailFrequencyGuardSkip(input: {
  waitlistId: string;
  source: string;
  emailType: string;
  campaign?: string;
}) {
  await db.insert(waitlistEvents).values({
    waitlistId: input.waitlistId,
    eventName: "email_frequency_guard_skipped",
    source: input.source,
    metadata: {
      email_type: input.emailType,
      campaign: input.campaign ?? null,
      policy: "max_one_non_transactional_email_per_local_day",
      timezone: "America/Sao_Paulo",
    },
  });
}
