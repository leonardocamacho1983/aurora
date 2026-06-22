import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { waitlistEvents } from "@/lib/db/schema";

export type WaitlistMaintenanceAction = {
  id: string;
  email: string;
  eventName: "waitlist_email_suppressed" | "waitlist_email_archived";
  reason: "provider_signal" | "unconfirmed_7d" | "unconfirmed_30d";
  createdAt: Date | string;
};

export type WaitlistMaintenanceResult = {
  dryRun: boolean;
  selected: number;
  applied: number;
  actions: WaitlistMaintenanceAction[];
};

type ActivePolicyBlock = {
  eventName: "waitlist_email_suppressed" | "waitlist_email_archived";
  reason: string | null;
};

function rows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === "object" && "rows" in result) {
    return (result as { rows?: T[] }).rows ?? [];
  }
  return [];
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  return `${name.slice(0, 2)}***@${domain}`;
}

export function limitMaintenance(value: number | null | undefined, fallback = 200) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.min(500, Math.floor(value ?? fallback)));
}

export async function hasHardEmailBlock(waitlistId: string) {
  const result = await db.execute(sql`
    select 1
    from waitlist_events e
    where e.waitlist_id = ${waitlistId}
      and (
        e.event_name in ('email_bounced', 'email_complained', 'email_suppressed')
        or (
          e.event_name = 'waitlist_email_suppressed'
          and e.metadata->>'reason' = 'provider_signal'
        )
      )
    limit 1
  `);

  return rows<{ "?column?": number }>(result).length > 0;
}

export async function reactivatePolicyEmailBlock(waitlistId: string) {
  const activeBlocks = rows<ActivePolicyBlock>(
    await db.execute(sql`
      select
        blocked.event_name as "eventName",
        blocked.metadata->>'reason' as reason
      from waitlist_events blocked
      where blocked.waitlist_id = ${waitlistId}
        and (
          blocked.event_name = 'waitlist_email_archived'
          or (
            blocked.event_name = 'waitlist_email_suppressed'
            and coalesce(blocked.metadata->>'reason', '') <> 'provider_signal'
          )
        )
        and not exists (
          select 1
          from waitlist_events reactivated
          where reactivated.waitlist_id = blocked.waitlist_id
            and reactivated.event_name = 'waitlist_email_reactivated'
            and reactivated.created_at > blocked.created_at
        )
      order by blocked.created_at desc
      limit 1
    `),
  );

  const block = activeBlocks[0];
  if (!block) return false;

  await db.insert(waitlistEvents).values({
    waitlistId,
    eventName: "waitlist_email_reactivated",
    source: "waitlist_form",
    metadata: {
      reason: "user_requested_email",
      previous_event: block.eventName,
      previous_reason: block.reason,
    },
  });

  return true;
}

function activeEmailBlockFilter() {
  return sql`
    not exists (
      select 1
      from waitlist_events block_event
      where block_event.waitlist_id = w.id
        and (
          block_event.event_name in ('email_bounced', 'email_complained', 'email_suppressed')
          or (
            block_event.event_name = 'waitlist_email_suppressed'
            and block_event.metadata->>'reason' = 'provider_signal'
          )
          or (
            block_event.event_name in ('waitlist_email_suppressed', 'waitlist_email_archived')
            and coalesce(block_event.metadata->>'reason', '') <> 'provider_signal'
            and not exists (
              select 1
              from waitlist_events reactivated
              where reactivated.waitlist_id = block_event.waitlist_id
                and reactivated.event_name = 'waitlist_email_reactivated'
                and reactivated.created_at > block_event.created_at
            )
          )
        )
    )
  `;
}

async function providerSignalCandidates(limit: number) {
  return rows<WaitlistMaintenanceAction>(
    await db.execute(sql`
      select
        w.id,
        w.email,
        'waitlist_email_suppressed'::text as "eventName",
        'provider_signal'::text as reason,
        max(e.created_at) as "createdAt"
      from waitlist w
      inner join waitlist_events e
        on e.waitlist_id = w.id
        and e.event_name in ('email_bounced', 'email_complained', 'email_suppressed')
      where not exists (
        select 1
        from waitlist_events already
        where already.waitlist_id = w.id
          and already.event_name = 'waitlist_email_suppressed'
          and already.metadata->>'reason' = 'provider_signal'
      )
      group by w.id, w.email
      order by max(e.created_at) asc
      limit ${limit}
    `),
  );
}

