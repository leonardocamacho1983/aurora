import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { waitlistEvents } from "@/lib/db/schema";
import { sendLifecycleEmail, type LifecycleEmailKind } from "@/lib/email/waitlist";
import { siteUrl } from "@/lib/referral/urls";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LifecycleRow = {
  id: string;
  email: string;
  referralCode: string;
  statusToken: string;
  confirmToken: string;
  name: string | null;
  confirmedInvites: number;
};

type LifecycleCandidate = LifecycleRow & {
  kind: LifecycleEmailKind;
};

type SendResult = {
  id: string;
  email: string;
  kind: LifecycleEmailKind;
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

function eventName(kind: LifecycleEmailKind, status: "sent" | "send_failed") {
  return `lifecycle_${kind}_email_${status}`;
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
  if (cronSecret && bearer === cronSecret) return true;

  return false;
}

function limitFromUrl(request: Request) {
  const url = new URL(request.url);
  const parsed = Number(url.searchParams.get("limit") ?? 20);
  if (!Number.isFinite(parsed)) return 20;
  return Math.max(1, Math.min(100, Math.floor(parsed)));
}

function dryRunFromUrl(request: Request) {
  const url = new URL(request.url);
  return url.searchParams.get("dryRun") === "1" || url.searchParams.get("dryRun") === "true";
}

async function selectCandidates(kind: LifecycleEmailKind, limit: number) {
  const sentEvent = eventName(kind, "sent");

  if (kind === "invited_unconfirmed_1h") {
    return rows<LifecycleRow>(
      await db.execute(sql`
        select
          w.id,
          w.email,
          w.referral_code as "referralCode",
          w.status_token as "statusToken",
          w.confirm_token as "confirmToken",
          wp.name,
          0::int as "confirmedInvites"
        from waitlist w
        left join waitlist_profile wp on wp.waitlist_id = w.id
        where w.confirmed_at is null
          and w.referred_by_code is not null
          and w.created_at <= now() - interval '1 hour'
          and not exists (
            select 1 from waitlist_events e
            where e.waitlist_id = w.id and e.event_name = ${sentEvent}
          )
        order by w.created_at asc
        limit ${limit}
      `),
    );
  }

  if (kind === "unconfirmed_1h") {
    return rows<LifecycleRow>(
      await db.execute(sql`
        select
          w.id,
          w.email,
          w.referral_code as "referralCode",
          w.status_token as "statusToken",
          w.confirm_token as "confirmToken",
          wp.name,
          0::int as "confirmedInvites"
        from waitlist w
        left join waitlist_profile wp on wp.waitlist_id = w.id
        where w.confirmed_at is null
          and w.referred_by_code is null
          and w.created_at <= now() - interval '1 hour'
          and not exists (
            select 1 from waitlist_events e
            where e.waitlist_id = w.id and e.event_name = ${sentEvent}
          )
        order by w.created_at asc
        limit ${limit}
      `),
    );
  }

  if (kind === "unconfirmed_24h") {
    return rows<LifecycleRow>(
      await db.execute(sql`
        select
          w.id,
          w.email,
          w.referral_code as "referralCode",
          w.status_token as "statusToken",
          w.confirm_token as "confirmToken",
          wp.name,
          0::int as "confirmedInvites"
        from waitlist w
        left join waitlist_profile wp on wp.waitlist_id = w.id
        where w.confirmed_at is null
          and w.created_at <= now() - interval '24 hours'
          and not exists (
            select 1 from waitlist_events e
            where e.waitlist_id = w.id and e.event_name = ${sentEvent}
          )
        order by w.created_at asc
        limit ${limit}
      `),
    );
  }

  if (kind === "confirmed_no_invite_24h") {
    return rows<LifecycleRow>(
      await db.execute(sql`
        select
          w.id,
          w.email,
          w.referral_code as "referralCode",
          w.status_token as "statusToken",
          w.confirm_token as "confirmToken",
          wp.name,
          0::int as "confirmedInvites"
        from waitlist w
        left join waitlist_profile wp on wp.waitlist_id = w.id
        where w.confirmed_at is not null
          and w.confirmed_at <= now() - interval '24 hours'
          and not exists (
            select 1 from waitlist child
            where child.referred_by_code = w.referral_code
          )
          and not exists (
            select 1 from waitlist_events e
            where e.waitlist_id = w.id and e.event_name = ${sentEvent}
          )
        order by w.confirmed_at asc
        limit ${limit}
      `),
    );
  }

  if (kind === "share_no_confirmed_invite_24h") {
    return rows<LifecycleRow>(
      await db.execute(sql`
        select
          w.id,
          w.email,
          w.referral_code as "referralCode",
          w.status_token as "statusToken",
          w.confirm_token as "confirmToken",
          wp.name,
          count(child.id) filter (where child.confirmed_at is not null)::int as "confirmedInvites"
        from waitlist w
        left join waitlist_profile wp on wp.waitlist_id = w.id
        left join waitlist child on child.referred_by_code = w.referral_code
        where w.confirmed_at is not null
          and exists (
            select 1 from waitlist_events share_event
            where share_event.waitlist_id = w.id
              and share_event.event_name in ('invite_whatsapp_clicked', 'invite_copied', 'invite_shared')
              and share_event.created_at <= now() - interval '24 hours'
          )
          and not exists (
            select 1 from waitlist_events e
            where e.waitlist_id = w.id and e.event_name = ${sentEvent}
          )
        group by w.id, wp.name
        having count(child.id) filter (where child.confirmed_at is not null) = 0
        order by min(w.confirmed_at) asc
        limit ${limit}
      `),
    );
  }

  return rows<LifecycleRow>(
    await db.execute(sql`
      select
        w.id,
        w.email,
        w.referral_code as "referralCode",
        w.status_token as "statusToken",
        w.confirm_token as "confirmToken",
        wp.name,
        0::int as "confirmedInvites"
      from waitlist w
      left join waitlist_profile wp on wp.waitlist_id = w.id
      where w.confirmed_at is not null
        and w.confirmed_at <= now() - interval '24 hours'
        and (
          wp.waitlist_id is null
          or nullif(trim(wp.moment), '') is null
          or nullif(trim(wp.rhythm), '') is null
          or nullif(trim(wp.presence), '') is null
          or nullif(trim(wp.value), '') is null
        )
        and not exists (
          select 1 from waitlist_events e
          where e.waitlist_id = w.id and e.event_name = ${sentEvent}
        )
      order by w.confirmed_at asc
      limit ${limit}
    `),
  );
}

async function getCandidates(limit: number) {
  const priority: LifecycleEmailKind[] = [
    "invited_unconfirmed_1h",
    "unconfirmed_1h",
    "unconfirmed_24h",
    "confirmed_no_invite_24h",
    "share_no_confirmed_invite_24h",
    "confirmed_no_ritual_24h",
  ];
  const candidates: LifecycleCandidate[] = [];
  const seen = new Set<string>();

  for (const kind of priority) {
    if (candidates.length >= limit) break;
    const rowsForKind = await selectCandidates(kind, limit - candidates.length);
    for (const row of rowsForKind) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      candidates.push({ ...row, kind });
      if (candidates.length >= limit) break;
    }
  }

  return candidates;
}

