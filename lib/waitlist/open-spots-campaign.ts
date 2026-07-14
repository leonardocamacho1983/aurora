import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { waitlistEvents } from "@/lib/db/schema";
import {
  sendOpenSpotsEmail,
  type OpenSpotsEmailKind,
} from "@/lib/email/waitlist";
import {
  canSendNonTransactionalEmailToday,
  recordEmailFrequencyGuardSkip,
} from "@/lib/email/frequency-guard";

export const OPEN_SPOTS_CAMPAIGN = "open_spots_20_free_2026_07_14";
export const OPEN_SPOTS_CAPACITY = 20;

export type OpenSpotsFollowUpKind = Exclude<OpenSpotsEmailKind, "invite">;

type OpenSpotsSegment =
  | "ritual_complete"
  | "ritual_started"
  | "ritual_incomplete"
  | "claimed_no_account"
  | "account_no_entry"
  | "activated_once"
  | "return_prompt";

type OpenSpotsRow = {
  id: string;
  email: string;
  referralCode: string;
  statusToken: string;
  confirmToken: string;
  name: string | null;
  segment: OpenSpotsSegment;
  hasAccount: boolean;
};

type OpenSpotsResult = {
  kind: OpenSpotsEmailKind;
  campaign: string;
  dryRun: boolean;
  selected: number;
  sent: number;
};

const FOLLOW_UP_ORDER: OpenSpotsFollowUpKind[] = [
  "claim_reminder",
  "account_reminder",
  "first_entry_prompt",
  "feedback_checkin",
  "return_prompt",
];

