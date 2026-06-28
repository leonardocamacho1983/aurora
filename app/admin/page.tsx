import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
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
  campaignSignals: number;
  campaignPeople: number;
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
  linkViews: number;
  linkVisitors: number;
  formSuccesses: number;
  signupEvents: number;
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
  lifecycleSent: number;
  lifecycleFailed: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
};

type EmailHealthRow = {
  hardBlocked: number;
  bouncedPeople: number;
  complainedPeople: number;
  providerSuppressedPeople: number;
  pausedUnconfirmed: number;
  archivedUnconfirmed: number;
  reactivated: number;
  blockedResends: number;
  pendingReminderWindow: number;
  lastMaintenanceAt: Date | string | null;
  lastLifecycleAt: Date | string | null;
};

type EmailHygieneEventRow = {
  eventName: string;
  reason: string | null;
  selected: number | null;
  applied: number | null;
  createdAt: Date | string;
};

type ProductTechnicalSummaryRow = {
  events: number;
  requests: number;
  people: number;
  failureEvents: number;
  failureRequests: number;
  failurePeople: number;
  retryableFailures: number;
  nonRetryableFailures: number;
  latestEventAt: Date | string | null;
  latestFailureAt: Date | string | null;
};

type ProductFailureAlertRow = {
  errorClass: string;
  retryable: string;
  requests: number;
  people: number;
  latestAt: Date | string | null;
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

const ALPHA_COHORT_START = "2026-06-19T00:00:00.000Z";

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

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
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

const help = {
  dataHealth: "Resumo dos checks técnicos: dados de teste, referrals quebrados e falhas recentes de email.",
  stalePending: "Pessoas em waitlist com email ainda não confirmado e cadastro criado há mais de 24 horas.",
  emailsSent: "Soma dos eventos de envio de email registrados nos últimos 30 dias.",
  totalList: "Total de registros na tabela waitlist, incluindo pessoas pendentes, confirmadas, diretas e convidadas.",
  confirmedEmails: "Pessoas da waitlist com confirmed_at preenchido depois de clicar no email de confirmação.",
  confirmedInvited: "Pessoas com referred_by_code preenchido e email confirmado. Esse é o número oficial de convidados confirmados.",
  ritualsComplete: "Perfis em waitlist_profile com momento, ritmo, presença e valor preenchidos.",
  confirmSent: "Eventos confirm_email_sent nos últimos 30 dias.",
  statusSent: "Eventos status_email_sent nos últimos 30 dias, usados para reenviar link de sala/status.",
  friendSent: "Eventos friend_joined_email_sent nos últimos 30 dias, quando uma pessoa convidada confirma.",
  milestoneSent: "Eventos milestone_email_sent nos últimos 30 dias.",
  lifecycleSent: "Emails automáticos de cadência da waitlist enviados nos últimos 30 dias.",
  delivered: "Eventos email_delivered recebidos do webhook do Resend nos últimos 30 dias.",
  bounces: "Eventos email_bounced recebidos do webhook do Resend nos últimos 30 dias.",
  hardBlocked: "Pessoas com bounce, complaint ou supressão de provedor; ficam fora de novos envios.",
  paused7d: "Pessoas não confirmadas após 7 dias que foram pausadas pela higiene de email.",
  archived30d: "Pessoas não confirmadas após 30 dias que foram arquivadas operacionalmente.",
  reactivated: "Eventos em que uma pessoa pausada/arquivada voltou ao formulário e foi reativada.",
  technicalStatus: "Requests únicos de transcrição/reflexão com erro nas últimas 24h, deduplicados por request_id.",
  technicalPeople: "Pessoas reais impactadas por falhas técnicas, excluindo emails internos/testes.",
  technicalRetryable: "Falhas marcadas como recuperáveis por retry/backoff versus falhas não recuperáveis.",
  technicalLatest: "Último sinal técnico registrado em product_events para transcrição/reflexão.",
  activeInviters: "Pessoas cujo referral_code aparece em pelo menos um cadastro novo como referred_by_code.",
  invitedTotal: "Cadastros na tabela waitlist criados com referred_by_code válido.",
  confirmedPerInviter: "Convidados confirmados dividido por convidantes ativos.",
  inviteConfirmRate: "Convidados confirmados dividido por todos os cadastros gerados pela rede.",
  shareActions: "Cliques de copiar, compartilhar ou WhatsApp. Mede intenção de compartilhar, não cadastro.",
  campaignSignals: "Eventos de pageview, CTA, sucesso no client e cadastro com utm_campaign=launch_waitlist.",
  campaignCtas: "Eventos launch_cta_clicked marcados com a campanha launch_waitlist.",
  campaignSignups: "Eventos signup_created marcados com a campanha launch_waitlist.",
  campaignConversion: "Cadastros com UTM divididos pelo total de sinais da campanha.",
  pageviews: "Eventos landing_viewed e launch_page_viewed nos últimos 30 dias.",
  visitorSignupRate: "Cadastros criados nos últimos 30 dias divididos por visitantes identificados por distinctId.",
  visitorCtaRate: "Cliques em CTA nos últimos 30 dias divididos por visitantes identificados por distinctId.",
  clientSuccess: "Eventos waitlist_submit_success no navegador; inclui novos cadastros e reenvios/fluxos já existentes.",
  topPages: "Pageviews por path, somando landing_viewed e launch_page_viewed.",
  trafficSources: "Eventos de tráfego agrupados por source_type, UTM ou source.",
  topCtas: "Eventos launch_cta_clicked agrupados por label ou source.",
  signupSources: "Eventos signup_created agrupados por UTM/source_type/source.",
} as const;

function InfoTooltip({ text }: { text: string }) {
  return (
    <span className={styles.infoTooltip} tabIndex={0} aria-label={text}>
      <span aria-hidden="true">?</span>
      <span className={styles.tooltipBubble}>{text}</span>
    </span>
  );
}

function LabelWithTooltip({ children, definition }: { children: ReactNode; definition?: string }) {
  if (!definition) return <>{children}</>;
  return (
    <span className={styles.labelWithTooltip}>
      <span>{children}</span>
      <InfoTooltip text={definition} />
    </span>
  );
}

function emailHygieneLabel(eventName: string) {
  const labels: Record<string, string> = {
    waitlist_email_suppressed: "Pausa de email",
    waitlist_email_archived: "Arquivamento",
    waitlist_email_reactivated: "Reativação",
    waitlist_existing_email_blocked: "Reenvio bloqueado",
    waitlist_maintenance_run: "Manutenção executada",
    waitlist_lifecycle_run: "Lifecycle executado",
  };
  return labels[eventName] ?? eventName;
}

function emailHygieneReason(reason: string | null) {
  const reasons: Record<string, string> = {
    provider_signal: "sinal do provedor",
    unconfirmed_7d: "7+ dias sem confirmação",
    unconfirmed_30d: "30+ dias sem confirmação",
    user_requested_email: "pessoa voltou ao formulário",
    hard_email_signal: "bloqueio duro de entrega",
  };
  return reason ? reasons[reason] ?? reason : "execução";
}

function retryableLabel(value: string) {
  if (value === "true") return "sim";
  if (value === "false") return "não";
  return "sem sinal";
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
  definition,
}: {
  value: string;
  label: string;
  note: string;
  tone?: "neutral" | "warn" | "good";
  definition?: string;
}) {
  return (
    <article className={cx(styles.card, styles[tone])}>
      <div className={styles.metricValue}>{value}</div>
      <div className={styles.metricLabel}>
        <LabelWithTooltip definition={definition}>{label}</LabelWithTooltip>
      </div>
      <div className={styles.metricNote}>{note}</div>
    </article>
  );
}

