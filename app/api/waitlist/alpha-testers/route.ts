import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { waitlistEvents } from "@/lib/db/schema";
import { sendAlphaTesterRitualEmail } from "@/lib/email/waitlist";
import { siteUrl } from "@/lib/referral/urls";
import { runWaitlistMaintenance } from "@/lib/waitlist/maintenance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CAMPAIGN_KEY = "alpha_ritual_2026_06_26";
const CONFIRM_SEND = "send-alpha-ritual-2026-06-26";

type AlphaCandidate = {
  id: string;
  email: string;
  referralCode: string;
  statusToken: string;
  confirmToken: string;
  name: string | null;
};

type SendResult = {
  id: string;
  email: string;
  sent: boolean;
  dryRun: boolean;
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

function isAdminAuthorized(request: Request) {
  const url = new URL(request.url);
  const adminToken = process.env.WAITLIST_ADMIN_TOKEN?.trim();
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();

  if (adminToken && url.searchParams.get("token") === adminToken) return true;
  if (adminToken && bearer === adminToken) return true;
  return false;
}

function limitFromUrl(request: Request) {
  const url = new URL(request.url);
  const parsed = Number(url.searchParams.get("limit") ?? 500);
  if (!Number.isFinite(parsed)) return 100;
  return Math.max(1, Math.min(1000, Math.floor(parsed)));
}

function maintenanceLimitFromUrl(request: Request) {
  const url = new URL(request.url);
  const parsed = Number(url.searchParams.get("maintenanceLimit") ?? 500);
  if (!Number.isFinite(parsed)) return 500;
  return Math.max(1, Math.min(1000, Math.floor(parsed)));
}

function dryRunFromUrl(request: Request) {
  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dryRun");
  return dryRun !== "0" && dryRun !== "false";
}

function emailAllowedFilter() {
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
  return rows<AlphaCandidate>(
    await db.execute(sql`
      select
        w.id,
        w.email,
        w.referral_code as "referralCode",
        w.status_token as "statusToken",
        w.confirm_token as "confirmToken",
        wp.name
      from waitlist w
      left join waitlist_profile wp on wp.waitlist_id = w.id
      where w.confirmed_at is not null
        and ${emailAllowedFilter()}
        and (
          wp.waitlist_id is null
          or nullif(trim(wp.moment), '') is null
          or nullif(trim(wp.rhythm), '') is null
          or nullif(trim(wp.presence), '') is null
          or nullif(trim(wp.value), '') is null
        )
        and not exists (
          select 1
          from waitlist_events sent_event
          where sent_event.waitlist_id = w.id
            and sent_event.event_name in (
              'alpha_ritual_email_sent',
              'alpha_ritual_email_send_failed'
            )
            and sent_event.metadata->>'campaign' = ${CAMPAIGN_KEY}
        )
      order by w.confirmed_at asc
      limit ${limit}
    `),
  );
}

async function runAlphaBroadcast(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const dryRun = dryRunFromUrl(request);
  if (!dryRun && url.searchParams.get("confirm") !== CONFIRM_SEND) {
    return NextResponse.json(
      {
        error: "missing live send confirmation",
        confirm: CONFIRM_SEND,
      },
      { status: 400 },
    );
  }

  const limit = limitFromUrl(request);
  const maintenanceLimit = maintenanceLimitFromUrl(request);
  const maintenance = await runWaitlistMaintenance({
    dryRun,
    limit: maintenanceLimit,
  });
  const candidates = await selectCandidates(limit);
  const baseUrl = siteUrl(request.url);
  const results: SendResult[] = [];

  for (const candidate of candidates) {
    const sent = dryRun
      ? false
      : await sendAlphaTesterRitualEmail(candidate, baseUrl);

    if (!dryRun) {
      await db.insert(waitlistEvents).values({
        waitlistId: candidate.id,
        eventName: sent ? "alpha_ritual_email_sent" : "alpha_ritual_email_send_failed",
        source: "email_campaign",
        metadata: {
          provider: "resend",
          campaign: CAMPAIGN_KEY,
          email_type: "alpha_ritual",
          success: sent,
        },
      });
    }

    results.push({
      id: candidate.id,
      email: maskEmail(candidate.email),
      sent,
      dryRun,
    });
  }

  const sentCount = results.filter((result) => result.sent).length;
  if (!dryRun) {
    await db.insert(waitlistEvents).values({
      eventName: "alpha_ritual_campaign_run",
      source: "email_campaign",
      metadata: {
        campaign: CAMPAIGN_KEY,
        selected: candidates.length,
        sent: sentCount,
        limit,
        maintenance_selected: maintenance.selected,
        maintenance_applied: maintenance.applied,
        maintenance_limit: maintenanceLimit,
      },
    });
  }

  return NextResponse.json({
    status: "ok",
    campaign: CAMPAIGN_KEY,
    dryRun,
    maintenance,
    selected: candidates.length,
    sent: sentCount,
    results,
  });
}

export async function GET(request: Request) {
  return runAlphaBroadcast(request);
}

export async function POST(request: Request) {
  return runAlphaBroadcast(request);
}
