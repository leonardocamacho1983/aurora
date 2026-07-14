import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { waitlistEvents } from "@/lib/db/schema";
import {
  sendAlphaCadenceEmail,
  type AlphaCadenceEmailKind,
} from "@/lib/email/waitlist";
import {
  canSendNonTransactionalEmailToday,
  recordEmailFrequencyGuardSkip,
} from "@/lib/email/frequency-guard";

type AlphaCadenceRow = {
  id: string;
  email: string;
  referralCode: string;
  statusToken: string;
  confirmToken: string;
  name: string | null;
  hasAccount: boolean;
};

type AlphaCadenceResult = {
  kind: AlphaCadenceEmailKind;
  campaign: string;
  dryRun: boolean;
  selected: number;
  sent: number;
};

const CADENCE_ORDER: AlphaCadenceEmailKind[] = [
  "access_granted",
  "account_ready",
  "first_entry_prompt",
  "first_reflection_feedback",
  "construction_note",
  "invite_companion",
  "last_call",
];

const CAMPAIGNS: Record<AlphaCadenceEmailKind, string> = {
  access_granted: "alpha_access_granted_2026_06_26",
  account_ready: "alpha_account_ready_2026_06_27",
  first_entry_prompt: "alpha_first_entry_prompt_2026_06_27",
  first_reflection_feedback: "alpha_first_reflection_feedback_2026_06_27",
  invite_companion: "alpha_invite_companion_2026_06_29",
  last_call: "alpha_last_call_2026_06_29",
  construction_note: "alpha_construction_note_2026_06_28",
};
const OPEN_SPOTS_CAMPAIGN = "open_spots_20_free_2026_07_14";

const EVENT_BASE: Record<AlphaCadenceEmailKind, string> = {
  access_granted: "alpha_access_granted",
  account_ready: "alpha_account_ready",
  first_entry_prompt: "alpha_first_entry_prompt",
  first_reflection_feedback: "alpha_first_reflection_feedback",
  invite_companion: "alpha_invite_companion",
  last_call: "alpha_last_call",
  construction_note: "alpha_construction_note",
};

function rows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === "object" && "rows" in result) {
    return (result as { rows?: T[] }).rows ?? [];
  }
  return [];
}