function SignalRow({
  label,
  value,
  note,
  tone = "neutral",
  definition,
}: {
  label: string;
  value: string;
  note?: string;
  tone?: "good" | "warn" | "neutral";
  definition?: string;
}) {
  return (
    <div className={cx(styles.signalRow, styles[tone])}>
      <span>
        <LabelWithTooltip definition={definition}>{label}</LabelWithTooltip>
        {note ? <small>{note}</small> : null}
      </span>
      <strong>{value}</strong>
    </div>
  );
}

function BreakdownList({
  title,
  rows,
  empty = "Ainda sem dados suficientes.",
  definition,
}: {
  title: string;
  rows: BreakdownRow[];
  empty?: string;
  definition?: string;
}) {
  const total = rows.reduce((sum, row) => sum + asNumber(row.total), 0);

  return (
    <article className={styles.signalCard}>
      <h3 className={styles.cardTitle}>
        <LabelWithTooltip definition={definition}>{title}</LabelWithTooltip>
      </h3>
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

function ProductFailureAlertTable({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: ProductFailureAlertRow[];
  empty: string;
}) {
  return (
    <div>
      <h3 className={styles.cardTitle}>{title}</h3>
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Classe</th>
              <th>Requests</th>
              <th>Pessoas</th>
              <th>Retry</th>
              <th>Último sinal</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row) => (
                <tr key={`${title}-${row.errorClass}-${row.retryable}`}>
                  <td>{row.errorClass}</td>
                  <td>{compactNumber(asNumber(row.requests))}</td>
                  <td>{compactNumber(asNumber(row.people))}</td>
                  <td>{retryableLabel(row.retryable)}</td>
                  <td>{formatDate(row.latestAt)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>{empty}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
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
      with referral_counts as (
        select
          referred_by_code,
          count(*)::int as total_invites,
          count(*) filter (where confirmed_at is not null)::int as confirmed_invites,
          max(confirmed_at) as last_confirmed_at
        from waitlist
        where referred_by_code is not null
        group by referred_by_code
      ),
      event_counts as (
        select
          waitlist_id,
          count(*) filter (where event_name = 'referral_room_viewed')::int as room_views,
          count(*) filter (where event_name in ('invite_whatsapp_clicked', 'invite_copied', 'invite_shared'))::int as share_actions
        from waitlist_events
        where waitlist_id is not null
        group by waitlist_id
      ),
      code_events as (
        select
          code,
          count(*) filter (where event_name in ('landing_viewed', 'launch_page_viewed'))::int as link_views,
          count(distinct metadata->>'distinctId') filter (
            where event_name in ('landing_viewed', 'launch_page_viewed')
              and nullif(metadata->>'distinctId', '') is not null
          )::int as link_visitors,
          count(*) filter (where event_name = 'waitlist_submit_success')::int as form_successes,
          count(*) filter (where event_name = 'signup_created')::int as signup_events
        from (
          select
            coalesce(
              nullif(metadata->>'referredByCode', ''),
              nullif(metadata->>'referred_by_code', ''),
              nullif(metadata->>'referral_code', '')
            ) as code,
            event_name,
            metadata
          from waitlist_events
          where metadata is not null
        ) events_by_code
        where code is not null
        group by code
      )
      select
        w.email,
        wp.name,
        w.referral_code as "referralCode",
        coalesce(rc.total_invites, 0)::int as "totalInvites",
        coalesce(rc.confirmed_invites, 0)::int as "confirmedInvites",
        rc.last_confirmed_at as "lastConfirmedAt",
        w.milestone_notified as "milestoneNotified",
        coalesce(ec.room_views, 0)::int as "roomViews",
        coalesce(ec.share_actions, 0)::int as "shareActions",
        coalesce(ce.link_views, 0)::int as "linkViews",
        coalesce(ce.link_visitors, 0)::int as "linkVisitors",
        coalesce(ce.form_successes, 0)::int as "formSuccesses",
        coalesce(ce.signup_events, 0)::int as "signupEvents"
      from waitlist w
      left join waitlist_profile wp on wp.waitlist_id = w.id
      left join referral_counts rc on rc.referred_by_code = w.referral_code
      left join event_counts ec on ec.waitlist_id = w.id
      left join code_events ce on ce.code = w.referral_code
      where coalesce(rc.total_invites, 0) > 0
         or coalesce(ec.share_actions, 0) > 0
         or coalesce(ce.link_views, 0) > 0
      order by
        coalesce(rc.confirmed_invites, 0) desc,
        coalesce(rc.total_invites, 0) desc,
        coalesce(ce.link_visitors, 0) desc,
        coalesce(ec.share_actions, 0) desc
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
        count(*) filter (where event_name = 'milestone_email_send_failed')::int as "milestoneFailed",
        count(*) filter (where event_name like 'lifecycle_%_email_sent')::int as "lifecycleSent",
        count(*) filter (where event_name like 'lifecycle_%_email_send_failed')::int as "lifecycleFailed",
        count(*) filter (where event_name = 'email_delivered')::int as "delivered",
        count(*) filter (where event_name = 'email_opened')::int as "opened",
        count(*) filter (where event_name = 'email_clicked')::int as "clicked",
        count(*) filter (where event_name = 'email_bounced')::int as "bounced",
        count(*) filter (where event_name = 'email_complained')::int as "complained"
      from waitlist_events
      where created_at >= now() - interval '30 days'
    `),
  );

  const [emailHealth] = rows<EmailHealthRow>(
    await db.execute(sql`
      select
        (
          select count(distinct w.id)::int
          from waitlist w
          where exists (
            select 1
            from waitlist_events e
            where e.waitlist_id = w.id
              and (
                e.event_name in ('email_bounced', 'email_complained', 'email_suppressed')
                or (
                  e.event_name = 'waitlist_email_suppressed'
                  and e.metadata->>'reason' = 'provider_signal'
                )
              )
          )
        ) as "hardBlocked",
        (
          select count(distinct waitlist_id)::int
          from waitlist_events
          where event_name = 'email_bounced'
        ) as "bouncedPeople",
        (
          select count(distinct waitlist_id)::int
          from waitlist_events
          where event_name = 'email_complained'
        ) as "complainedPeople",
        (
          select count(distinct w.id)::int
          from waitlist w
          where exists (
            select 1
            from waitlist_events e
            where e.waitlist_id = w.id
              and (
                e.event_name = 'email_suppressed'
                or (
                  e.event_name = 'waitlist_email_suppressed'
                  and e.metadata->>'reason' = 'provider_signal'
                )
              )
          )
        ) as "providerSuppressedPeople",
        (
          select count(distinct e.waitlist_id)::int
          from waitlist_events e
          where e.event_name = 'waitlist_email_suppressed'
            and e.metadata->>'reason' = 'unconfirmed_7d'
            and not exists (
              select 1
              from waitlist_events reactivated
              where reactivated.waitlist_id = e.waitlist_id
                and reactivated.event_name = 'waitlist_email_reactivated'
                and reactivated.created_at > e.created_at
            )
        ) as "pausedUnconfirmed",
        (
          select count(distinct e.waitlist_id)::int
          from waitlist_events e
          where e.event_name = 'waitlist_email_archived'
            and e.metadata->>'reason' = 'unconfirmed_30d'
            and not exists (
              select 1
              from waitlist_events reactivated
              where reactivated.waitlist_id = e.waitlist_id
                and reactivated.event_name = 'waitlist_email_reactivated'
                and reactivated.created_at > e.created_at
            )
        ) as "archivedUnconfirmed",
        (
          select count(*)::int
          from waitlist_events
          where event_name = 'waitlist_email_reactivated'
        ) as "reactivated",
        (
          select count(*)::int
          from waitlist_events
          where event_name = 'waitlist_existing_email_blocked'
        ) as "blockedResends",
        (
          select count(*)::int
          from waitlist w
          where w.confirmed_at is null
            and w.created_at <= now() - interval '24 hours'
            and w.created_at > now() - interval '7 days'
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
            and not exists (
              select 1
              from waitlist_events reminder_event
              where reminder_event.waitlist_id = w.id
                and reminder_event.event_name in (
                  'lifecycle_invited_unconfirmed_1h_email_sent',
                  'lifecycle_invited_unconfirmed_1h_email_send_failed',
                  'lifecycle_unconfirmed_1h_email_sent',
                  'lifecycle_unconfirmed_1h_email_send_failed',
                  'lifecycle_unconfirmed_24h_email_sent',
                  'lifecycle_unconfirmed_24h_email_send_failed'
                )
            )
        ) as "pendingReminderWindow",
        (
          select max(created_at)
          from waitlist_events
          where event_name = 'waitlist_maintenance_run'
        ) as "lastMaintenanceAt",
        (
          select max(created_at)
          from waitlist_events
          where event_name = 'waitlist_lifecycle_run'
        ) as "lastLifecycleAt"
    `),
  );

  const emailHygieneEvents = rows<EmailHygieneEventRow>(
    await db.execute(sql`
      select
        event_name as "eventName",
        metadata->>'reason' as reason,
        nullif(metadata->>'selected', '')::int as selected,
        nullif(metadata->>'applied', '')::int as applied,
        created_at as "createdAt"
      from waitlist_events
      where event_name in (
        'waitlist_email_suppressed',
        'waitlist_email_archived',
        'waitlist_email_reactivated',
        'waitlist_existing_email_blocked',
        'waitlist_maintenance_run',
        'waitlist_lifecycle_run'
      )
      order by created_at desc
      limit 10
    `),
  );

  const [productTechnical24h] = rows<ProductTechnicalSummaryRow>(
    await db.execute(sql`
      with real_events as (
        select pe.*
        from product_events pe
        left join users u on u.id = pe.user_id
        where pe.created_at >= now() - interval '24 hours'
          and pe.event_name in (
            'product_transcription_attempted',
            'product_transcription_succeeded',
            'product_transcription_failed',
            'product_reflection_attempted',
            'product_reflection_succeeded',
            'product_reflection_fallback_saved',
            'product_reflection_failed',
            'product_reflection_received'
          )
          and lower(coalesce(u.email, '')) not like '%test%'
          and lower(coalesce(u.email, '')) not like '%launchtest%'
          and lower(coalesce(u.email, '')) not like '%example.%'
          and lower(coalesce(u.email, '')) not like '%leonardocamacho%'
      )
      select
        count(*)::int as events,
        count(distinct coalesce(metadata->>'request_id', id::text))::int as requests,
        count(distinct user_id)::int as people,
        count(*) filter (
          where event_name in (
            'product_transcription_failed',
            'product_reflection_fallback_saved',
            'product_reflection_failed'
          )
        )::int as "failureEvents",
        count(distinct coalesce(metadata->>'request_id', id::text)) filter (
          where event_name in (
            'product_transcription_failed',
            'product_reflection_fallback_saved',
            'product_reflection_failed'
          )
        )::int as "failureRequests",
        count(distinct user_id) filter (
          where event_name in (
            'product_transcription_failed',
            'product_reflection_fallback_saved',
            'product_reflection_failed'
          )
        )::int as "failurePeople",
        count(distinct coalesce(metadata->>'request_id', id::text)) filter (
          where event_name in (
            'product_transcription_failed',
            'product_reflection_fallback_saved',
            'product_reflection_failed'
          )
            and metadata->>'retryable' = 'true'
        )::int as "retryableFailures",
        count(distinct coalesce(metadata->>'request_id', id::text)) filter (
          where event_name in (
            'product_transcription_failed',
            'product_reflection_fallback_saved',
            'product_reflection_failed'
          )
            and metadata->>'retryable' = 'false'
        )::int as "nonRetryableFailures",
        max(created_at) as "latestEventAt",
        max(created_at) filter (
          where event_name in (
            'product_transcription_failed',
            'product_reflection_fallback_saved',
            'product_reflection_failed'
          )
        ) as "latestFailureAt"
      from real_events
    `),
  );

  const [productTechnicalSinceAlpha] = rows<ProductTechnicalSummaryRow>(
    await db.execute(sql`
      with real_events as (
        select pe.*
        from product_events pe
        left join users u on u.id = pe.user_id
        where pe.created_at >= cast(${ALPHA_COHORT_START} as timestamptz)
          and pe.event_name in (
            'product_transcription_attempted',
            'product_transcription_succeeded',
            'product_transcription_failed',
            'product_reflection_attempted',
            'product_reflection_succeeded',
            'product_reflection_fallback_saved',
            'product_reflection_failed',
            'product_reflection_received'
          )
          and lower(coalesce(u.email, '')) not like '%test%'
          and lower(coalesce(u.email, '')) not like '%launchtest%'
          and lower(coalesce(u.email, '')) not like '%example.%'
          and lower(coalesce(u.email, '')) not like '%leonardocamacho%'
      )
      select
        count(*)::int as events,
        count(distinct coalesce(metadata->>'request_id', id::text))::int as requests,
        count(distinct user_id)::int as people,
        count(*) filter (
          where event_name in (
            'product_transcription_failed',
            'product_reflection_fallback_saved',
            'product_reflection_failed'
          )
        )::int as "failureEvents",
        count(distinct coalesce(metadata->>'request_id', id::text)) filter (
          where event_name in (
            'product_transcription_failed',
            'product_reflection_fallback_saved',
            'product_reflection_failed'
          )
        )::int as "failureRequests",
        count(distinct user_id) filter (
          where event_name in (
            'product_transcription_failed',
            'product_reflection_fallback_saved',
            'product_reflection_failed'
          )
        )::int as "failurePeople",
        count(distinct coalesce(metadata->>'request_id', id::text)) filter (
          where event_name in (
            'product_transcription_failed',
            'product_reflection_fallback_saved',
            'product_reflection_failed'
          )
            and metadata->>'retryable' = 'true'
        )::int as "retryableFailures",
        count(distinct coalesce(metadata->>'request_id', id::text)) filter (
          where event_name in (
            'product_transcription_failed',
            'product_reflection_fallback_saved',
            'product_reflection_failed'
          )
            and metadata->>'retryable' = 'false'
        )::int as "nonRetryableFailures",
        max(created_at) as "latestEventAt",
        max(created_at) filter (
          where event_name in (
            'product_transcription_failed',
            'product_reflection_fallback_saved',
            'product_reflection_failed'
          )
        ) as "latestFailureAt"
      from real_events
    `),
  );

  const productFailureAlerts24h = rows<ProductFailureAlertRow>(
    await db.execute(sql`
      select
        coalesce(nullif(pe.metadata->>'error_class', ''), 'sem classe') as "errorClass",
        coalesce(nullif(pe.metadata->>'retryable', ''), 'desconhecido') as retryable,
        count(distinct coalesce(pe.metadata->>'request_id', pe.id::text))::int as requests,
        count(distinct pe.user_id)::int as people,
        max(pe.created_at) as "latestAt"
      from product_events pe
      left join users u on u.id = pe.user_id
      where pe.created_at >= now() - interval '24 hours'
        and pe.event_name in (
          'product_transcription_failed',
          'product_reflection_fallback_saved',
          'product_reflection_failed'
        )
        and lower(coalesce(u.email, '')) not like '%test%'
        and lower(coalesce(u.email, '')) not like '%launchtest%'
        and lower(coalesce(u.email, '')) not like '%example.%'
        and lower(coalesce(u.email, '')) not like '%leonardocamacho%'
      group by 1, 2
      order by requests desc, "latestAt" desc
      limit 8
    `),
  );

  const productFailureAlertsSinceAlpha = rows<ProductFailureAlertRow>(
    await db.execute(sql`
      select
        coalesce(nullif(pe.metadata->>'error_class', ''), 'sem classe') as "errorClass",
        coalesce(nullif(pe.metadata->>'retryable', ''), 'desconhecido') as retryable,
        count(distinct coalesce(pe.metadata->>'request_id', pe.id::text))::int as requests,
        count(distinct pe.user_id)::int as people,
        max(pe.created_at) as "latestAt"
      from product_events pe
      left join users u on u.id = pe.user_id
      where pe.created_at >= cast(${ALPHA_COHORT_START} as timestamptz)
        and pe.event_name in (
          'product_transcription_failed',
          'product_reflection_fallback_saved',
          'product_reflection_failed'
        )
        and lower(coalesce(u.email, '')) not like '%test%'
        and lower(coalesce(u.email, '')) not like '%launchtest%'
        and lower(coalesce(u.email, '')) not like '%example.%'
        and lower(coalesce(u.email, '')) not like '%leonardocamacho%'
      group by 1, 2
      order by requests desc, "latestAt" desc
      limit 8
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
          where event_name in ('landing_viewed', 'launch_page_viewed', 'launch_cta_clicked', 'waitlist_submit_success')
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
        count(*) filter (where event_name in ('landing_viewed', 'launch_page_viewed'))::int as "pageviews",
        count(distinct metadata->>'distinctId') filter (where event_name in ('landing_viewed', 'launch_page_viewed'))::int as "visitors",
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
      where event_name in ('landing_viewed', 'launch_page_viewed')
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
      where event_name in ('landing_viewed', 'launch_page_viewed', 'launch_cta_clicked', 'waitlist_submit_success', 'signup_created')
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
          and event_name in ('landing_viewed', 'launch_page_viewed', 'launch_cta_clicked', 'waitlist_submit_success', 'signup_created')
      ),
      page_distinct as (
        select distinct metadata->>'distinctId' as distinct_id
        from campaign_events
        where event_name in ('landing_viewed', 'launch_page_viewed')
          and nullif(metadata->>'distinctId', '') is not null
      )
      select
        count(*)::int as "campaignSignals",
        count(distinct coalesce(
          nullif(metadata->>'distinctId', ''),
          waitlist_id::text,
          nullif(metadata->>'sessionId', '')
        ))::int as "campaignPeople",
        count(*) filter (where event_name in ('landing_viewed', 'launch_page_viewed'))::int as "pageviews",
        count(distinct metadata->>'distinctId') filter (where event_name in ('landing_viewed', 'launch_page_viewed'))::int as "visitors",
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
        and event_name in ('landing_viewed', 'launch_page_viewed', 'launch_cta_clicked', 'waitlist_submit_success', 'signup_created')
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
        and event_name in ('landing_viewed', 'launch_page_viewed', 'launch_cta_clicked', 'waitlist_submit_success', 'signup_created')
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
      lifecycleSent: asNumber(email?.lifecycleSent),
      lifecycleFailed: asNumber(email?.lifecycleFailed),
      delivered: asNumber(email?.delivered),
      opened: asNumber(email?.opened),
      clicked: asNumber(email?.clicked),
      bounced: asNumber(email?.bounced),
      complained: asNumber(email?.complained),
    },
    emailHealth: {
      hardBlocked: asNumber(emailHealth?.hardBlocked),
      bouncedPeople: asNumber(emailHealth?.bouncedPeople),
      complainedPeople: asNumber(emailHealth?.complainedPeople),
      providerSuppressedPeople: asNumber(emailHealth?.providerSuppressedPeople),
      pausedUnconfirmed: asNumber(emailHealth?.pausedUnconfirmed),
      archivedUnconfirmed: asNumber(emailHealth?.archivedUnconfirmed),
      reactivated: asNumber(emailHealth?.reactivated),
      blockedResends: asNumber(emailHealth?.blockedResends),
      pendingReminderWindow: asNumber(emailHealth?.pendingReminderWindow),
      lastMaintenanceAt: emailHealth?.lastMaintenanceAt ?? null,
      lastLifecycleAt: emailHealth?.lastLifecycleAt ?? null,
    },
    emailHygieneEvents,
    productTechnical24h: {
      events: asNumber(productTechnical24h?.events),
      requests: asNumber(productTechnical24h?.requests),
      people: asNumber(productTechnical24h?.people),
      failureEvents: asNumber(productTechnical24h?.failureEvents),
      failureRequests: asNumber(productTechnical24h?.failureRequests),
      failurePeople: asNumber(productTechnical24h?.failurePeople),
      retryableFailures: asNumber(productTechnical24h?.retryableFailures),
      nonRetryableFailures: asNumber(productTechnical24h?.nonRetryableFailures),
      latestEventAt: productTechnical24h?.latestEventAt ?? null,
      latestFailureAt: productTechnical24h?.latestFailureAt ?? null,
    },
    productTechnicalSinceAlpha: {
      events: asNumber(productTechnicalSinceAlpha?.events),
      requests: asNumber(productTechnicalSinceAlpha?.requests),
      people: asNumber(productTechnicalSinceAlpha?.people),
      failureEvents: asNumber(productTechnicalSinceAlpha?.failureEvents),
      failureRequests: asNumber(productTechnicalSinceAlpha?.failureRequests),
      failurePeople: asNumber(productTechnicalSinceAlpha?.failurePeople),
      retryableFailures: asNumber(productTechnicalSinceAlpha?.retryableFailures),
      nonRetryableFailures: asNumber(productTechnicalSinceAlpha?.nonRetryableFailures),
      latestEventAt: productTechnicalSinceAlpha?.latestEventAt ?? null,
      latestFailureAt: productTechnicalSinceAlpha?.latestFailureAt ?? null,
    },
    productFailureAlerts24h,
    productFailureAlertsSinceAlpha,
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
      campaignSignals: asNumber(launchCampaign?.campaignSignals),
      campaignPeople: asNumber(launchCampaign?.campaignPeople),
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
    data.email.confirmFailed +
    data.email.statusFailed +
    data.email.friendFailed +
    data.email.milestoneFailed +
    data.email.lifecycleFailed;
  const emailSent =
    data.email.confirmSent +
    data.email.statusSent +
    data.email.friendSent +
    data.email.milestoneSent +
    data.email.lifecycleSent;
  const emailHardSignalNote = `${data.emailHealth.bouncedPeople} bounce, ${data.emailHealth.complainedPeople} complaint, ${data.emailHealth.providerSuppressedPeople} suppressed`;
  const productTechnicalStatusNote = data.productTechnical24h.failureRequests
    ? `${data.productTechnical24h.failureRequests} requests com falha`
    : "Sem falhas nas últimas 24h";
  const productTechnicalTone = data.productTechnical24h.failureRequests ? "warn" : "good";
  const productTechnicalLatestNote = data.productTechnical24h.latestEventAt
    ? `Último evento: ${formatDate(data.productTechnical24h.latestEventAt)}`
    : "Sem evento técnico nas últimas 24h";
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
  const maintenanceDryRunHref = `/api/waitlist/maintenance?token=${encodeURIComponent(adminToken)}&dryRun=1`;
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
            definition={help.dataHealth}
          />
          <SignalRow
            label="Pendentes acima de 24h"
            value={`${data.health.stalePending} pessoas`}
            note="Quem entrou e ainda não confirmou email"
            tone={data.health.stalePending === 0 ? "good" : "warn"}
            definition={help.stalePending}
          />
          <SignalRow
            label="Emails enviados"
            value={`${emailSent}`}
            note={`${data.email.delivered} delivered, ${data.email.bounced} bounces, ${data.email.complained} complaints`}
            tone={emailFailures === 0 && data.email.bounced === 0 && data.email.complained === 0 ? "good" : "warn"}
            definition={help.emailsSent}
          />
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Lançamento</h2>
            <p>O essencial: lista, confirmação, convite e Ritual de Chegada.</p>
          </div>
          <div className={styles.grid}>
            <MetricCard value={compactNumber(data.summary.total)} label="Pessoas na lista" note={`${data.summary.signups7} novas nos últimos 7 dias`} definition={help.totalList} />
            <MetricCard value={compactNumber(data.summary.confirmed)} label="Emails confirmados" note={`${percent(data.summary.confirmed, data.summary.total)} da lista confirmou`} definition={help.confirmedEmails} />
            <MetricCard value={compactNumber(data.network.invitedConfirmed)} label="Convidados confirmados" note={`${data.network.invitedTotal} convidados gerados pela rede`} definition={help.confirmedInvited} />
            <MetricCard value={compactNumber(data.profile.complete)} label="Rituais completos" note={`${data.profile.started} pessoas começaram o Ritual`} definition={help.ritualsComplete} />
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Email</h2>
            <p>Envios transacionais da waitlist e sinais recebidos pelo webhook do Resend.</p>
          </div>
          <div className={styles.grid}>
            <MetricCard
              value={compactNumber(data.email.confirmSent)}
              label="Confirmações enviadas"
              note={`${data.email.confirmFailed} falhas ao enviar confirmação`}
              tone={data.email.confirmFailed ? "warn" : "neutral"}
              definition={help.confirmSent}
            />
            <MetricCard
              value={compactNumber(data.email.statusSent)}
              label="Links de status enviados"
              note={`${data.email.statusFailed} falhas ao enviar sala/status`}
              tone={data.email.statusFailed ? "warn" : "neutral"}
              definition={help.statusSent}
            />
            <MetricCard
              value={compactNumber(data.email.friendSent)}
              label="Avisos de convidado"
              note={`${data.email.friendFailed} falhas ao avisar convidante`}
              tone={data.email.friendFailed ? "warn" : "neutral"}
              definition={help.friendSent}
            />
            <MetricCard
              value={compactNumber(data.email.milestoneSent)}
              label="Marcos enviados"
              note={`${data.email.milestoneFailed} falhas em emails de marco`}
              tone={data.email.milestoneFailed ? "warn" : "neutral"}
              definition={help.milestoneSent}
            />
            <MetricCard
              value={compactNumber(data.email.lifecycleSent)}
              label="Cadência enviada"
              note={`${data.email.lifecycleFailed} falhas em emails de lifecycle`}
              tone={data.email.lifecycleFailed ? "warn" : "neutral"}
              definition={help.lifecycleSent}
            />
            <MetricCard
              value={compactNumber(data.email.delivered)}
              label="Delivered"
              note={`${data.email.opened} aberturas e ${data.email.clicked} cliques registrados`}
              tone="neutral"
              definition={help.delivered}
            />
            <MetricCard
              value={compactNumber(data.email.bounced)}
              label="Bounces"
              note={`${data.email.complained} complaints nos últimos 30 dias`}
              tone={data.email.bounced || data.email.complained ? "warn" : "good"}
              definition={help.bounces}
            />
          </div>
          <div className={styles.noteCard}>
            Webhook Resend: eventos assinados são gravados sem conteúdo do email e sem armazenar destinatário em metadata.
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Saúde de e-mail</h2>
              <p>Higiene da lista para proteger entrega, IP e esforço de comunicação.</p>
            </div>
            <form className={styles.inlineForm} action={maintenanceDryRunHref} method="post">
              <button className={styles.secondary} type="submit">
                Rodar dry-run
              </button>
            </form>
          </div>
          <div className={styles.grid}>
            <MetricCard
              value={compactNumber(data.emailHealth.hardBlocked)}
              label="Bloqueios duros"
              note={emailHardSignalNote}
              tone={data.emailHealth.hardBlocked ? "warn" : "good"}
              definition={help.hardBlocked}
            />
            <MetricCard
              value={compactNumber(data.emailHealth.pausedUnconfirmed)}
              label="Pausados 7+ dias"
              note="Não confirmaram e saíram da cadência ativa"
              tone={data.emailHealth.pausedUnconfirmed ? "warn" : "good"}
              definition={help.paused7d}
            />
            <MetricCard
              value={compactNumber(data.emailHealth.archivedUnconfirmed)}
              label="Arquivados 30+ dias"
              note="Preservados no histórico, fora da operação"
              tone={data.emailHealth.archivedUnconfirmed ? "warn" : "good"}
              definition={help.archived30d}
            />
            <MetricCard
              value={compactNumber(data.emailHealth.reactivated)}
              label="Reativados"
              note="Pessoas que voltaram ao formulário por vontade própria"
              tone="neutral"
              definition={help.reactivated}
            />
          </div>
          <div className={styles.split}>
            <div className={styles.signalCard}>
              <SignalRow
                label="Última manutenção"
                value={data.emailHealth.lastMaintenanceAt ? formatDate(data.emailHealth.lastMaintenanceAt) : "sem execução"}
                note="Execução real do cron; dry-run não altera banco"
                tone={data.emailHealth.lastMaintenanceAt ? "good" : "warn"}
              />
              <SignalRow
                label="Último lifecycle"
                value={data.emailHealth.lastLifecycleAt ? formatDate(data.emailHealth.lastLifecycleAt) : "sem execução"}
                note="Rotina que roda higiene antes dos envios"
                tone={data.emailHealth.lastLifecycleAt ? "good" : "warn"}
              />
              <SignalRow
                label="Na janela de lembrete"
                value={`${data.emailHealth.pendingReminderWindow}`}
                note="Não confirmados entre 24h e 7d, sem bloqueio ativo"
                tone={data.emailHealth.pendingReminderWindow ? "neutral" : "good"}
              />
              <SignalRow
                label="Reenvios bloqueados"
                value={`${data.emailHealth.blockedResends}`}
                note="Tentativas no formulário barradas por sinal duro"
                tone={data.emailHealth.blockedResends ? "warn" : "good"}
              />
            </div>
            <div className={styles.tableCard}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Evento</th>
                    <th>Motivo</th>
                    <th>Volume</th>
                    <th>Quando</th>
                  </tr>
                </thead>
                <tbody>
                  {data.emailHygieneEvents.length ? (
                    data.emailHygieneEvents.map((event, index) => (
                      <tr key={`${event.eventName}-${dateKey(event.createdAt)}-${index}`}>
                        <td>{emailHygieneLabel(event.eventName)}</td>
                        <td>{emailHygieneReason(event.reason)}</td>
                        <td>{event.selected === null ? "-" : `${event.applied ?? 0}/${event.selected}`}</td>
                        <td>{formatDate(event.createdAt)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4}>Nenhum evento de higiene registrado ainda.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Alertas técnicos</h2>
              <p>Transcrição e reflexão no Alpha, deduplicadas por request e sem conteúdo sensível.</p>
            </div>
          </div>
          <div className={styles.grid}>
            <MetricCard
              value={compactNumber(data.productTechnical24h.failureRequests)}
              label="Falhas 24h"
              note={`${productTechnicalStatusNote}; ${data.productTechnical24h.failureEvents} eventos de falha em ${data.productTechnical24h.events} eventos técnicos`}
              tone={productTechnicalTone}
              definition={help.technicalStatus}
            />
            <MetricCard
              value={compactNumber(data.productTechnical24h.failurePeople)}
              label="Pessoas afetadas"
              note={`${compactNumber(data.productTechnical24h.requests)} requests técnicos nas últimas 24h`}
              tone={data.productTechnical24h.failurePeople ? "warn" : "good"}
              definition={help.technicalPeople}
            />
            <MetricCard
              value={`${data.productTechnical24h.retryableFailures}/${data.productTechnical24h.nonRetryableFailures}`}
              label="Retryable / não"
              note="Requests únicos com falha"
              tone={data.productTechnical24h.nonRetryableFailures ? "warn" : "neutral"}
              definition={help.technicalRetryable}
            />
            <MetricCard
              value={data.productTechnical24h.latestFailureAt ? formatDate(data.productTechnical24h.latestFailureAt) : "sem falha"}
              label="Última falha"
              note={productTechnicalLatestNote}
              tone={data.productTechnical24h.latestFailureAt ? "warn" : "good"}
              definition={help.technicalLatest}
            />
          </div>
          <div className={styles.split}>
            <ProductFailureAlertTable
              title="Falhas nas últimas 24h"
              rows={data.productFailureAlerts24h}
              empty="Sem falhas técnicas nas últimas 24h."
            />
            <ProductFailureAlertTable
              title="Falhas desde Alpha"
              rows={data.productFailureAlertsSinceAlpha}
              empty="Sem falhas técnicas registradas desde o início Alpha."
            />
          </div>
          <div className={styles.noteCard}>
            Desde Alpha: {compactNumber(data.productTechnicalSinceAlpha.failureRequests)} requests com falha em{" "}
            {compactNumber(data.productTechnicalSinceAlpha.requests)} requests técnicos de{" "}
            {compactNumber(data.productTechnicalSinceAlpha.people)} pessoas reais. A leitura exclui contas internas/teste e usa
            apenas metadata segura: request_id, attempt, error_class e retryable.
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Rede de convites</h2>
            <p>Convidante é quem compartilha. Convidados são as pessoas que entram pelo código. Confirmados são convidados que validaram email.</p>
          </div>
          <div className={styles.grid}>
            <MetricCard value={compactNumber(data.network.activeInviters)} label="Convidantes ativos" note="Pessoas que geraram ao menos um convidado" definition={help.activeInviters} />
            <MetricCard value={compactNumber(data.network.invitedTotal)} label="Convidados gerados" note={`${data.network.invitedConfirmed} confirmaram email`} definition={help.invitedTotal} />
            <MetricCard value={ratio(data.network.invitedConfirmed, data.network.activeInviters)} label="Confirmados por convidante" note="Média entre convidantes ativos" definition={help.confirmedPerInviter} />
            <MetricCard value={percent(data.network.invitedConfirmed, data.network.invitedTotal)} label="Confirmação dos convidados" note="Convidados confirmados sobre convidados gerados" definition={help.inviteConfirmRate} />
            <MetricCard value={compactNumber(shareEvents.total)} label="Compartilhamentos" note={`${shareEvents.unique} pessoas acionaram compartilhar`} definition={help.shareActions} />
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
                    <th title="Linhas da waitlist cujo referred_by_code é o código dessa pessoa.">Convidados</th>
                    <th title="Convidados com confirmed_at preenchido.">Confirmados</th>
                    <th title="Visitantes únicos e envios bem-sucedidos no navegador com o código dessa pessoa. Não é a contagem oficial de cadastros.">Sinais do link</th>
                    <th title="Cliques para copiar, compartilhar ou abrir WhatsApp feitos pela convidante.">Compart.</th>
                    <th title="Confirmados divididos por convidados gerados.">Taxa</th>
                    <th title="Data da última confirmação de convidado.">Último</th>
                    <th title="Maior marco de convite já notificado para essa pessoa.">Marco</th>
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
                      <td title={`${person.linkViews} pageviews, ${person.formSuccesses} sucessos no client, ${person.signupEvents} cadastros server-side`}>
                        {person.linkVisitors}/{person.formSuccesses}
                      </td>
                      <td>{person.shareActions}</td>
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
                  <th title="Convidados com referred_by_code da pessoa e confirmed_at preenchido.">Convidados confirmados</th>
                  <th title="Eventos de copiar, compartilhar ou WhatsApp.">Compartilhamentos</th>
                  <th title="Eventos referral_room_viewed ligados ao status/convite da pessoa.">Sala</th>
                  <th title="Completo quando moment, rhythm, presence e value estão preenchidos no waitlist_profile.">Ritual</th>
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
            <p>Recorte por UTM oficial. Os volumes abaixo vêm dos eventos e cadastros marcados com a campanha.</p>
          </div>
          <div className={styles.grid}>
            <MetricCard
              value={compactNumber(data.launchCampaign.campaignSignals)}
              label="Sinais da campanha"
              note={
                data.launchCampaign.pageviews
                  ? `${compactNumber(data.launchCampaign.pageviews)} pageviews com UTM`
                  : `${compactNumber(data.launchCampaign.campaignPeople)} pessoas/sessões identificáveis`
              }
              definition={help.campaignSignals}
            />
            <MetricCard
              value={compactNumber(data.launchCampaign.ctaClicks)}
              label="Cliques em CTA"
              note={
                data.launchCampaign.ctaClicks
                  ? `${percent(data.launchCampaign.ctaClicks, data.launchCampaign.campaignSignals)} dos sinais da campanha`
                  : "Nenhum clique de CTA com esta UTM"
              }
              definition={help.campaignCtas}
            />
            <MetricCard
              value={compactNumber(data.launchCampaign.signups)}
              label="Cadastros com UTM"
              note={`${compactNumber(data.launchCampaign.clientSignupSuccess)} sucessos capturados no client`}
              definition={help.campaignSignups}
            />
            <MetricCard
              value={percent(data.launchCampaign.signups, data.launchCampaign.campaignSignals)}
              label="Cadastro por sinal"
              note={`${compactNumber(data.launchCampaign.signups)} cadastros / ${compactNumber(data.launchCampaign.campaignSignals)} sinais UTM`}
              definition={help.campaignConversion}
            />
          </div>
          <div className={styles.gridThree}>
            <BreakdownList title="Canais do lançamento" rows={data.launchCampaignSources} definition="Eventos da campanha agrupados por utm_source, source_type ou source." />
            <BreakdownList title="Peças do lançamento" rows={data.launchCampaignContent} definition="Eventos da campanha agrupados por utm_content." />
            <BreakdownList title="CTAs da campanha" rows={data.launchCampaignCtas} empty="Sem clique de CTA capturado com esta UTM." definition="Cliques em CTA com utm_campaign=launch_waitlist agrupados por label/source." />
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Tráfego e conversão</h2>
            <p>Leitura first-party geral dos últimos 30 dias.</p>
          </div>
          <div className={styles.grid}>
            <MetricCard value={compactNumber(data.traffic.pageviews)} label="Pageviews" note={`${compactNumber(data.traffic.visitors)} visitantes identificados por navegador`} definition={help.pageviews} />
            <MetricCard value={percentOrNA(data.summary.signups30, data.traffic.visitors, "sem base")} label="Visitante para cadastro" note={`${compactNumber(data.summary.signups30)} cadastros no período`} definition={help.visitorSignupRate} />
            <MetricCard value={percentOrNA(data.traffic.ctaClicks, data.traffic.visitors, "sem base")} label="Visitante para CTA" note={`${compactNumber(data.traffic.ctaClicks)} cliques rastreados`} definition={help.visitorCtaRate} />
            <MetricCard value={compactNumber(data.traffic.clientSignupSuccess)} label="Sucessos no client" note="Confirmações de envio capturadas no navegador" definition={help.clientSuccess} />
          </div>
          <div className={styles.quadSplit}>
            <BreakdownList title="Páginas mais vistas" rows={data.topPages} definition={help.topPages} />
            <BreakdownList title="Fontes de tráfego" rows={data.trafficSources} definition={help.trafficSources} />
            <BreakdownList title="CTAs mais acionados" rows={data.topCtas} definition={help.topCtas} />
            <BreakdownList title="Origem dos cadastros" rows={data.signupSources} definition={help.signupSources} />
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
