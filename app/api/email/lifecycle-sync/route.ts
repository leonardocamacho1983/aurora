import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  AURORA_LIFECYCLE_EVENTS,
  lifecycleStateFromSignals,
  type AuroraLifecycleEventName,
  type AccessStatus,
  type RitualStatus,
} from "@/lib/email/lifecycle-contract";
import { classifyRitualIntent } from "@/lib/email/ritual-intent";
import {
  recordAuroraLifecycleEvent,
  syncAuroraLifecycleContact,
} from "@/lib/email/lifecycle-events";
import { isResendLifecycleSyncEnabled } from "@/lib/email/resend-lifecycle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INTERNAL_TEST_EMAILS = new Set(["leonardocamacho@gmail.com"]);

type SyncRow = {
  id: string;
  email: string;
  name: string | null;
  moment: string | null;
  rhythm: string | null;
  presence: string | null;
  value: string | null;
  unlockedAt: Date | null;
  hasAccount: boolean;
  entries: number | string;
  reflectedEntries: number | string;
  activeDays: number | string;
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

function isAuthorized(request: Request) {
  const url = new URL(request.url);
  const adminToken = process.env.WAITLIST_ADMIN_TOKEN?.trim();
  const cronSecret = process.env.CRON_SECRET?.trim();
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();

  if (adminToken && url.searchParams.get("token") === adminToken) return true;
  if (adminToken && bearer === adminToken) return true;
  if (cronSecret && bearer === cronSecret) return true;
  return false;
}

function dryRunFromUrl(request: Request) {
  const value = new URL(request.url).searchParams.get("dryRun");
  return value !== "0" && value !== "false";
}

function limitFromUrl(request: Request) {
  const parsed = Number(new URL(request.url).searchParams.get("limit") ?? 200);
  if (!Number.isFinite(parsed)) return 200;
  return Math.max(1, Math.min(500, Math.floor(parsed)));
}

function testEmailFromUrl(request: Request) {
  const value = new URL(request.url).searchParams.get("testEmail")?.trim().toLowerCase();
  if (!value) return null;
  return INTERNAL_TEST_EMAILS.has(value) ? value : "forbidden";
}

function eventNameFromUrl(request: Request): AuroraLifecycleEventName | null | "invalid" {
  const value = new URL(request.url).searchParams.get("eventName")?.trim();
  if (!value) return null;
  return (AURORA_LIFECYCLE_EVENTS as readonly string[]).includes(value)
    ? (value as AuroraLifecycleEventName)
    : "invalid";
}

function syncDelayMsFromEnv() {
  const parsed = Number(process.env.RESEND_LIFECYCLE_SYNC_DELAY_MS ?? 400);
  if (!Number.isFinite(parsed)) return 400;
  return Math.max(0, Math.min(2000, Math.floor(parsed)));
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ritualStatus(row: Pick<SyncRow, "moment" | "rhythm" | "presence" | "value">): RitualStatus {
  if (row.moment?.trim() && row.rhythm?.trim() && row.presence?.trim() && row.value?.trim()) {
    return "completed";
  }
  if (row.moment || row.rhythm || row.presence || row.value) return "started";
  return "not_started";
}

async function selectRows(limit: number) {
  return rows<SyncRow>(
    await db.execute(sql`
      with product as (
        select
          lower(coalesce(u.email, '')) as email,
          count(distinct e.id)::int as entries,
          count(distinct e.id) filter (
            where e.reflection is not null and nullif(trim(e.reflection), '') is not null
          )::int as reflected_entries,
          count(distinct date_trunc('day', coalesce(e.created_at, pe.created_at) at time zone 'America/Sao_Paulo'))::int as active_days
        from users u
        left join entries e on e.user_id = u.id
        left join product_events pe on pe.user_id = u.id
        group by lower(coalesce(u.email, ''))
      )
      select
        w.id,
        w.email,
        w.unlocked_at as "unlockedAt",
        wp.name,
        wp.moment,
        wp.rhythm,
        wp.presence,
        wp.value,
        exists (select 1 from users u where lower(u.email) = lower(w.email)) as "hasAccount",
        coalesce(product.entries, 0)::int as entries,
        coalesce(product.reflected_entries, 0)::int as "reflectedEntries",
        coalesce(product.active_days, 0)::int as "activeDays"
      from waitlist w
      left join waitlist_profile wp on wp.waitlist_id = w.id
      left join product on product.email = lower(w.email)
      where w.confirmed_at is not null
        and lower(coalesce(w.email, '')) not like '%test%'
        and lower(coalesce(w.email, '')) not like '%launchtest%'
        and lower(coalesce(w.email, '')) not like '%example.%'
        and lower(coalesce(w.email, '')) not like '%leonardocamacho%'
        and not exists (
          select 1
          from waitlist_events block_event
          where block_event.waitlist_id = w.id
            and (
              block_event.event_name in ('email_bounced', 'email_complained', 'email_suppressed')
              or (
                block_event.event_name = 'waitlist_email_suppressed'
                and block_event.metadata->>'reason' = 'provider_signal'
              )
            )
        )
      order by w.confirmed_at asc
      limit ${limit}
    `),
  );
}

async function selectTestRow(email: string) {
  return rows<SyncRow>(
    await db.execute(sql`
      with product as (
        select
          lower(coalesce(u.email, '')) as email,
          count(distinct e.id)::int as entries,
          count(distinct e.id) filter (
            where e.reflection is not null and nullif(trim(e.reflection), '') is not null
          )::int as reflected_entries,
          count(distinct date_trunc('day', coalesce(e.created_at, pe.created_at) at time zone 'America/Sao_Paulo'))::int as active_days
        from users u
        left join entries e on e.user_id = u.id
        left join product_events pe on pe.user_id = u.id
        where lower(coalesce(u.email, '')) = ${email}
        group by lower(coalesce(u.email, ''))
      )
      select
        w.id,
        w.email,
        w.unlocked_at as "unlockedAt",
        wp.name,
        wp.moment,
        wp.rhythm,
        wp.presence,
        wp.value,
        exists (select 1 from users u where lower(u.email) = lower(w.email)) as "hasAccount",
        coalesce(product.entries, 0)::int as entries,
        coalesce(product.reflected_entries, 0)::int as "reflectedEntries",
        coalesce(product.active_days, 0)::int as "activeDays"
      from waitlist w
      left join waitlist_profile wp on wp.waitlist_id = w.id
      left join product on product.email = lower(w.email)
      where lower(w.email) = ${email}
      limit 1
    `),
  );
}

async function run(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const dryRun = dryRunFromUrl(request);
  const testEmail = testEmailFromUrl(request);
  if (testEmail === "forbidden") {
    return NextResponse.json({ error: "testEmail not allowed" }, { status: 400 });
  }

  const eventName = eventNameFromUrl(request);
  if (eventName === "invalid") {
    return NextResponse.json({ error: "invalid eventName" }, { status: 400 });
  }

  if (!dryRun && !isResendLifecycleSyncEnabled()) {
    return NextResponse.json(
      {
        error: "resend lifecycle sync disabled",
        requiredEnv: "RESEND_LIFECYCLE_SYNC_ENABLED=1",
      },
      { status: 400 },
    );
  }

  const selected = testEmail ? await selectTestRow(testEmail) : await selectRows(limitFromUrl(request));
  const results = [];
  const syncDelayMs = syncDelayMsFromEnv();

  for (let index = 0; index < selected.length; index += 1) {
    const row = selected[index];
    const currentRitualStatus = ritualStatus(row);
    const accessStatus: AccessStatus = row.unlockedAt ? "active" : "no_access";
    const entries = Number(row.entries ?? 0);
    const reflectedEntries = Number(row.reflectedEntries ?? 0);
    const activeDays = Number(row.activeDays ?? 0);
    const contact = {
      waitlistId: row.id,
      email: row.email,
      firstName: row.name,
      ritualStatus: currentRitualStatus,
      ritualIntent: classifyRitualIntent(row),
      accessStatus,
      lifecycleState: lifecycleStateFromSignals({
        ritualStatus: currentRitualStatus,
        accessStatus,
        hasAccount: row.hasAccount,
        hasEntry: entries > 0,
        hasReflection: reflectedEntries > 0,
        activeTester: activeDays >= 2,
      }),
      testerStatus: activeDays >= 2 ? "active" : accessStatus === "active" ? "tester" : "candidate",
      lastProductEventAt: null,
    } as const;

    if (!dryRun) {
      if (eventName) {
        await recordAuroraLifecycleEvent({
          waitlistId: row.id,
          eventName,
          source: "email_lifecycle_test",
          contact,
          metadata: {
            test_contact: true,
          },
        });
      } else {
        await syncAuroraLifecycleContact({
          waitlistId: row.id,
          source: testEmail ? "email_lifecycle_test" : "email_lifecycle_sync",
          contact,
        });
      }
      if (syncDelayMs > 0 && index < selected.length - 1) {
        await sleep(syncDelayMs);
      }
    }

    results.push({
      id: row.id,
      email: maskEmail(row.email),
      dryRun,
      mode: testEmail ? "test" : "sync",
      eventName,
      lifecycleState: contact.lifecycleState,
      ritualIntent: contact.ritualIntent,
    });
  }

  return NextResponse.json({
    status: "ok",
    dryRun,
    mode: testEmail ? "test" : "sync",
    eventName,
    selected: selected.length,
    synced: dryRun ? 0 : selected.length,
    results,
  });
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