const EVENT_BASE: Record<OpenSpotsEmailKind, string> = {
  invite: "open_spots_invite",
  claim_reminder: "open_spots_claim_reminder",
  account_reminder: "open_spots_account_reminder",
  first_entry_prompt: "open_spots_first_entry_prompt",
  feedback_checkin: "open_spots_feedback_checkin",
  return_prompt: "open_spots_return_prompt",
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

function eventName(kind: OpenSpotsEmailKind, status: "sent" | "send_failed") {
  return `${EVENT_BASE[kind]}_email_${status}`;
}

function ritualUrl(statusToken: string, baseUrl: string) {
  const url = new URL("/chegada", baseUrl.replace(/\/+$/, ""));
  url.searchParams.set("token", statusToken);
  url.searchParams.set("utm_source", "email");
  url.searchParams.set("utm_medium", "lifecycle");
  url.searchParams.set("utm_campaign", OPEN_SPOTS_CAMPAIGN);
  return url.toString();
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

function realRecipientFilter() {
  return sql`
    lower(coalesce(w.email, '')) not like '%test%'
    and lower(coalesce(w.email, '')) not like '%launchtest%'
    and lower(coalesce(w.email, '')) not like '%example.%'
    and lower(coalesce(w.email, '')) not like '%leonardocamacho%'
  `;
}

function existingAccessFilter() {
  return sql`
    (
      w.unlocked_at is not null
      or exists (
        select 1
        from access_invites invite
        where lower(invite.email) = lower(w.email)
          and invite.sent_at is not null
      )
    )
  `;
}

function profileSegmentSql() {
  return sql`
    case
      when nullif(trim(wp.moment), '') is not null
        and nullif(trim(wp.rhythm), '') is not null
        and nullif(trim(wp.presence), '') is not null
        and nullif(trim(wp.value), '') is not null
        then 'ritual_complete'
      when wp.waitlist_id is not null then 'ritual_started'
      else 'ritual_incomplete'
    end
  `;
}

function noRecentEmailFilter(hours: number) {
  return sql`
    not exists (
      select 1
      from waitlist_events recent_event
      where recent_event.waitlist_id = w.id
        and recent_event.created_at > now() - (${hours}::text || ' hours')::interval
        and recent_event.event_name like '%email_sent'
    )
  `;
}

function notSentFilter(kind: OpenSpotsEmailKind) {
  return sql`
    not exists (
      select 1
      from waitlist_events sent_event
      where sent_event.waitlist_id = w.id
        and sent_event.event_name in (
          ${eventName(kind, "sent")},
          ${eventName(kind, "send_failed")}
        )
        and sent_event.metadata->>'campaign' = ${OPEN_SPOTS_CAMPAIGN}
    )
  `;
}

function invitedFilter(minAgeHours = 0) {
  const age = `${minAgeHours} hours`;
  return sql`
    exists (
      select 1
      from waitlist_events invite_event
      where invite_event.waitlist_id = w.id
        and invite_event.event_name = 'open_spots_invite_email_sent'
        and invite_event.metadata->>'campaign' = ${OPEN_SPOTS_CAMPAIGN}
        and invite_event.created_at <= now() - ${age}::interval
    )
  `;
}

function claimedFilter(minAgeHours = 0) {
  const age = `${minAgeHours} hours`;
  return sql`
    exists (
      select 1
      from waitlist_events claim_event
      where claim_event.waitlist_id = w.id
        and claim_event.event_name = 'open_spots_access_claimed'
        and claim_event.metadata->>'campaign' = ${OPEN_SPOTS_CAMPAIGN}
        and claim_event.created_at <= now() - ${age}::interval
    )
  `;
}

function notClaimedFilter() {
  return sql`
    not exists (
      select 1
      from waitlist_events claim_event
      where claim_event.waitlist_id = w.id
        and claim_event.event_name = 'open_spots_access_claimed'
        and claim_event.metadata->>'campaign' = ${OPEN_SPOTS_CAMPAIGN}
    )
  `;
}

async function accessInviteExists(email: string) {
  try {
    const [row] = rows<{ hasAccessInvite: boolean }>(
      await db.execute(sql`
        select exists (
          select 1
          from access_invites
          where lower(email) = ${email}
            and sent_at is not null
        ) as "hasAccessInvite"
      `),
    );
    return Boolean(row?.hasAccessInvite);
  } catch (error) {
    if (error instanceof Error && error.message.includes("access_invites")) return false;
    throw error;
  }
}

export async function hasAuroraAccess(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;

  const [row] = rows<{ unlocked: boolean }>(
    await db.execute(sql`
      select exists (
        select 1
        from waitlist
        where lower(email) = ${normalized}
          and unlocked_at is not null
      ) as "unlocked"
    `),
  );

  return Boolean(row?.unlocked) || accessInviteExists(normalized);
}

export async function getOpenSpotsReport() {
  const [row] = rows<{
    invited: number | string;
    claimed: number | string;
    accounts: number | string;
    firstEntries: number | string;
    firstReflections: number | string;
  }>(
    await db.execute(sql`
      with invited as (
        select distinct waitlist_id
        from waitlist_events
        where event_name = 'open_spots_invite_email_sent'
          and metadata->>'campaign' = ${OPEN_SPOTS_CAMPAIGN}
      ),
      claimed as (
        select distinct waitlist_id
        from waitlist_events
        where event_name = 'open_spots_access_claimed'
          and metadata->>'campaign' = ${OPEN_SPOTS_CAMPAIGN}
      ),
      claimed_waitlist as (
        select w.id, lower(w.email) as email
        from waitlist w
        inner join claimed c on c.waitlist_id = w.id
      )
      select
        (select count(*) from invited)::int as invited,
        (select count(*) from claimed)::int as claimed,
        (
          select count(*)
          from claimed_waitlist cw
          where exists (select 1 from users u where lower(u.email) = cw.email)
        )::int as accounts,
        (
          select count(*)
          from claimed_waitlist cw
          where exists (
            select 1
            from users u
            inner join entries e on e.user_id = u.id
            where lower(u.email) = cw.email
          )
        )::int as "firstEntries",
        (
          select count(*)
          from claimed_waitlist cw
          where exists (
            select 1
            from users u
            inner join entries e on e.user_id = u.id
            where lower(u.email) = cw.email
              and nullif(trim(e.reflection), '') is not null
          )
        )::int as "firstReflections"
    `),
  );

  return {
    campaign: OPEN_SPOTS_CAMPAIGN,
    capacity: OPEN_SPOTS_CAPACITY,
    invited: asNumber(row?.invited),
    claimed: asNumber(row?.claimed),
    remaining: Math.max(0, OPEN_SPOTS_CAPACITY - asNumber(row?.claimed)),
    accounts: asNumber(row?.accounts),
    firstEntries: asNumber(row?.firstEntries),
    firstReflections: asNumber(row?.firstReflections),
  };
}

async function claimedCount() {
  const [row] = rows<{ claimed: number | string }>(
    await db.execute(sql`
      select count(distinct waitlist_id)::int as claimed
      from waitlist_events
      where event_name = 'open_spots_access_claimed'
        and metadata->>'campaign' = ${OPEN_SPOTS_CAMPAIGN}
    `),
  );
  return asNumber(row?.claimed);
}

async function selectInviteCandidates(limit: number) {
  return rows<OpenSpotsRow>(
    await db.execute(sql`
      select
        w.id,
        w.email,
        w.referral_code as "referralCode",
        w.status_token as "statusToken",
        w.confirm_token as "confirmToken",
        wp.name,
        ${profileSegmentSql()} as segment,
        exists (select 1 from users u where lower(u.email) = lower(w.email)) as "hasAccount"
      from waitlist w
      left join waitlist_profile wp on wp.waitlist_id = w.id
      where w.confirmed_at is not null
        and ${realRecipientFilter()}
        and ${emailAllowedFilter()}
        and not ${existingAccessFilter()}
        and not exists (select 1 from users u where lower(u.email) = lower(w.email))
        and not exists (
          select 1
          from waitlist_events sent_event
          where sent_event.waitlist_id = w.id
            and sent_event.event_name in (
              'open_spots_invite_email_sent',
              'open_spots_invite_email_send_failed'
            )
            and sent_event.metadata->>'campaign' = ${OPEN_SPOTS_CAMPAIGN}
        )
        and ${noRecentEmailFilter(48)}
      order by
        case
          when nullif(trim(wp.moment), '') is not null
            and nullif(trim(wp.rhythm), '') is not null
            and nullif(trim(wp.presence), '') is not null
            and nullif(trim(wp.value), '') is not null
            then 0
          when exists (
            select 1 from waitlist_events intent_event
            where intent_event.waitlist_id = w.id
              and intent_event.event_name in (
                'waitlist_profile_updated',
                'invite_whatsapp_clicked',
                'invite_copied',
                'invite_shared',
                'referral_room_viewed'
              )
          ) then 1
          when wp.waitlist_id is not null then 2
          else 3
        end,
        coalesce(wp.updated_at, w.confirmed_at) asc
      limit ${limit}
    `),
  );
}

async function selectClaimReminder(limit: number) {
  return rows<OpenSpotsRow>(
    await db.execute(sql`
      select
        w.id,
        w.email,
        w.referral_code as "referralCode",
        w.status_token as "statusToken",
        w.confirm_token as "confirmToken",
        wp.name,
        ${profileSegmentSql()} as segment,
        false as "hasAccount"
      from waitlist w
      left join waitlist_profile wp on wp.waitlist_id = w.id
      where w.confirmed_at is not null
        and ${realRecipientFilter()}
        and ${emailAllowedFilter()}
        and ${invitedFilter(24)}
        and ${notClaimedFilter()}
        and not ${existingAccessFilter()}
        and not exists (select 1 from users u where lower(u.email) = lower(w.email))
        and ${notSentFilter("claim_reminder")}
        and ${noRecentEmailFilter(20)}
      order by
        case when ${profileSegmentSql()} = 'ritual_complete' then 0 else 1 end,
        w.confirmed_at asc
      limit ${limit}
    `),
  );
}

async function selectAccountReminder(limit: number) {
  return rows<OpenSpotsRow>(
    await db.execute(sql`
      select
        w.id,
        w.email,
        w.referral_code as "referralCode",
        w.status_token as "statusToken",
        w.confirm_token as "confirmToken",
        wp.name,
        'claimed_no_account'::text as segment,
        false as "hasAccount"
      from waitlist w
      left join waitlist_profile wp on wp.waitlist_id = w.id
      where w.confirmed_at is not null
        and ${realRecipientFilter()}
        and ${emailAllowedFilter()}
        and ${claimedFilter(6)}
        and not exists (select 1 from users u where lower(u.email) = lower(w.email))
        and ${notSentFilter("account_reminder")}
        and ${noRecentEmailFilter(20)}
      order by w.unlocked_at asc nulls last
      limit ${limit}
    `),
  );
}

async function selectFirstEntryPrompt(limit: number) {
  return rows<OpenSpotsRow>(
    await db.execute(sql`
      select
        w.id,
        w.email,
        w.referral_code as "referralCode",
        w.status_token as "statusToken",
        w.confirm_token as "confirmToken",
        wp.name,
        'account_no_entry'::text as segment,
        true as "hasAccount"
      from waitlist w
      inner join users u on lower(u.email) = lower(w.email)
      left join waitlist_profile wp on wp.waitlist_id = w.id
      where w.confirmed_at is not null
        and ${realRecipientFilter()}
        and ${emailAllowedFilter()}
        and ${claimedFilter(0)}
        and u.created_at <= now() - interval '6 hours'
        and not exists (select 1 from entries entry where entry.user_id = u.id)
        and ${notSentFilter("first_entry_prompt")}
        and ${noRecentEmailFilter(20)}
      order by u.created_at asc
      limit ${limit}
    `),
  );
}

async function selectFeedbackCheckin(limit: number) {
  return rows<OpenSpotsRow>(
    await db.execute(sql`
      select
        w.id,
        w.email,
        w.referral_code as "referralCode",
        w.status_token as "statusToken",
        w.confirm_token as "confirmToken",
        wp.name,
        'activated_once'::text as segment,
        true as "hasAccount"
      from waitlist w
      inner join users u on lower(u.email) = lower(w.email)
      left join waitlist_profile wp on wp.waitlist_id = w.id
      where w.confirmed_at is not null
        and ${realRecipientFilter()}
        and ${emailAllowedFilter()}
        and ${claimedFilter(0)}
        and exists (
          select 1
          from entries entry
          where entry.user_id = u.id
            and nullif(trim(entry.reflection), '') is not null
            and entry.created_at <= now() - interval '12 hours'
        )
        and ${notSentFilter("feedback_checkin")}
        and ${noRecentEmailFilter(20)}
      order by (
        select min(entry.created_at)
        from entries entry
        where entry.user_id = u.id
          and nullif(trim(entry.reflection), '') is not null
      ) asc
      limit ${limit}
    `),
  );
}

async function selectReturnPrompt(limit: number) {
  return rows<OpenSpotsRow>(
    await db.execute(sql`
      with activity as (
        select
          u.id as user_id,
          lower(u.email) as email,
          count(distinct local_day)::int as active_days,
          max(last_seen_at) as last_seen_at
        from users u
        inner join (
          select
            e.user_id,
            date_trunc('day', e.created_at at time zone 'America/Sao_Paulo') as local_day,
            e.created_at as last_seen_at
          from entries e
          union all
          select
            pe.user_id,
            date_trunc('day', pe.created_at at time zone 'America/Sao_Paulo') as local_day,
            pe.created_at as last_seen_at
          from product_events pe
        ) seen on seen.user_id = u.id
        group by u.id, lower(u.email)
      )
      select
        w.id,
        w.email,
        w.referral_code as "referralCode",
        w.status_token as "statusToken",
        w.confirm_token as "confirmToken",
        wp.name,
        'return_prompt'::text as segment,
        true as "hasAccount"
      from waitlist w
      inner join activity a on a.email = lower(w.email)
      left join waitlist_profile wp on wp.waitlist_id = w.id
      where w.confirmed_at is not null
        and ${realRecipientFilter()}
        and ${emailAllowedFilter()}
        and ${claimedFilter(0)}
        and a.active_days = 1
        and a.last_seen_at <= now() - interval '36 hours'
        and ${notSentFilter("return_prompt")}
        and ${noRecentEmailFilter(20)}
      order by a.last_seen_at asc
      limit ${limit}
    `),
  );
}

async function selectFollowUpRows(kind: OpenSpotsFollowUpKind, limit: number) {
  if (kind === "claim_reminder") return selectClaimReminder(limit);
  if (kind === "account_reminder") return selectAccountReminder(limit);
  if (kind === "first_entry_prompt") return selectFirstEntryPrompt(limit);
  if (kind === "feedback_checkin") return selectFeedbackCheckin(limit);
  return selectReturnPrompt(limit);
}

async function recordEmailEvent(input: {
  waitlistId: string;
  kind: OpenSpotsEmailKind;
  sent: boolean;
  segment: string;
}) {
  await db.insert(waitlistEvents).values({
    waitlistId: input.waitlistId,
    eventName: eventName(input.kind, input.sent ? "sent" : "send_failed"),
    source: "open_spots_campaign",
    metadata: {
      provider: "resend",
      campaign: OPEN_SPOTS_CAMPAIGN,
      email_type: EVENT_BASE[input.kind],
      segment: input.segment,
      success: input.sent,
      capacity: OPEN_SPOTS_CAPACITY,
    },
  });
}

async function recordRun(input: OpenSpotsResult) {
  await db.insert(waitlistEvents).values({
    eventName: `${EVENT_BASE[input.kind]}_run`,
    source: "open_spots_campaign",
    metadata: {
      automation: "open_spots_campaign",
      campaign: input.campaign,
      email_type: EVENT_BASE[input.kind],
      selected: input.selected,
      sent: input.sent,
      capacity: OPEN_SPOTS_CAPACITY,
    },
  });
}

async function sendRows(input: {
  kind: OpenSpotsEmailKind;
  rows: OpenSpotsRow[];
  baseUrl: string;
  dryRun: boolean;
}) {
  let sentCount = 0;
  const results = [];

  for (const row of input.rows) {
    if (!input.dryRun && !(await canSendNonTransactionalEmailToday(row.id))) {
      await recordEmailFrequencyGuardSkip({
        waitlistId: row.id,
        source: "open_spots_campaign",
        emailType: EVENT_BASE[input.kind],
        campaign: OPEN_SPOTS_CAMPAIGN,
      });
      results.push({
        id: row.id,
        email: maskEmail(row.email),
        segment: row.segment,
        sent: false,
        skipped: "frequency_guard",
        dryRun: input.dryRun,
      });
      continue;
    }

    const sent = input.dryRun
      ? false
      : await sendOpenSpotsEmail({
          row,
          kind: input.kind,
          baseUrl: input.baseUrl,
          ritualUrl: ritualUrl(row.statusToken, input.baseUrl),
          segment: row.segment,
          hasAccount: row.hasAccount,
        });

    if (!input.dryRun) {
      await recordEmailEvent({
        waitlistId: row.id,
        kind: input.kind,
        sent,
        segment: row.segment,
      });
    }
    if (sent) sentCount += 1;

    results.push({
      id: row.id,
      email: maskEmail(row.email),
      segment: row.segment,
      sent,
      dryRun: input.dryRun,
    });
  }

  return { sentCount, results };
}

export async function runOpenSpotsInviteCampaign({
  baseUrl,
  dryRun = true,
  limit = 100,
}: {
  baseUrl: string;
  dryRun?: boolean;
  limit?: number;
}) {
  const candidates = await selectInviteCandidates(limit);
  const { sentCount, results } = await sendRows({
    kind: "invite",
    rows: candidates,
    baseUrl,
    dryRun,
  });

  const result: OpenSpotsResult = {
    kind: "invite",
    campaign: OPEN_SPOTS_CAMPAIGN,
    dryRun,
    selected: candidates.length,
    sent: sentCount,
  };
  if (!dryRun) await recordRun(result);

  return { ...result, results };
}

export function isOpenSpotsFollowUpKind(value: string | null): value is OpenSpotsFollowUpKind {
  return Boolean(value && (FOLLOW_UP_ORDER as string[]).includes(value));
}

export async function runOpenSpotsFollowUpAutomation({
  baseUrl,
  dryRun = false,
  limit = 100,
  kind,
}: {
  baseUrl: string;
  dryRun?: boolean;
  limit?: number;
  kind?: OpenSpotsFollowUpKind;
}) {
  const selectedKinds = kind ? [kind] : FOLLOW_UP_ORDER;
  const seen = new Set<string>();
  const results: OpenSpotsResult[] = [];

  for (const currentKind of selectedKinds) {
    if (currentKind === "claim_reminder" && (await claimedCount()) >= OPEN_SPOTS_CAPACITY) {
      results.push({
        kind: currentKind,
        campaign: OPEN_SPOTS_CAMPAIGN,
        dryRun,
        selected: 0,
        sent: 0,
      });
      continue;
    }

    const remaining = Math.max(0, limit - seen.size);
    if (remaining <= 0) break;

    const candidates = (await selectFollowUpRows(currentKind, remaining)).filter((row) => {
      if (seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    });

    const { sentCount } = await sendRows({
      kind: currentKind,
      rows: candidates,
      baseUrl,
      dryRun,
    });

    const result: OpenSpotsResult = {
      kind: currentKind,
      campaign: OPEN_SPOTS_CAMPAIGN,
      dryRun,
      selected: candidates.length,
      sent: sentCount,
    };
    results.push(result);
    if (!dryRun) await recordRun(result);
  }

  return results;
}
