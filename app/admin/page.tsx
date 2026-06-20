import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { waitlist, waitlistEvents, waitlistProfile } from "@/lib/db/schema";
import styles from "./Admin.module.css";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Aurora Cockpit",
  robots: {
    index: false,
    follow: false,
  },
};

type SearchParams = Promise<{ token?: string }>;

type CountRow = {
  total: number;
  confirmed: number;
  pending: number;
  signups7: number;
  signups30: number;
  confirmed7: number;
  confirmed30: number;
  referredSignups: number;
  confirmedReferred: number;
};

type ProfileRow = {
  started: number;
  complete: number;
};

type EventSummaryRow = {
  eventName: string;
  total: number;
  uniquePeople: number;
};

type DailyRow = {
  day: string;
  signups: number;
  confirmed: number;
  referred: number;
};

type HealthRow = {
  stalePending: number;
  internalEmails: number;
  testRows: number;
  brokenReferrals: number;
  legacyInviteEvents: number;
  eventsWithoutDistinctId: number;
};

type TrafficSummaryRow = {
  pageviews: number;
  visitors: number;
  ctaClicks: number;
  clientSignupSuccess: number;
};

type CampaignSummaryRow = {
  pageviews: number;
  visitors: number;
  ctaClicks: number;
  clientSignupSuccess: number;
  signups: number;
  signupsWithoutPageview: number;
};

type BreakdownRow = {
  label: string;
  total: number;
};

type TopReferrerRow = {
  email: string;
  name: string | null;
  referralCode: string;
  totalInvites: number;
  confirmedInvites: number;
  lastConfirmedAt: Date | null;
  milestoneNotified: number;
  roomViews: number;
  shareActions: number;
};

type NetworkRow = {
  activeInviters: number;
  invitedTotal: number;
  invitedConfirmed: number;
  oneInvite: number;
  twoToFour: number;
  fivePlus: number;
};

type EmailRow = {
  confirmSent: number;
  confirmFailed: number;
  statusSent: number;
  statusFailed: number;
  friendSent: number;
  friendFailed: number;
  milestoneSent: number;
  milestoneFailed: number;
};

type FlaggedRow = {
  email: string;
  reason: string;
  createdAt: Date | string;
};

