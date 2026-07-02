import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { waitlistEvents } from "@/lib/db/schema";
import { sendAlphaReactivationEmail } from "@/lib/email/waitlist";
import { siteUrl } from "@/lib/referral/urls";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CAMPAIGN = "alpha_reactivation_2026_07_03";
const CONFIRM_SEND = "send-alpha-reactivation-2026-07-03";
const ALPHA_COHORT_START = "2026-06-19T00:00:00.000Z";
const INTERNAL_EMAILS = new Set(["leonardo.camacho@amplify.ia.br"]);

type AlphaReactivationCandidate = {
  id: string;
  email: string;
  referralCode: string;
  statusToken: string;
  confirmToken: string;
  name: string | null;
  entries: number;
  reflectedEntries: number;
  productEvents: number;
};

type SendResult = {
  id: string;
  email: string;
  sent: boolean;
  dryRun: boolean;
  entries: number;
  reflectedEntries: number;
  productEvents: number;
};

function rows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === "object" && "rows" in result) {
    return (result as { rows?: T[] }).rows ?? [];
  }
  return [];
}

function asNumber(value: unknown) {
  return Number(value ?? 0);
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  return `${name.slice(0, 2)}***@${domain}`;
}

function isAdminAuthorized(request: Request) {
  const url = new URL(request.url);
  const adminToken = process.env.WAITLIST_ADMIN_TOKEN?.trim();
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();

  if (adminToken && url.searchParams.get("token") === adminToken) return true;
  if (adminToken && bearer === adminToken) return true;
  return false;
}

function dryRunFromUrl(request: Request) {
  const value = new URL(request.url).searchParams.get("dryRun");
  return value !== "0" && value !== "false";
}

function limitFromUrl(request: Request) {
  const parsed = Number(new URL(request.url).searchParams.get("limit") ?? 20);
  if (!Number.isFinite(parsed)) return 20;
  return Math.max(1, Math.min(50, Math.floor(parsed)));
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

async function selectCandidates(limit: number) {
  const candidates = rows<AlphaReactivationCandidate>(
    await db.execute(sql`
      with product_users as (
        select
          u.id,
          lower(coalesce(u.email, '')) as email,
          count(distinct e.id)::int as entries,
          count(distinct e.id) filter (
            where e.reflection is not null and nullif(trim(e.reflection), '') is not null
          )::int as reflected_entries,
          count(distinct pe.id)::int as product_events,
          max(greatest(coalesce(e.created_at, pe.created_at), coalesce(pe.created_at, e.created_at))) as last_seen_at
        from users u
        left join entries e on e.user_id = u.id and e.created_at >= ${ALPHA_COHORT_START}
        left join product_events pe on pe.user_id = u.id and pe.created_at >= ${ALPHA_COHORT_START}
        where u.created_at >= ${ALPHA_COHORT_START}
           or e.id is not null
           or pe.id is not null
        group by u.id, lower(coalesce(u.email, ''))
      )
      select
        w.id,
        w.email,
        w.referral_code as "referralCode",
        w.status_token as "statusToken",
        w.confirm_token as "confirmToken",
        wp.name,
        pu.entries,
        pu.reflected_entries as "reflectedEntries",
        pu.product_events as "productEvents"
      from product_users pu
      inner join waitlist w on lower(w.email) = pu.email
      left join waitlist_profile wp on wp.waitlist_id = w.id
      where w.confirmed_at is not null
        and ${activeEmailBlockFilter()}
        and (pu.entries > 0 or pu.product_events > 0)
        and pu.email not like '%test%'
        and pu.email not like '%launchtest%'
        and pu.email not like '%example.%'
        and pu.email not like '%leonardocamacho%'
        and not exists (
          select 1
          from waitlist_events sent_event
          where sent_event.waitlist_id = w.id
            and sent_event.event_name in (
              'alpha_reactivation_email_sent',
              'alpha_reactivation_email_send_failed'
            )
            and sent_event.metadata->>'campaign' = ${CAMPAIGN}
        )
      order by
        case
          when pu.reflected_entries > 0 then 0
          else 1
        end,
        pu.reflected_entries desc,
        pu.product_events desc,
        pu.last_seen_at desc nulls last
      limit ${limit}
    `),
  );

  return candidates.filter((candidate) => !INTERNAL_EMAILS.has(candidate.email.toLowerCase()));
}

async function recordEvent(input: {
  waitlistId: string;
  sent: boolean;
  dryRun: boolean;
  entries: number;
  reflectedEntries: number;
  productEvents: number;
}) {
  if (input.dryRun) return;
  await db.insert(waitlistEvents).values({
    waitlistId: input.waitlistId,
    eventName: input.sent ? "alpha_reactivation_email_sent" : "alpha_reactivation_email_send_failed",
    source: "alpha_reactivation",
    metadata: {
      provider: "resend",
      campaign: CAMPAIGN,
      email_type: "alpha_reactivation",
      success: input.sent,
      entries: input.entries,
      reflected_entries: input.reflectedEntries,
      product_events: input.productEvents,
    },
  });
}

async function run(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const dryRun = dryRunFromUrl(request);
  if (!dryRun && url.searchParams.get("confirm") !== CONFIRM_SEND) {
    return NextResponse.json({ error: "missing live send confirmation", confirm: CONFIRM_SEND }, { status: 400 });
  }

  const candidates = await selectCandidates(limitFromUrl(request));
  const baseUrl = siteUrl(request.url);
  const results: SendResult[] = [];

  for (const candidate of candidates) {
    const entries = asNumber(candidate.entries);
    const reflectedEntries = asNumber(candidate.reflectedEntries);
    const productEvents = asNumber(candidate.productEvents);
    const sent = dryRun ? false : await sendAlphaReactivationEmail(candidate, baseUrl);

    await recordEvent({
      waitlistId: candidate.id,
      sent,
      dryRun,
      entries,
      reflectedEntries,
      productEvents,
    });

    results.push({
      id: candidate.id,
      email: maskEmail(candidate.email),
      sent,
      dryRun,
      entries,
      reflectedEntries,
      productEvents,
    });
  }

  const sentCount = results.filter((result) => result.sent).length;
  if (!dryRun) {
    await db.insert(waitlistEvents).values({
      eventName: "alpha_reactivation_campaign_run",
      source: "alpha_reactivation",
      metadata: {
        campaign: CAMPAIGN,
        selected: candidates.length,
        sent: sentCount,
        limit: limitFromUrl(request),
      },
    });
  }

  return NextResponse.json({
    status: "ok",
    campaign: CAMPAIGN,
    dryRun,
    selected: candidates.length,
    sent: sentCount,
    results,
  });
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