function eventName(kind: AlphaCadenceEmailKind, status: "sent" | "send_failed") {
  return `${EVENT_BASE[kind]}_email_${status}`;
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

function notSentFilter(kind: AlphaCadenceEmailKind) {
  return sql`
    not exists (
      select 1
      from waitlist_events sent_event
      where sent_event.waitlist_id = w.id
        and sent_event.event_name in (
          ${eventName(kind, "sent")},
          ${eventName(kind, "send_failed")}
        )
        and sent_event.metadata->>'campaign' = ${CAMPAIGNS[kind]}
    )
  `;
}

function noRecentAlphaEmailFilter(hours: number) {
  return sql`
    not exists (
      select 1
      from waitlist_events recent_event
      where recent_event.waitlist_id = w.id
        and recent_event.created_at > now() - (${hours}::text || ' hours')::interval
        and recent_event.event_name in (
          'alpha_still_time_complete_email_sent',
          'alpha_still_time_incomplete_email_sent',
          'alpha_access_granted_email_sent',
          'alpha_account_ready_email_sent',
          'alpha_first_entry_prompt_email_sent',
          'alpha_first_reflection_feedback_email_sent',
          'alpha_invite_companion_email_sent',
          'alpha_last_call_email_sent',
          'alpha_construction_note_email_sent',
          'alpha_reactivation_email_sent'
        )
    )
  `;
}

function notOpenSpotsCampaignFilter() {
  return sql`
    not exists (
      select 1
      from waitlist_events open_spots_event
      where open_spots_event.waitlist_id = w.id
        and open_spots_event.metadata->>'campaign' = ${OPEN_SPOTS_CAMPAIGN}
    )
  `;
}

function alphaAccessFilter() {
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

function alphaAccessDate() {
  return sql`
    coalesce(
      (
        select min(invite.sent_at)
        from access_invites invite
        where lower(invite.email) = lower(w.email)
          and invite.sent_at is not null
      ),
      w.unlocked_at
    )
  `;
}

async function selectAccessGranted(limit: number) {
  return rows<AlphaCadenceRow>(
    await db.execute(sql`
      select
        w.id,
        w.email,
        w.referral_code as "referralCode",
        w.status_token as "statusToken",
        w.confirm_token as "confirmToken",
        wp.name,
        exists (
          select 1 from users u where lower(u.email) = lower(w.email)
        ) as "hasAccount"
      from waitlist w
      left join waitlist_profile wp on wp.waitlist_id = w.id
      where w.confirmed_at is not null
        and ${alphaAccessFilter()}
        and ${activeEmailBlockFilter()}
        and ${notOpenSpotsCampaignFilter()}
        and not exists (select 1 from users u where lower(u.email) = lower(w.email))
        and ${notSentFilter("access_granted")}
        and ${noRecentAlphaEmailFilter(20)}
      order by ${alphaAccessDate()} asc
      limit ${limit}
    `),
  );
}

async function selectAccountReady(limit: number) {
  return rows<AlphaCadenceRow>(
    await db.execute(sql`
      select
        w.id,
        w.email,
        w.referral_code as "referralCode",
        w.status_token as "statusToken",
        w.confirm_token as "confirmToken",
        wp.name,
        false as "hasAccount"
      from waitlist w
      left join waitlist_profile wp on wp.waitlist_id = w.id
      where w.confirmed_at is not null
        and ${alphaAccessFilter()}
        and ${activeEmailBlockFilter()}
        and ${notOpenSpotsCampaignFilter()}
        and not exists (select 1 from users u where lower(u.email) = lower(w.email))
        and exists (
          select 1
          from waitlist_events access_event
          where access_event.waitlist_id = w.id
            and access_event.event_name = 'alpha_access_granted_email_sent'
            and access_event.created_at <= now() - interval '24 hours'
        )
        and ${notSentFilter("account_ready")}
        and ${noRecentAlphaEmailFilter(20)}
      order by ${alphaAccessDate()} asc
      limit ${limit}
    `),
  );
}

async function selectFirstEntryPrompt(limit: number) {
  return rows<AlphaCadenceRow>(
    await db.execute(sql`
      select
        w.id,
        w.email,
        w.referral_code as "referralCode",
        w.status_token as "statusToken",
        w.confirm_token as "confirmToken",
        wp.name,
        true as "hasAccount"
      from waitlist w
      inner join users u on lower(u.email) = lower(w.email)
      left join waitlist_profile wp on wp.waitlist_id = w.id
      where w.confirmed_at is not null
        and ${alphaAccessFilter()}
        and ${activeEmailBlockFilter()}
        and ${notOpenSpotsCampaignFilter()}
        and u.created_at <= now() - interval '6 hours'
        and not exists (select 1 from entries entry where entry.user_id = u.id)
        and ${notSentFilter("first_entry_prompt")}
        and ${noRecentAlphaEmailFilter(20)}
      order by u.created_at asc
      limit ${limit}
    `),
  );
}

async function selectFirstReflectionFeedback(limit: number) {
  return rows<AlphaCadenceRow>(
    await db.execute(sql`
      select
        w.id,
        w.email,
        w.referral_code as "referralCode",
        w.status_token as "statusToken",
        w.confirm_token as "confirmToken",
        wp.name,
        true as "hasAccount"
      from waitlist w
      inner join users u on lower(u.email) = lower(w.email)
      left join waitlist_profile wp on wp.waitlist_id = w.id
      where w.confirmed_at is not null
        and ${alphaAccessFilter()}
        and ${activeEmailBlockFilter()}
        and ${notOpenSpotsCampaignFilter()}
        and exists (
          select 1
          from entries entry
          where entry.user_id = u.id
            and nullif(trim(entry.reflection), '') is not null
            and entry.created_at <= now() - interval '12 hours'
        )
        and ${notSentFilter("first_reflection_feedback")}
        and ${noRecentAlphaEmailFilter(20)}
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

async function selectInviteCompanion(limit: number) {
  return rows<AlphaCadenceRow>(
    await db.execute(sql`
      select
        w.id,
        w.email,
        w.referral_code as "referralCode",
        w.status_token as "statusToken",
        w.confirm_token as "confirmToken",
        wp.name,
        exists (select 1 from users u where lower(u.email) = lower(w.email)) as "hasAccount"
      from waitlist w
      left join waitlist_profile wp on wp.waitlist_id = w.id
      where w.confirmed_at is not null
        and ${activeEmailBlockFilter()}
        and ${notOpenSpotsCampaignFilter()}
        and (
          (
            nullif(trim(wp.moment), '') is not null
            and nullif(trim(wp.rhythm), '') is not null
            and nullif(trim(wp.presence), '') is not null
            and nullif(trim(wp.value), '') is not null
            and wp.updated_at <= now() - interval '2 days'
          )
          or exists (
            select 1
            from users u
            inner join entries entry on entry.user_id = u.id
            where lower(u.email) = lower(w.email)
              and entry.created_at <= now() - interval '2 days'
          )
        )
        and ${notSentFilter("invite_companion")}
        and ${noRecentAlphaEmailFilter(48)}
      order by coalesce(wp.updated_at, w.confirmed_at) asc
      limit ${limit}
    `),
  );
}

async function selectLastCall(limit: number) {
  return rows<AlphaCadenceRow>(
    await db.execute(sql`
      select
        w.id,
        w.email,
        w.referral_code as "referralCode",
        w.status_token as "statusToken",
        w.confirm_token as "confirmToken",
        wp.name,
        exists (select 1 from users u where lower(u.email) = lower(w.email)) as "hasAccount"
      from waitlist w
      left join waitlist_profile wp on wp.waitlist_id = w.id
      where w.confirmed_at is not null
        and ${activeEmailBlockFilter()}
        and ${notOpenSpotsCampaignFilter()}
        and (
          wp.waitlist_id is null
          or nullif(trim(wp.moment), '') is null
          or nullif(trim(wp.rhythm), '') is null
          or nullif(trim(wp.presence), '') is null
          or nullif(trim(wp.value), '') is null
        )
        and exists (
          select 1
          from waitlist_events still_time
          where still_time.waitlist_id = w.id
            and still_time.event_name = 'alpha_still_time_incomplete_email_sent'
            and still_time.created_at <= now() - interval '48 hours'
        )
        and ${notSentFilter("last_call")}
        and ${noRecentAlphaEmailFilter(36)}
      order by w.confirmed_at asc
      limit ${limit}
    `),
  );
}

async function selectConstructionNote(limit: number) {
  return rows<AlphaCadenceRow>(
    await db.execute(sql`
      select
        w.id,
        w.email,
        w.referral_code as "referralCode",
        w.status_token as "statusToken",
        w.confirm_token as "confirmToken",
        wp.name,
        true as "hasAccount"
      from waitlist w
      inner join users u on lower(u.email) = lower(w.email)
      left join waitlist_profile wp on wp.waitlist_id = w.id
      where w.confirmed_at is not null
        and ${alphaAccessFilter()}
        and ${activeEmailBlockFilter()}
        and ${notOpenSpotsCampaignFilter()}
        and exists (
          select 1
          from entries entry
          where entry.user_id = u.id
            and entry.created_at <= now() - interval '1 day'
        )
        and ${notSentFilter("construction_note")}
        and ${noRecentAlphaEmailFilter(24)}
      order by (
        select min(entry.created_at)
        from entries entry
        where entry.user_id = u.id
      ) asc
      limit ${limit}
    `),
  );
}

async function selectRows(kind: AlphaCadenceEmailKind, limit: number) {
  if (kind === "access_granted") return selectAccessGranted(limit);
  if (kind === "account_ready") return selectAccountReady(limit);
  if (kind === "first_entry_prompt") return selectFirstEntryPrompt(limit);
  if (kind === "first_reflection_feedback") return selectFirstReflectionFeedback(limit);
  if (kind === "invite_companion") return selectInviteCompanion(limit);
  if (kind === "last_call") return selectLastCall(limit);
  return selectConstructionNote(limit);
}

async function recordEvent(input: {
  waitlistId: string;
  kind: AlphaCadenceEmailKind;
  sent: boolean;
}) {
  await db.insert(waitlistEvents).values({
    waitlistId: input.waitlistId,
    eventName: eventName(input.kind, input.sent ? "sent" : "send_failed"),
    source: "alpha_cadence",
    metadata: {
      provider: "resend",
      campaign: CAMPAIGNS[input.kind],
      email_type: EVENT_BASE[input.kind],
      success: input.sent,
    },
  });
}

async function recordRun(input: AlphaCadenceResult) {
  await db.insert(waitlistEvents).values({
    eventName: `${EVENT_BASE[input.kind]}_run`,
    source: "alpha_cadence",
    metadata: {
      automation: "alpha_cadence",
      campaign: input.campaign,
      email_type: EVENT_BASE[input.kind],
      selected: input.selected,
      sent: input.sent,
    },
  });
}

export function isAlphaCadenceKind(value: string | null): value is AlphaCadenceEmailKind {
  return Boolean(value && (CADENCE_ORDER as string[]).includes(value));
}

export async function runAlphaCadenceAutomation({
  baseUrl,
  dryRun = false,
  limit = 100,
  kind,
}: {
  baseUrl: string;
  dryRun?: boolean;
  limit?: number;
  kind?: AlphaCadenceEmailKind;
}) {
  const selectedKinds = kind ? [kind] : CADENCE_ORDER;
  const seen = new Set<string>();
  const results: AlphaCadenceResult[] = [];

  for (const currentKind of selectedKinds) {
    const remaining = Math.max(0, limit - seen.size);
    if (remaining <= 0) break;

    const candidates = (await selectRows(currentKind, remaining)).filter((row) => {
      if (seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    });

    let sentCount = 0;
    for (const candidate of candidates) {
      if (!dryRun && !(await canSendNonTransactionalEmailToday(candidate.id))) {
        await recordEmailFrequencyGuardSkip({
          waitlistId: candidate.id,
          source: "alpha_cadence",
          emailType: EVENT_BASE[currentKind],
          campaign: CAMPAIGNS[currentKind],
        });
        continue;
      }

      const sent = dryRun
        ? false
        : await sendAlphaCadenceEmail({
            row: candidate,
            kind: currentKind,
            baseUrl,
            hasAccount: candidate.hasAccount,
          });

      if (!dryRun) {
        await recordEvent({
          waitlistId: candidate.id,
          kind: currentKind,
          sent,
        });
      }
      if (sent) sentCount += 1;
    }

    const result = {
      kind: currentKind,
      campaign: CAMPAIGNS[currentKind],
      dryRun,
      selected: candidates.length,
      sent: sentCount,
    };
    results.push(result);
    if (!dryRun) await recordRun(result);
  }

  return results;
}