type EngagedRow = {
  email: string;
  name: string | null;
  referralCode: string;
  confirmedInvites: number;
  shareActions: number;
  roomViews: number;
  ritualComplete: boolean;
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

function percent(value: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

function percentOrNA(value: number, total: number, fallback = "sem base") {
  if (!total) return fallback;
  return percent(value, total);
}

function ratio(value: number, total: number, precision = 2) {
  if (!total) return "0";
  return (value / total).toFixed(precision).replace(".", ",");
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  const visible = name.slice(0, 2);
  return `${visible}${"•".repeat(Math.min(5, Math.max(2, name.length - 2)))}@${domain}`;
}

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "sem data";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function dateKey(date: Date | string | null | undefined) {
  if (!date) return "sem-data";
  return date instanceof Date ? date.toISOString() : String(date);
}

function compactNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function formatDay(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function PrivateScreen({ configured }: { configured: boolean }) {
  return (
    <main className={styles.private}>
      <section className={styles.privateCard}>
        <span className={styles.orb} />
        <h1>Sala privada.</h1>
        <p>
          {configured
            ? "Entre com o token administrativo para abrir o cockpit do lançamento."
            : "O cockpit ainda não tem token configurado em produção."}
        </p>
        {configured ? (
          <form className={styles.form} action="/admin">
            <input className={styles.input} name="token" type="password" placeholder="token administrativo" autoComplete="off" />
            <button className={styles.button} type="submit">
              Entrar
            </button>
          </form>
        ) : null}
      </section>
    </main>
  );
}

function MetricCard({
  value,
  label,
  note,
  tone = "neutral",
}: {
  value: string;
  label: string;
  note: string;
  tone?: "neutral" | "warn" | "good";
}) {
  return (
    <article className={`${styles.card} ${styles[tone]}`}>
      <div className={styles.metricValue}>{value}</div>
      <div className={styles.metricLabel}>{label}</div>
      <div className={styles.metricNote}>{note}</div>
    </article>
  );
}

function SignalRow({
  label,
  value,
  note,
  tone = "neutral",
}: {
  label: string;
  value: string;
  note?: string;
  tone?: "good" | "warn" | "neutral";
}) {
  return (
    <div className={`${styles.signalRow} ${styles[tone]}`}>
      <span>
        {label}
        {note ? <small>{note}</small> : null}
      </span>
      <strong>{value}</strong>
    </div>
  );
}

function BreakdownList({ title, rows, empty = "Ainda sem dados suficientes." }: { title: string; rows: BreakdownRow[]; empty?: string }) {
  const total = rows.reduce((sum, row) => sum + asNumber(row.total), 0);

  return (
    <article className={styles.signalCard}>
      <h3 className={styles.cardTitle}>{title}</h3>
      {rows.length ? (
        rows.map((row) => {
          const rowTotal = asNumber(row.total);
          return (
            <div className={styles.breakdownRow} key={`${title}-${row.label}`}>
              <div>
                <strong>{row.label}</strong>
                <span>{percent(rowTotal, total)} do volume</span>
              </div>
              <b>{compactNumber(rowTotal)}</b>
            </div>
          );
        })
      ) : (
        <p className={styles.emptyState}>{empty}</p>
      )}
    </article>
  );
}

async function getDashboardData() {
  const [summary] = rows<CountRow>(
    await db.execute(sql`
      select
        count(*)::int as "total",
        count(*) filter (where confirmed_at is not null)::int as "confirmed",
        count(*) filter (where confirmed_at is null)::int as "pending",
        count(*) filter (where created_at >= now() - interval '7 days')::int as "signups7",
        count(*) filter (where created_at >= now() - interval '30 days')::int as "signups30",
        count(*) filter (where confirmed_at >= now() - interval '7 days')::int as "confirmed7",
        count(*) filter (where confirmed_at >= now() - interval '30 days')::int as "confirmed30",
        count(*) filter (where referred_by_code is not null)::int as "referredSignups",
        count(*) filter (where referred_by_code is not null and confirmed_at is not null)::int as "confirmedReferred"
      from waitlist
    `),
  );

  const [profile] = rows<ProfileRow>(
    await db.execute(sql`
      select
        count(*) filter (
          where nullif(trim(name), '') is not null
             or nullif(trim(moment), '') is not null
             or nullif(trim(rhythm), '') is not null
             or nullif(trim(presence), '') is not null
             or nullif(trim(value), '') is not null
        )::int as "started",
        count(*) filter (
          where nullif(trim(moment), '') is not null
            and nullif(trim(rhythm), '') is not null
            and nullif(trim(presence), '') is not null
            and nullif(trim(value), '') is not null
        )::int as "complete"
      from waitlist_profile
    `),
  );

  const eventSummary = rows<EventSummaryRow>(
    await db.execute(sql`
      select
        event_name as "eventName",
        count(*)::int as "total",
        count(distinct waitlist_id)::int as "uniquePeople"
      from waitlist_events
      group by event_name
      order by count(*) desc
    `),
  );

  const topReferrers = rows<TopReferrerRow>(
    await db.execute(sql`
      select
        w.email,
        wp.name,
        w.referral_code as "referralCode",
        count(distinct r.id)::int as "totalInvites",
        count(distinct r.id) filter (where r.confirmed_at is not null)::int as "confirmedInvites",
        max(r.confirmed_at) as "lastConfirmedAt",
        w.milestone_notified as "milestoneNotified",
        count(distinct room_events.id)::int as "roomViews",
        count(distinct share_events.id)::int as "shareActions"
      from waitlist w
      left join waitlist_profile wp on wp.waitlist_id = w.id
      left join waitlist r on r.referred_by_code = w.referral_code
      left join waitlist_events room_events
        on room_events.waitlist_id = w.id and room_events.event_name = 'referral_room_viewed'
      left join waitlist_events share_events
        on share_events.waitlist_id = w.id
        and share_events.event_name in ('invite_whatsapp_clicked', 'invite_copied', 'invite_shared')
      group by w.id, wp.name
      having count(distinct r.id) > 0 or count(distinct share_events.id) > 0
      order by count(distinct r.id) filter (where r.confirmed_at is not null) desc, count(distinct r.id) desc, count(distinct share_events.id) desc
      limit 10
    `),
  );

  const [network] = rows<NetworkRow>(
    await db.execute(sql`
      with ref_counts as (
        select
          w.id,
          count(r.id)::int as invited_total,
          count(r.id) filter (where r.confirmed_at is not null)::int as invited_confirmed
        from waitlist w
        left join waitlist r on r.referred_by_code = w.referral_code
        group by w.id
      )
      select
        count(*) filter (where invited_total > 0)::int as "activeInviters",
        coalesce(sum(invited_total), 0)::int as "invitedTotal",
        coalesce(sum(invited_confirmed), 0)::int as "invitedConfirmed",
        count(*) filter (where invited_confirmed = 1)::int as "oneInvite",
        count(*) filter (where invited_confirmed between 2 and 4)::int as "twoToFour",
        count(*) filter (where invited_confirmed >= 5)::int as "fivePlus"
      from ref_counts
    `),
  );

  const [email] = rows<EmailRow>(
    await db.execute(sql`
      select
        count(*) filter (where event_name = 'confirm_email_sent')::int as "confirmSent",
        count(*) filter (where event_name = 'confirm_email_send_failed')::int as "confirmFailed",
        count(*) filter (where event_name = 'status_email_sent')::int as "statusSent",
        count(*) filter (where event_name = 'status_email_send_failed')::int as "statusFailed",
        count(*) filter (where event_name = 'friend_joined_email_sent')::int as "friendSent",
        count(*) filter (where event_name = 'friend_joined_email_send_failed')::int as "friendFailed",
        count(*) filter (where event_name = 'milestone_email_sent')::int as "milestoneSent",
        count(*) filter (where event_name = 'milestone_email_send_failed')::int as "milestoneFailed"
      from waitlist_events
      where created_at >= now() - interval '30 days'
    `),
  );

  const engagedPeople = rows<EngagedRow>(
    await db.execute(sql`
      with ref_counts as (
        select
          w.id,
          count(r.id) filter (where r.confirmed_at is not null)::int as confirmed_invites
        from waitlist w
        left join waitlist r on r.referred_by_code = w.referral_code
        group by w.id
      ),
      event_counts as (
        select
          waitlist_id,
          count(*) filter (where event_name in ('invite_whatsapp_clicked', 'invite_copied', 'invite_shared'))::int as share_actions,
          count(*) filter (where event_name = 'referral_room_viewed')::int as room_views
        from waitlist_events
        where waitlist_id is not null
        group by waitlist_id
      )
      select
        w.email,
        wp.name,
        w.referral_code as "referralCode",
        coalesce(rc.confirmed_invites, 0)::int as "confirmedInvites",
        coalesce(ec.share_actions, 0)::int as "shareActions",
        coalesce(ec.room_views, 0)::int as "roomViews",
        (
          nullif(trim(wp.moment), '') is not null
          and nullif(trim(wp.rhythm), '') is not null
          and nullif(trim(wp.presence), '') is not null
          and nullif(trim(wp.value), '') is not null
        ) as "ritualComplete"
      from waitlist w
      left join waitlist_profile wp on wp.waitlist_id = w.id
      left join ref_counts rc on rc.id = w.id
      left join event_counts ec on ec.waitlist_id = w.id
      where coalesce(rc.confirmed_invites, 0) > 0
         or coalesce(ec.share_actions, 0) > 0
         or coalesce(ec.room_views, 0) > 0
         or wp.waitlist_id is not null
      order by
        coalesce(rc.confirmed_invites, 0) desc,
        coalesce(ec.share_actions, 0) desc,
        coalesce(ec.room_views, 0) desc,
        w.created_at asc
      limit 8
    `),
  );

  const recentProfiles = await db
    .select({
      email: waitlist.email,
      name: waitlistProfile.name,
      moment: waitlistProfile.moment,
      rhythm: waitlistProfile.rhythm,
      presence: waitlistProfile.presence,
      value: waitlistProfile.value,
      updatedAt: waitlistProfile.updatedAt,
    })
    .from(waitlistProfile)
    .innerJoin(waitlist, eq(waitlist.id, waitlistProfile.waitlistId))
    .orderBy(desc(waitlistProfile.updatedAt))
    .limit(8);

  const recentEvents = await db
    .select({
      eventName: waitlistEvents.eventName,
      source: waitlistEvents.source,
      createdAt: waitlistEvents.createdAt,
    })
    .from(waitlistEvents)
    .orderBy(desc(waitlistEvents.createdAt))
    .limit(14);

  const dailyRows = rows<DailyRow>(
    await db.execute(sql`
      with days as (
        select generate_series(
          date_trunc('day', now()) - interval '13 days',
          date_trunc('day', now()),
          interval '1 day'
        )::date as day
      )
      select
        days.day::text as day,
        count(w.id) filter (where date_trunc('day', w.created_at) = days.day)::int as signups,
        count(w.id) filter (where date_trunc('day', w.confirmed_at) = days.day)::int as confirmed,
        count(w.id) filter (
          where date_trunc('day', w.created_at) = days.day
            and w.referred_by_code is not null
        )::int as referred
      from days
      left join waitlist w
        on date_trunc('day', w.created_at) = days.day
        or date_trunc('day', w.confirmed_at) = days.day
      group by days.day
      order by days.day asc
    `),
  );

  const [health] = rows<HealthRow>(
    await db.execute(sql`
      select
        (select count(*)::int from waitlist where confirmed_at is null and created_at < now() - interval '24 hours') as "stalePending",
        (select count(*)::int from waitlist where lower(email) like '%leonardocamacho%') as "internalEmails",
        (select count(*)::int from waitlist where lower(email) like '%test%' or lower(email) like '%launchtest%' or lower(email) like '%example.%') as "testRows",
        (
          select count(*)::int
          from waitlist child
          left join waitlist parent on parent.referral_code = child.referred_by_code
          where child.referred_by_code is not null and parent.id is null
        ) as "brokenReferrals",
        (select count(*)::int from waitlist_events where event_name = 'invite_link_copied') as "legacyInviteEvents",
        (
          select count(*)::int
          from waitlist_events
          where event_name in ('launch_page_viewed', 'launch_cta_clicked', 'waitlist_submit_success')
            and metadata is not null
            and nullif(metadata->>'distinctId', '') is null
        ) as "eventsWithoutDistinctId"
    `),
  );

  const flaggedRows = rows<FlaggedRow>(
    await db.execute(sql`
      select
        email,
        case
          when lower(email) like '%test%' or lower(email) like '%launchtest%' or lower(email) like '%example.%' then 'teste'
          when lower(email) like '%leonardocamacho%' then 'interno'
          else 'revisar'
        end as reason,
        created_at as "createdAt"
      from waitlist
      where lower(email) like '%test%'
         or lower(email) like '%launchtest%'
         or lower(email) like '%example.%'
         or lower(email) like '%leonardocamacho%'
      order by created_at desc
      limit 8
    `),
  );

  const [traffic] = rows<TrafficSummaryRow>(
    await db.execute(sql`
      select
        count(*) filter (where event_name = 'launch_page_viewed')::int as "pageviews",
        count(distinct metadata->>'distinctId') filter (where event_name = 'launch_page_viewed')::int as "visitors",
        count(*) filter (where event_name = 'launch_cta_clicked')::int as "ctaClicks",
        count(*) filter (where event_name = 'waitlist_submit_success')::int as "clientSignupSuccess"
      from waitlist_events
      where created_at >= now() - interval '30 days'
    `),
  );

  const topPages = rows<BreakdownRow>(
    await db.execute(sql`
      select
        coalesce(nullif(metadata->>'path', ''), nullif(metadata->>'page', ''), 'sem página') as label,
        count(*)::int as total
      from waitlist_events
      where event_name = 'launch_page_viewed'
        and created_at >= now() - interval '30 days'
      group by 1
      order by count(*) desc
      limit 8
    `),
  );

  const trafficSources = rows<BreakdownRow>(
    await db.execute(sql`
      select
        coalesce(nullif(metadata->>'source_type', ''), nullif(metadata->>'utm_source', ''), nullif(source, ''), 'direct') as label,
        count(*)::int as total
      from waitlist_events
      where event_name in ('launch_page_viewed', 'launch_cta_clicked', 'waitlist_submit_success', 'signup_created')
        and created_at >= now() - interval '30 days'
      group by 1
      order by count(*) desc
      limit 8
    `),
  );

  const topCtas = rows<BreakdownRow>(
    await db.execute(sql`
      select
        coalesce(nullif(metadata->>'label', ''), nullif(metadata->>'source', ''), nullif(source, ''), 'sem label') as label,
        count(*)::int as total
      from waitlist_events
      where event_name = 'launch_cta_clicked'
        and created_at >= now() - interval '30 days'
      group by 1
      order by count(*) desc
      limit 8
    `),
  );

  const signupSources = rows<BreakdownRow>(
    await db.execute(sql`
      select
        coalesce(nullif(metadata->>'utm_source', ''), nullif(metadata->>'source_type', ''), nullif(source, ''), 'direct') as label,
        count(*)::int as total
      from waitlist_events
      where event_name = 'signup_created'
        and created_at >= now() - interval '30 days'
      group by 1
      order by count(*) desc
      limit 8
    `),
  );

  const [launchCampaign] = rows<CampaignSummaryRow>(
    await db.execute(sql`
      with campaign_events as (
        select *
        from waitlist_events
        where created_at >= now() - interval '30 days'
          and metadata->>'utm_campaign' = 'launch_waitlist'
      ),
      page_distinct as (
        select distinct metadata->>'distinctId' as distinct_id
        from campaign_events
        where event_name = 'launch_page_viewed'
          and nullif(metadata->>'distinctId', '') is not null
      )
      select
        count(*) filter (where event_name = 'launch_page_viewed')::int as "pageviews",
        count(distinct metadata->>'distinctId') filter (where event_name = 'launch_page_viewed')::int as "visitors",
        count(*) filter (where event_name = 'launch_cta_clicked')::int as "ctaClicks",
        count(*) filter (where event_name = 'waitlist_submit_success')::int as "clientSignupSuccess",
        count(*) filter (where event_name = 'signup_created')::int as "signups",
        count(*) filter (
          where event_name = 'signup_created'
            and not exists (
              select 1 from page_distinct p
              where p.distinct_id = campaign_events.metadata->>'distinctId'
            )
        )::int as "signupsWithoutPageview"
      from campaign_events
    `),
  );

  const launchCampaignSources = rows<BreakdownRow>(
    await db.execute(sql`
      select
        coalesce(nullif(metadata->>'utm_source', ''), nullif(metadata->>'source_type', ''), nullif(source, ''), 'direct') as label,
        count(*)::int as total
      from waitlist_events
      where created_at >= now() - interval '30 days'
        and metadata->>'utm_campaign' = 'launch_waitlist'
        and event_name in ('launch_page_viewed', 'launch_cta_clicked', 'waitlist_submit_success', 'signup_created')
      group by 1
      order by count(*) desc
      limit 8
    `),
  );

  const launchCampaignContent = rows<BreakdownRow>(
    await db.execute(sql`
      select
        coalesce(nullif(metadata->>'utm_content', ''), 'sem peça') as label,
        count(*)::int as total
      from waitlist_events
      where created_at >= now() - interval '30 days'
        and metadata->>'utm_campaign' = 'launch_waitlist'
        and event_name in ('launch_page_viewed', 'launch_cta_clicked', 'waitlist_submit_success', 'signup_created')
      group by 1
      order by count(*) desc
      limit 8
    `),
  );

  const launchCampaignCtas = rows<BreakdownRow>(
    await db.execute(sql`
      select
        coalesce(nullif(metadata->>'label', ''), nullif(metadata->>'source', ''), 'sem label') as label,
        count(*)::int as total
      from waitlist_events
      where created_at >= now() - interval '30 days'
        and metadata->>'utm_campaign' = 'launch_waitlist'
        and event_name = 'launch_cta_clicked'
      group by 1
      order by count(*) desc
      limit 8
    `),
  );

  return {
    summary: {
      total: asNumber(summary?.total),
      confirmed: asNumber(summary?.confirmed),
      pending: asNumber(summary?.pending),
      signups7: asNumber(summary?.signups7),
      signups30: asNumber(summary?.signups30),
      confirmed7: asNumber(summary?.confirmed7),
      confirmed30: asNumber(summary?.confirmed30),
      referredSignups: asNumber(summary?.referredSignups),
      confirmedReferred: asNumber(summary?.confirmedReferred),
    },
    profile: {
      started: asNumber(profile?.started),
      complete: asNumber(profile?.complete),
    },
    eventSummary,
    topReferrers,
    network: {
      activeInviters: asNumber(network?.activeInviters),
      invitedTotal: asNumber(network?.invitedTotal),
      invitedConfirmed: asNumber(network?.invitedConfirmed),
      oneInvite: asNumber(network?.oneInvite),
      twoToFour: asNumber(network?.twoToFour),
      fivePlus: asNumber(network?.fivePlus),
    },
    email: {
      confirmSent: asNumber(email?.confirmSent),
      confirmFailed: asNumber(email?.confirmFailed),
      statusSent: asNumber(email?.statusSent),
      statusFailed: asNumber(email?.statusFailed),
      friendSent: asNumber(email?.friendSent),
      friendFailed: asNumber(email?.friendFailed),
      milestoneSent: asNumber(email?.milestoneSent),
      milestoneFailed: asNumber(email?.milestoneFailed),
    },
    engagedPeople,
    recentProfiles,
    recentEvents,
    dailyRows,
    health: {
      stalePending: asNumber(health?.stalePending),
      internalEmails: asNumber(health?.internalEmails),
      testRows: asNumber(health?.testRows),
      brokenReferrals: asNumber(health?.brokenReferrals),
      legacyInviteEvents: asNumber(health?.legacyInviteEvents),
      eventsWithoutDistinctId: asNumber(health?.eventsWithoutDistinctId),
    },
    flaggedRows,
    traffic: {
      pageviews: asNumber(traffic?.pageviews),
      visitors: asNumber(traffic?.visitors),
      ctaClicks: asNumber(traffic?.ctaClicks),
      clientSignupSuccess: asNumber(traffic?.clientSignupSuccess),
    },
    topPages,
    trafficSources,
    topCtas,
    signupSources,
    launchCampaign: {
      pageviews: asNumber(launchCampaign?.pageviews),
      visitors: asNumber(launchCampaign?.visitors),
      ctaClicks: asNumber(launchCampaign?.ctaClicks),
      clientSignupSuccess: asNumber(launchCampaign?.clientSignupSuccess),
      signups: asNumber(launchCampaign?.signups),
      signupsWithoutPageview: asNumber(launchCampaign?.signupsWithoutPageview),
    },
    launchCampaignSources,
    launchCampaignContent,
    launchCampaignCtas,
  };
}

export default async function AdminPage({ searchParams }: { searchParams: SearchParams }) {
  const { token } = await searchParams;
  const adminToken = process.env.WAITLIST_ADMIN_TOKEN?.trim();

  if (!adminToken || token !== adminToken) {
    return <PrivateScreen configured={Boolean(adminToken)} />;
  }

  const data = await getDashboardData();
  const shareEvents = data.eventSummary
    .filter((event) => ["invite_whatsapp_clicked", "invite_copied", "invite_shared"].includes(event.eventName))
    .reduce(
      (acc, event) => ({
        total: acc.total + asNumber(event.total),
        unique: acc.unique + asNumber(event.uniquePeople),
      }),
      { total: 0, unique: 0 },
    );

  const emailFailures =
    data.email.confirmFailed + data.email.statusFailed + data.email.friendFailed + data.email.milestoneFailed;
  const emailSent = data.email.confirmSent + data.email.statusSent + data.email.friendSent + data.email.milestoneSent;
  const dataHealthGood =
    data.health.testRows === 0 &&
    data.health.brokenReferrals === 0 &&
    emailFailures === 0;
  const healthMessage = dataHealthGood
    ? "Base limpa para lançamento"
    : data.health.testRows > 0
      ? `Atenção: ${data.health.testRows} dados de teste detectados`
      : emailFailures > 0
        ? `Atenção: ${emailFailures} falhas de email`
        : "Atenção técnica";
  const exportHref = `/api/waitlist/export?token=${encodeURIComponent(adminToken)}`;
  const highestDailyValue = Math.max(
    1,
    ...data.dailyRows.flatMap((row) => [asNumber(row.signups), asNumber(row.confirmed), asNumber(row.referred)]),
  );

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.compactHero}>
          <div>
            <div className={styles.brand}>
              <span className={styles.orb} />
              Aurora Cockpit
            </div>
            <h1 className={styles.title}>Lançamento, emails e rede de convites.</h1>
            <p className={styles.lead}>
              Painel operacional para entender confirmação, campanha, indicação e dados que pedem ação.
            </p>
          </div>
          <div className={styles.actions}>
            <Link className={styles.button} href={exportHref}>
              Exportar CSV
            </Link>
            <Link className={styles.secondary} href={`/admin?token=${encodeURIComponent(adminToken)}`}>
              Atualizar
            </Link>
            <Link className={styles.secondary} href="/">
              Home
            </Link>
          </div>
        </section>

        <section className={styles.alertStrip}>
          <SignalRow
            label="Saúde dos dados"
            value={healthMessage}
            note={`${data.health.internalEmails} emails internos separados da sujeira real`}
            tone={dataHealthGood ? "good" : "warn"}
          />
          <SignalRow
            label="Pendentes acima de 24h"
            value={`${data.health.stalePending} pessoas`}
            note="Quem entrou e ainda não confirmou email"
            tone={data.health.stalePending === 0 ? "good" : "warn"}
          />
          <SignalRow
            label="Emails enviados"
            value={`${emailSent}`}
            note="Abertura, clique, bounce e complaint ainda dependem de webhook Resend"
            tone={emailFailures === 0 ? "good" : "warn"}
          />
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Lançamento</h2>
            <p>O essencial: lista, confirmação, convite e Ritual de Chegada.</p>
          </div>
          <div className={styles.grid}>
            <MetricCard value={compactNumber(data.summary.total)} label="Pessoas na lista" note={`${data.summary.signups7} novas nos últimos 7 dias`} />
            <MetricCard value={compactNumber(data.summary.confirmed)} label="Emails confirmados" note={`${percent(data.summary.confirmed, data.summary.total)} da lista confirmou`} />
            <MetricCard value={compactNumber(data.network.invitedConfirmed)} label="Convidados confirmados" note={`${data.network.invitedTotal} convidados gerados pela rede`} />
            <MetricCard value={compactNumber(data.profile.complete)} label="Rituais completos" note={`${data.profile.started} pessoas começaram o Ritual`} />
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Email</h2>
            <p>Envios transacionais da waitlist. Abertura, clique, bounce e complaint ainda não estão configurados.</p>
          </div>
          <div className={styles.grid}>
            <MetricCard
              value={compactNumber(data.email.confirmSent)}
              label="Confirmações enviadas"
              note={`${data.email.confirmFailed} falhas ao enviar confirmação`}
              tone={data.email.confirmFailed ? "warn" : "neutral"}
            />
            <MetricCard
              value={compactNumber(data.email.statusSent)}
              label="Links de status enviados"
              note={`${data.email.statusFailed} falhas ao enviar sala/status`}
              tone={data.email.statusFailed ? "warn" : "neutral"}
            />
            <MetricCard
              value={compactNumber(data.email.friendSent)}
              label="Avisos de convidado"
              note={`${data.email.friendFailed} falhas ao avisar convidante`}
              tone={data.email.friendFailed ? "warn" : "neutral"}
            />
            <MetricCard
              value={compactNumber(data.email.milestoneSent)}
              label="Marcos enviados"
              note={`${data.email.milestoneFailed} falhas em emails de marco`}
              tone={data.email.milestoneFailed ? "warn" : "neutral"}
            />
          </div>
          <div className={styles.noteCard}>
            Webhook Resend pendente: delivered, opened, clicked, bounced e complained ainda não existem no banco.
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Rede de convites</h2>
            <p>Convidante é quem compartilha. Convidados são as pessoas que entram pelo código. Confirmados são convidados que validaram email.</p>
          </div>
          <div className={styles.grid}>
            <MetricCard value={compactNumber(data.network.activeInviters)} label="Convidantes ativos" note="Pessoas que geraram ao menos um convidado" />
            <MetricCard value={compactNumber(data.network.invitedTotal)} label="Convidados gerados" note={`${data.network.invitedConfirmed} confirmaram email`} />
            <MetricCard value={ratio(data.network.invitedConfirmed, data.network.activeInviters)} label="Confirmados por convidante" note="Média entre convidantes ativos" />
            <MetricCard value={percent(data.network.invitedConfirmed, data.network.invitedTotal)} label="Confirmação dos convidados" note="Convidados confirmados sobre convidados gerados" />
          </div>
          <div className={styles.gridThree}>
            <div className={styles.signalCard}>
              <h3 className={styles.cardTitle}>Distribuição da rede</h3>
              <SignalRow label="1 convidado confirmado" value={`${data.network.oneInvite}`} />
              <SignalRow label="2 a 4 confirmados" value={`${data.network.twoToFour}`} />
              <SignalRow label="5 ou mais confirmados" value={`${data.network.fivePlus}`} />
            </div>
            <div className={`${styles.tableCard} ${styles.widePanel}`}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Convidante</th>
                    <th>Convidados</th>
                    <th>Convidados confirmados</th>
                    <th>Taxa</th>
                    <th>Último</th>
                    <th>Marco</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topReferrers.map((person) => (
                    <tr key={person.referralCode}>
                      <td>
                        <strong>{person.name || "Sem nome"}</strong>
                        <br />
                        <span className={styles.muted}>{maskEmail(person.email)}</span>
                      </td>
                      <td>{person.totalInvites}</td>
                      <td>{person.confirmedInvites}</td>
                      <td>{percent(person.confirmedInvites, person.totalInvites)}</td>
                      <td>{formatDate(person.lastConfirmedAt)}</td>
                      <td>{person.milestoneNotified ? `${person.milestoneNotified}+` : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Pessoas mais engajadas</h2>
            <p>Ranking operacional: convites confirmados, gestos de compartilhamento, visitas à sala e Ritual completo.</p>
          </div>
          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Pessoa</th>
                  <th>Convidados confirmados</th>
                  <th>Compartilhamentos</th>
                  <th>Sala</th>
                  <th>Ritual</th>
                </tr>
              </thead>
              <tbody>
                {data.engagedPeople.map((person) => (
                  <tr key={person.referralCode}>
                    <td>
                      <strong>{person.name || "Sem nome"}</strong>
                      <br />
                      <span className={styles.muted}>{maskEmail(person.email)}</span>
                    </td>
                    <td>{person.confirmedInvites}</td>
                    <td>{person.shareActions}</td>
                    <td>{person.roomViews}</td>
                    <td>{person.ritualComplete ? "completo" : "parcial"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Campanha launch_waitlist</h2>
            <p>Recorte por UTM oficial. Quando não há pageview capturado, a taxa fica indisponível em vez de aparecer como 0%.</p>
          </div>
          <div className={styles.grid}>
            <MetricCard
              value={compactNumber(data.launchCampaign.visitors)}
              label="Visitantes rastreados"
              note={`${compactNumber(data.launchCampaign.pageviews)} pageviews com launch_waitlist`}
            />
            <MetricCard
              value={percentOrNA(data.launchCampaign.ctaClicks, data.launchCampaign.visitors, "sem base")}
              label="Visitante para CTA"
              note={data.launchCampaign.visitors ? `${compactNumber(data.launchCampaign.ctaClicks)} cliques em CTA` : "pageview não capturado"}
            />
            <MetricCard
              value={compactNumber(data.launchCampaign.signups)}
              label="Cadastros com UTM"
              note={`${compactNumber(data.launchCampaign.clientSignupSuccess)} sucessos capturados no client`}
            />
            <MetricCard
              value={percentOrNA(data.launchCampaign.signups, data.launchCampaign.visitors, "sem base")}
              label="Visitante para cadastro"
              note={
                data.launchCampaign.visitors
                  ? "Conversão dos links oficiais"
                  : `${data.launchCampaign.signupsWithoutPageview} cadastros sem pageview prévio`
              }
            />
          </div>
          <div className={styles.gridThree}>
            <BreakdownList title="Canais do lançamento" rows={data.launchCampaignSources} />
            <BreakdownList title="Peças do lançamento" rows={data.launchCampaignContent} />
            <BreakdownList title="CTAs da campanha" rows={data.launchCampaignCtas} empty="Sem clique de CTA capturado com esta UTM." />
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Tráfego e conversão</h2>
            <p>Leitura first-party geral dos últimos 30 dias.</p>
          </div>
          <div className={styles.grid}>
            <MetricCard value={compactNumber(data.traffic.pageviews)} label="Pageviews" note={`${compactNumber(data.traffic.visitors)} visitantes identificados por navegador`} />
            <MetricCard value={percentOrNA(data.summary.signups30, data.traffic.visitors, "sem base")} label="Visitante para cadastro" note={`${compactNumber(data.summary.signups30)} cadastros no período`} />
            <MetricCard value={percentOrNA(data.traffic.ctaClicks, data.traffic.visitors, "sem base")} label="Visitante para CTA" note={`${compactNumber(data.traffic.ctaClicks)} cliques rastreados`} />
            <MetricCard value={compactNumber(data.traffic.clientSignupSuccess)} label="Sucessos no client" note="Confirmações de envio capturadas no navegador" />
          </div>
          <div className={styles.quadSplit}>
            <BreakdownList title="Páginas mais vistas" rows={data.topPages} />
            <BreakdownList title="Fontes de tráfego" rows={data.trafficSources} />
            <BreakdownList title="CTAs mais acionados" rows={data.topCtas} />
            <BreakdownList title="Origem dos cadastros" rows={data.signupSources} />
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Últimos 14 dias</h2>
            <p>Ritmo diário para perceber se publicação, conversa ou ajuste de copy mudou comportamento.</p>
          </div>
          <div className={styles.sparkCard}>
            {data.dailyRows.map((row) => {
              const signups = asNumber(row.signups);
              const confirmed = asNumber(row.confirmed);
              const referred = asNumber(row.referred);

              return (
                <div className={styles.dayColumn} key={row.day}>
                  <div className={styles.dayBars}>
                    <span className={styles.signupBar} style={{ height: `${Math.max(5, (signups / highestDailyValue) * 100)}%` }} />
                    <span className={styles.confirmedBar} style={{ height: `${Math.max(5, (confirmed / highestDailyValue) * 100)}%` }} />
                    <span className={styles.referredBar} style={{ height: `${Math.max(5, (referred / highestDailyValue) * 100)}%` }} />
                  </div>
                  <span>{formatDay(row.day)}</span>
                </div>
              );
            })}
          </div>
          <div className={styles.legend}>
            <span><i className={styles.signupDot} /> inscrições</span>
            <span><i className={styles.confirmedDot} /> confirmações</span>
            <span><i className={styles.referredDot} /> convites</span>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Saúde dos dados</h2>
            <p>Separação entre dados internos, teste real e problemas técnicos acionáveis.</p>
          </div>
          <div className={styles.split}>
            <div className={styles.signalCard}>
              <SignalRow
                label="Emails internos"
                value={`${data.health.internalEmails}`}
                note="Separados da sujeira real; não bloqueiam leitura"
                tone="neutral"
              />
              <SignalRow
                label="Dados de teste"
                value={`${data.health.testRows}`}
                note="Emails com test, launchtest ou example"
                tone={data.health.testRows === 0 ? "good" : "warn"}
              />
              <SignalRow
                label="Referrals quebrados"
                value={`${data.health.brokenReferrals}`}
                note="Convidado com código sem convidante"
                tone={data.health.brokenReferrals === 0 ? "good" : "warn"}
              />
              <SignalRow
                label="Eventos sem distinctId"
                value={`${data.health.eventsWithoutDistinctId}`}
                note="Afeta leitura de visitantes únicos"
                tone={data.health.eventsWithoutDistinctId === 0 ? "good" : "warn"}
              />
              <SignalRow
                label="Evento legado de copy"
                value={`${data.health.legacyInviteEvents}`}
                note="invite_link_copied antigo"
                tone={data.health.legacyInviteEvents === 0 ? "good" : "warn"}
              />
            </div>
            <div className={styles.tableCard}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Registro</th>
                    <th>Tipo</th>
                    <th>Criado em</th>
                  </tr>
                </thead>
                <tbody>
                  {data.flaggedRows.length ? (
                    data.flaggedRows.map((row) => (
                      <tr key={`${row.email}-${dateKey(row.createdAt)}`}>
                        <td>{maskEmail(row.email)}</td>
                        <td>{row.reason}</td>
                        <td>{formatDate(row.createdAt)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3}>Nenhum registro interno ou de teste detectado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Sinais de desejo</h2>
            <p>Respostas recentes do Ritual para entender promessa, linguagem e primeiro uso.</p>
          </div>
          <div className={styles.answerCard}>
            <div className={styles.answerList}>
              {data.recentProfiles.map((profileRow) => (
                <article className={styles.answer} key={`${profileRow.email}-${dateKey(profileRow.updatedAt)}`}>
                  <strong>{profileRow.name || maskEmail(profileRow.email)}</strong>
                  <p>{profileRow.moment || "Sem momento registrado ainda"}</p>
                  <p>
                    <span className={styles.muted}>Ritmo:</span> {profileRow.rhythm || "não respondeu"} ·{" "}
                    <span className={styles.muted}>Presença:</span> {profileRow.presence || "não respondeu"} ·{" "}
                    <span className={styles.muted}>Valor:</span> {profileRow.value || "não respondeu"}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Eventos recentes</h2>
            <p>Últimos sinais server-side do fluxo de lançamento.</p>
          </div>
          <div className={styles.eventList}>
            {data.recentEvents.map((event, index) => (
              <div className={styles.event} key={`${event.eventName}-${dateKey(event.createdAt)}-${index}`}>
                <span>{event.eventName}</span>
                <span className={styles.muted}>
                  {event.source || "sem origem"} · {formatDate(event.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