async function staleUnconfirmedCandidates(limit: number) {
  return rows<WaitlistMaintenanceAction>(
    await db.execute(sql`
      select
        w.id,
        w.email,
        'waitlist_email_suppressed'::text as "eventName",
        'unconfirmed_7d'::text as reason,
        w.created_at as "createdAt"
      from waitlist w
      left join lateral (
        select max(reactivated.created_at) as reactivated_at
        from waitlist_events reactivated
        where reactivated.waitlist_id = w.id
          and reactivated.event_name = 'waitlist_email_reactivated'
      ) reactivation on true
      where w.confirmed_at is null
        and coalesce(reactivation.reactivated_at, w.created_at) <= now() - interval '7 days'
        and coalesce(reactivation.reactivated_at, w.created_at) > now() - interval '30 days'
        and ${activeEmailBlockFilter()}
      order by w.created_at asc
      limit ${limit}
    `),
  );
}

async function archiveUnconfirmedCandidates(limit: number) {
  return rows<WaitlistMaintenanceAction>(
    await db.execute(sql`
      select
        w.id,
        w.email,
        'waitlist_email_archived'::text as "eventName",
        'unconfirmed_30d'::text as reason,
        w.created_at as "createdAt"
      from waitlist w
      left join lateral (
        select max(reactivated.created_at) as reactivated_at
        from waitlist_events reactivated
        where reactivated.waitlist_id = w.id
          and reactivated.event_name = 'waitlist_email_reactivated'
      ) reactivation on true
      where w.confirmed_at is null
        and coalesce(reactivation.reactivated_at, w.created_at) <= now() - interval '30 days'
        and not exists (
          select 1
          from waitlist_events archive_event
          where archive_event.waitlist_id = w.id
            and archive_event.event_name = 'waitlist_email_archived'
            and not exists (
              select 1
              from waitlist_events reactivated
              where reactivated.waitlist_id = archive_event.waitlist_id
                and reactivated.event_name = 'waitlist_email_reactivated'
                and reactivated.created_at > archive_event.created_at
            )
        )
      order by w.created_at asc
      limit ${limit}
    `),
  );
}

async function getMaintenanceCandidates(limit: number) {
  const actions: WaitlistMaintenanceAction[] = [];
  const seen = new Set<string>();

  for (const selectCandidates of [
    providerSignalCandidates,
    archiveUnconfirmedCandidates,
    staleUnconfirmedCandidates,
  ]) {
    if (actions.length >= limit) break;
    const candidates = await selectCandidates(limit - actions.length);
    for (const candidate of candidates) {
      const key = `${candidate.id}:${candidate.eventName}:${candidate.reason}`;
      if (seen.has(key)) continue;
      seen.add(key);
      actions.push(candidate);
      if (actions.length >= limit) break;
    }
  }

  return actions;
}

export async function runWaitlistMaintenance({
  dryRun = false,
  limit = 200,
}: {
  dryRun?: boolean;
  limit?: number;
} = {}): Promise<WaitlistMaintenanceResult> {
  const boundedLimit = limitMaintenance(limit);
  const actions = await getMaintenanceCandidates(boundedLimit);

  if (!dryRun) {
    for (const action of actions) {
      await db.insert(waitlistEvents).values({
        waitlistId: action.id,
        eventName: action.eventName,
        source: "waitlist_maintenance",
        metadata: {
          reason: action.reason,
          email: maskEmail(action.email),
          automation: "email_hygiene",
        },
      });
    }

    await db.insert(waitlistEvents).values({
      eventName: "waitlist_maintenance_run",
      source: "waitlist_maintenance",
      metadata: {
        automation: "email_hygiene",
        selected: actions.length,
        applied: actions.length,
        limit: boundedLimit,
      },
    });
  }

  return {
    dryRun,
    selected: actions.length,
    applied: dryRun ? 0 : actions.length,
    actions: actions.map((action) => ({
      ...action,
      email: maskEmail(action.email),
    })),
  };
}