async function runLifecycle(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const limit = limitFromUrl(request);
  const dryRun = dryRunFromUrl(request);
  const candidates = await getCandidates(limit);
  const baseUrl = siteUrl(request.url);
  const results: SendResult[] = [];

  for (const candidate of candidates) {
    const sent = dryRun
      ? false
      : await sendLifecycleEmail({
          row: candidate,
          kind: candidate.kind,
          baseUrl,
          confirmedInvites: candidate.confirmedInvites,
        });

    if (!dryRun) {
      await db.insert(waitlistEvents).values({
        waitlistId: candidate.id,
        eventName: eventName(candidate.kind, sent ? "sent" : "send_failed"),
        source: "email_lifecycle",
        metadata: {
          provider: "resend",
          lifecycle_kind: candidate.kind,
          email_type: "lifecycle",
          success: sent,
        },
      });
    }

    results.push({
      id: candidate.id,
      email: maskEmail(candidate.email),
      kind: candidate.kind,
      sent,
      dryRun,
    });
  }

  return NextResponse.json({
    status: "ok",
    dryRun,
    selected: candidates.length,
    sent: results.filter((result) => result.sent).length,
    results,
  });
}

export async function GET(request: Request) {
  return runLifecycle(request);
}

export async function POST(request: Request) {
  return runLifecycle(request);
}
