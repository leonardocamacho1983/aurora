import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { waitlist, waitlistEvents, waitlistProfile } from "@/lib/db/schema";
import { focusDefinitions } from "@/lib/mapa/focus";
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

type SearchParams = Promise<{ token?: string; tab?: string }>;
type AdminTab = "launch" | "access" | "product";

const ALPHA_COHORT_START = "2026-06-19T00:00:00.000Z";
const ALPHA_COHORT_LABEL = "desde 19/06/2026";
const focusDefinitionMap = new Map<string, { label: string }>(
  focusDefinitions().map((focus) => [focus.key, focus]),
);

const adminTabs: Array<{ id: AdminTab; label: string; description: string }> = [
  { id: "launch", label: "Launch", description: "waitlist, email e rede" },
  { id: "access", label: "Access", description: "convites e entrada" },
  { id: "product", label: "Product", description: "Alpha, retorno e PMF leve" },
];

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

type FlaggedRow = {
  reason: string;
  createdAt: Date | string;
};

type EngagedRow = {
  referralCode: string;
  confirmedInvites: number;
  shareActions: number;
  roomViews: number;
  ritualComplete: boolean;
};

type AccessSummaryRow = {
  invites: number;
  sent: number;
  clicked: number;
  accountCreated: number;
  loginCompleted: number;
  onboardingStarted: number;
  onboardingCompleted: number;
  firstReflectionCompleted: number;
  excludedByEmail: number;
};

type AccessEventRow = {
  eventName: string;
  source: string | null;
  total: number;
  people: number;
};

type ProductSummaryRow = {
  users: number;
  activeUsers: number;
  activatedUsers: number;
  returningUsers: number;
  intenseNoReturnUsers: number;
  entries: number;
  reflectedEntries: number;
  transcribedEntries: number;
  continuedEntries: number;
  threads: number;
  productEvents: number;
  transcriptionFailures: number;
  reflectionFailures: number;
  lowRiskEntries: number;
  highRiskEntries: number;
};

type AlphaUserRow = {
  anonUser: string;
  entries: number;
  entryDays: number;
  activeDays: number;
  productEvents: number;
  reflectedEntries: number;
  continuations: number;
  transcriptionFailures: number;
  reflectionFailures: number;
  firstSeenAt: Date | string | null;
  lastSeenAt: Date | string | null;
  bucket: string;
};

type ExclusionAuditRow = {
  reason: string;
  users: number;
  accessInvites: number;
  waitlistRows: number;
};

type AlphaQualitativeSummaryRow = {
  confirmedWaitlistReal: number;
  unlockedReal: number;
  profileStarted: number;
  profileComplete: number;
  hasValueAnswer: number;
  hasMomentAnswer: number;
};

type PmfDeclaredSummaryRow = {
  promptsShown: number;
  peoplePrompted: number;
  answered: number;
  peopleAnswered: number;
  skipped: number;
  snoozed: number;
  veryDisappointed: number;
  somewhatDisappointed: number;
  notDisappointed: number;
  notSureYet: number;
  microPositive: number;
  microNegative: number;
};

type MapaFocusSummaryRow = {
  entries: number;
  eligibleEntries: number;
  classifiedEntries: number;
  visibleFocusEntries: number;
  hiddenFocusEntries: number;
  resolvedPointEntries: number;
  noFocusEntries: number;
  pendingFocusEntries: number;
  stalePendingEntries: number;
  usersWithFocus: number;
  highConfidenceEntries: number;
  mediumConfidenceEntries: number;
  lowConfidenceEntries: number;
  latestClassifiedAt: Date | string | null;
};

type MapaUsageRow = {
  mapaViews: number;
  mapaViewers: number;
  focusViews: number;
  focusCardClicks: number;
  focusChipClicks: number;
  entryOpens: number;
  focusHiddenEvents: number;
  focusHiddenPeople: number;
  focusPointResolvedEvents: number;
  focusPointResolvedPeople: number;
  focusPointReopenedEvents: number;
};

type MapaFocusDistributionRow = {
  focusKey: string;
  visibleEntries: number;
  users: number;
  hiddenEntries: number;
  resolvedEntries: number;
  highConfidence: number;
  mediumConfidence: number;
  latestClassifiedAt: Date | string | null;
};

type MapaFocusCorrectionRow = {
  focusKey: string;
  total: number;
  people: number;
  latestAt: Date | string | null;
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

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function parseAdminTab(value: string | undefined): AdminTab {
  return value === "access" || value === "product" ? value : "launch";
}

function adminHref(token: string, tab: AdminTab) {
  const params = new URLSearchParams({ token });
  if (tab !== "launch") params.set("tab", tab);
  return `/admin?${params.toString()}`;
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

function focusLabel(focusKey: string) {
  return focusDefinitionMap.get(focusKey)?.label ?? focusKey;
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
  accessInvites: "Convites Alpha criados desde 19/06/2026, excluindo emails internos ou de teste.",
  accessFirstReflection: "Convites que chegaram ao primeiro valor observável: primeira reflexão concluída.",
  pmfLight: "PMF leve do Alpha: usuários ativados que voltaram em outro dia ou continuaram um fio. É leitura prática, não PMF estatístico.",
  pmfDeclared: "PMF declarada: resposta opcional à pergunta de perda. Complementa retorno real; não substitui comportamento observado.",
  activatedUsers: "Usuários reais com ao menos uma entrada refletida desde 19/06/2026.",
  returningUsers: "Usuários ativados com atividade em dois ou mais dias, ou continuidade explícita de fio.",
  intenseNoReturn: "Usuários com 3+ reflexões no primeiro dia e nenhum segundo dia de atividade observável.",
  productEvents: "Eventos de produto capturados em product_events desde 19/06/2026, sem conteúdo bruto.",
  safeQualitative: "Distribuições seguras de mood, risco e modo; não renderiza diário, transcrição, reflexão, áudio, nome ou email.",
  mapaCoverage: "Entradas elegíveis são registros reais, sem risco alto, com transcrição ou reflexão. A cobertura mede quantas já passaram pelo classificador oficial.",
  mapaVisibleFocus: "Entradas com foco high ou medium, não removidas e sem ponto resolvido pelo usuário, agrupadas por tema do Mapa.",
  mapaUsage: "Eventos de uso do Mapa capturados em product_events. Mede navegação e abertura de focos, não conteúdo do diário.",
  mapaCorrections: "Correções em que a pessoa removeu uma entrada do Mapa. Ajuda a medir ruído do classificador por foco.",
  mapaBacklog: "Entradas elegíveis ainda sem focus_classified_at. Se cresce, indica backfill pendente, API ausente ou erro operacional.",
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

function TabNav({ token, activeTab }: { token: string; activeTab: AdminTab }) {
  return (
    <nav className={styles.tabs} aria-label="Seções do cockpit">
      {adminTabs.map((tab) => (
        <Link
          className={cx(styles.tab, activeTab === tab.id && styles.activeTab)}
          href={adminHref(token, tab.id)}
          key={tab.id}
        >
          <strong>{tab.label}</strong>
          <span>{tab.description}</span>
        </Link>
      ))}
    </nav>
  );
}

function alphaBucketLabel(bucket: string) {
  const labels: Record<string, string> = {
    retorno_real: "retorno real",
    intenso_sem_retorno: "intenso sem retorno",
    ativado_leve: "ativado leve",
    sinal_inicial: "sinal inicial",
  };
  return labels[bucket] ?? bucket;
}

function AlphaUserTable({ rows: userRows, empty }: { rows: AlphaUserRow[]; empty: string }) {
  return (
    <div className={styles.tableCard}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Usuário</th>
            <th title="Entradas salvas desde 19/06/2026.">Entradas</th>
            <th title="Dias com entrada de diário em America/Sao_Paulo.">Dias diário</th>
            <th title="Dias com entrada ou evento de produto em America/Sao_Paulo.">Dias ativos</th>
            <th title="Entradas com reflexão preenchida.">Reflexões</th>
            <th title="Eventos de product_events no período.">Eventos</th>
            <th title="Transcrição/reflexão com falha capturada como evento operacional.">Falhas</th>
            <th>Último sinal</th>
          </tr>
        </thead>
        <tbody>
          {userRows.length ? (
            userRows.map((user) => (
              <tr key={user.anonUser}>
                <td>
                  <strong>{user.anonUser}</strong>
                  <br />
                  <span className={styles.muted}>{alphaBucketLabel(user.bucket)}</span>
                </td>
                <td>{user.entries}</td>
                <td>{user.entryDays}</td>
                <td>{user.activeDays}</td>
                <td>{user.reflectedEntries}</td>
                <td>{user.productEvents}</td>
                <td>{user.transcriptionFailures + user.reflectionFailures}</td>
                <td>{formatDate(user.lastSeenAt)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={8}>{empty}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function MapaFocusTable({ rows: focusRows }: { rows: MapaFocusDistributionRow[] }) {
  return (
    <div className={styles.tableCard}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Foco</th>
            <th title="Entradas high/medium ainda visíveis no Mapa.">Visíveis</th>
            <th title="Usuários únicos com esse foco visível.">Pessoas</th>
            <th title="Entradas visíveis classificadas com confiança high.">High</th>
            <th title="Entradas visíveis classificadas com confiança medium.">Medium</th>
            <th title="Entradas desse foco removidas do Mapa.">Removidas</th>
            <th title="Pontos corretos, mas resolvidos por agora.">Resolvidos</th>
            <th>Último sinal</th>
          </tr>
        </thead>
        <tbody>
          {focusRows.length ? (
            focusRows.map((focus) => (
              <tr key={focus.focusKey}>
                <td>{focusLabel(focus.focusKey)}</td>
                <td>{focus.visibleEntries}</td>
                <td>{focus.users}</td>
                <td>{focus.highConfidence}</td>
                <td>{focus.mediumConfidence}</td>
                <td>{focus.hiddenEntries}</td>
                <td>{focus.resolvedEntries}</td>
                <td>{formatDate(focus.latestClassifiedAt)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={8}>Ainda não há focos visíveis na coorte.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function MapaCorrectionsTable({ rows: correctionRows }: { rows: MapaFocusCorrectionRow[] }) {
  return (
    <div className={styles.tableCard}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Foco removido</th>
            <th>Correções</th>
            <th>Pessoas</th>
            <th>Última correção</th>
          </tr>
        </thead>
        <tbody>
          {correctionRows.length ? (
            correctionRows.map((row) => (
              <tr key={row.focusKey}>
                <td>{focusLabel(row.focusKey)}</td>
                <td>{row.total}</td>
                <td>{row.people}</td>
                <td>{formatDate(row.latestAt)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4}>Nenhuma remoção de foco registrada ainda.</td>
            </tr>
          )}
        </tbody>
      </table>
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
      hasMoment: sql<boolean>`nullif(trim(${waitlistProfile.moment}), '') is not null`,
      hasRhythm: sql<boolean>`nullif(trim(${waitlistProfile.rhythm}), '') is not null`,
      hasPresence: sql<boolean>`nullif(trim(${waitlistProfile.presence}), '') is not null`,
      hasValue: sql<boolean>`nullif(trim(${waitlistProfile.value}), '') is not null`,
      updatedAt: waitlistProfile.updatedAt,
    })
    .from(waitlistProfile)
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

  const [accessSummary] = rows<AccessSummaryRow>(
    await db.execute(sql`
      with scoped as (
        select *
        from access_invites
        where created_at >= ${ALPHA_COHORT_START}
           or sent_at >= ${ALPHA_COHORT_START}
      ),
      real_invites as (
        select *
        from scoped
        where lower(coalesce(email, '')) not like '%test%'
          and lower(coalesce(email, '')) not like '%launchtest%'
          and lower(coalesce(email, '')) not like '%example.%'
          and lower(coalesce(email, '')) not like '%leonardocamacho%'
      )
      select
        (select count(*)::int from real_invites) as "invites",
        (select count(*)::int from real_invites where sent_at is not null) as "sent",
        (select count(*)::int from real_invites where clicked_at is not null) as "clicked",
        (select count(*)::int from real_invites where account_created_at is not null) as "accountCreated",
        (select count(*)::int from real_invites where login_completed_at is not null) as "loginCompleted",
        (select count(*)::int from real_invites where onboarding_started_at is not null) as "onboardingStarted",
        (select count(*)::int from real_invites where onboarding_completed_at is not null) as "onboardingCompleted",
        (select count(*)::int from real_invites where first_reflection_completed_at is not null) as "firstReflectionCompleted",
        (
          select count(*)::int
          from scoped
          where lower(coalesce(email, '')) like '%test%'
             or lower(coalesce(email, '')) like '%launchtest%'
             or lower(coalesce(email, '')) like '%example.%'
             or lower(coalesce(email, '')) like '%leonardocamacho%'
        ) as "excludedByEmail"
    `),
  );

  const accessEvents = rows<AccessEventRow>(
    await db.execute(sql`
      select
        ae.event_name as "eventName",
        ae.source,
        count(*)::int as "total",
        count(distinct coalesce(ae.user_id::text, ae.invite_id::text))::int as "people"
      from access_events ae
      left join access_invites ai on ai.id = ae.invite_id
      left join users u on u.id = ae.user_id
      where ae.created_at >= ${ALPHA_COHORT_START}
        and (
          coalesce(ai.email, u.email) is null
          or (
            lower(coalesce(ai.email, u.email, '')) not like '%test%'
            and lower(coalesce(ai.email, u.email, '')) not like '%launchtest%'
            and lower(coalesce(ai.email, u.email, '')) not like '%example.%'
            and lower(coalesce(ai.email, u.email, '')) not like '%leonardocamacho%'
          )
        )
      group by ae.event_name, ae.source
      order by count(*) desc, ae.event_name asc
      limit 14
    `),
  );

  const [productSummary] = rows<ProductSummaryRow>(
    await db.execute(sql`
      with excluded_users as (
        select id
        from users
        where lower(coalesce(email, '')) like '%test%'
           or lower(coalesce(email, '')) like '%launchtest%'
           or lower(coalesce(email, '')) like '%example.%'
           or lower(coalesce(email, '')) like '%leonardocamacho%'
      ),
      cohort_users as (
        select u.id
        from users u
        where not exists (select 1 from excluded_users x where x.id = u.id)
          and (
            u.created_at >= ${ALPHA_COHORT_START}
            or exists (
              select 1
              from access_invites ai
              where lower(ai.email) = lower(coalesce(u.email, ''))
                and (ai.created_at >= ${ALPHA_COHORT_START} or ai.sent_at >= ${ALPHA_COHORT_START})
            )
            or exists (select 1 from entries e where e.user_id = u.id and e.created_at >= ${ALPHA_COHORT_START})
            or exists (select 1 from product_events pe where pe.user_id = u.id and pe.created_at >= ${ALPHA_COHORT_START})
          )
      ),
      entry_stats as (
        select
          e.user_id,
          count(*)::int as entries,
          count(*) filter (where e.reflection is not null and nullif(trim(e.reflection), '') is not null)::int as reflected_entries,
          count(*) filter (where e.transcript is not null and nullif(trim(e.transcript), '') is not null)::int as transcribed_entries,
          count(*) filter (where e.entry_mode = 'continue' or e.continued_from_entry_id is not null)::int as continued_entries,
          count(distinct e.thread_id) filter (where e.thread_id is not null)::int as threads,
          count(distinct date_trunc('day', e.created_at at time zone 'America/Sao_Paulo'))::int as entry_days
        from entries e
        inner join cohort_users cu on cu.id = e.user_id
        where e.created_at >= ${ALPHA_COHORT_START}
        group by e.user_id
      ),
      event_stats as (
        select
          pe.user_id,
          count(*)::int as product_events,
          count(*) filter (where pe.event_name = 'product_transcription_failed')::int as transcription_failures,
          count(*) filter (where pe.event_name = 'product_reflection_failed')::int as reflection_failures
        from product_events pe
        inner join cohort_users cu on cu.id = pe.user_id
        where pe.created_at >= ${ALPHA_COHORT_START}
        group by pe.user_id
      ),
      activity_stats as (
        select
          user_id,
          count(distinct local_day)::int as active_days
        from (
          select e.user_id, date_trunc('day', e.created_at at time zone 'America/Sao_Paulo') as local_day
          from entries e
          inner join cohort_users cu on cu.id = e.user_id
          where e.created_at >= ${ALPHA_COHORT_START}
          union
          select pe.user_id, date_trunc('day', pe.created_at at time zone 'America/Sao_Paulo') as local_day
          from product_events pe
          inner join cohort_users cu on cu.id = pe.user_id
          where pe.created_at >= ${ALPHA_COHORT_START}
        ) activity
        group by user_id
      ),
      per_user as (
        select
          cu.id,
          coalesce(es.entries, 0) as entries,
          coalesce(es.reflected_entries, 0) as reflected_entries,
          coalesce(es.transcribed_entries, 0) as transcribed_entries,
          coalesce(es.continued_entries, 0) as continued_entries,
          coalesce(es.threads, 0) as threads,
          coalesce(es.entry_days, 0) as entry_days,
          coalesce(evs.product_events, 0) as product_events,
          coalesce(evs.transcription_failures, 0) as transcription_failures,
          coalesce(evs.reflection_failures, 0) as reflection_failures,
          coalesce(ac.active_days, 0) as active_days
        from cohort_users cu
        left join entry_stats es on es.user_id = cu.id
        left join event_stats evs on evs.user_id = cu.id
        left join activity_stats ac on ac.user_id = cu.id
      )
      select
        count(*)::int as "users",
        count(*) filter (where entries > 0 or product_events > 0)::int as "activeUsers",
        count(*) filter (where reflected_entries > 0)::int as "activatedUsers",
        count(*) filter (
          where reflected_entries > 0
            and (active_days >= 2 or continued_entries > 0)
        )::int as "returningUsers",
        count(*) filter (
          where reflected_entries >= 3
            and active_days = 1
        )::int as "intenseNoReturnUsers",
        coalesce(sum(entries), 0)::int as "entries",
        coalesce(sum(reflected_entries), 0)::int as "reflectedEntries",
        coalesce(sum(transcribed_entries), 0)::int as "transcribedEntries",
        coalesce(sum(continued_entries), 0)::int as "continuedEntries",
        coalesce(sum(threads), 0)::int as "threads",
        coalesce(sum(product_events), 0)::int as "productEvents",
        coalesce(sum(transcription_failures), 0)::int as "transcriptionFailures",
        coalesce(sum(reflection_failures), 0)::int as "reflectionFailures",
        (
          select count(*)::int
          from entries e
          inner join cohort_users cu on cu.id = e.user_id
          where e.created_at >= ${ALPHA_COHORT_START}
            and e.risk_level = 'low'
        ) as "lowRiskEntries",
        (
          select count(*)::int
          from entries e
          inner join cohort_users cu on cu.id = e.user_id
          where e.created_at >= ${ALPHA_COHORT_START}
            and e.risk_level = 'high'
        ) as "highRiskEntries"
      from per_user
    `),
  );

  const alphaUsers = rows<AlphaUserRow>(
    await db.execute(sql`
      with excluded_users as (
        select id
        from users
        where lower(coalesce(email, '')) like '%test%'
           or lower(coalesce(email, '')) like '%launchtest%'
           or lower(coalesce(email, '')) like '%example.%'
           or lower(coalesce(email, '')) like '%leonardocamacho%'
      ),
      cohort_users as (
        select u.id
        from users u
        where not exists (select 1 from excluded_users x where x.id = u.id)
          and (
            u.created_at >= ${ALPHA_COHORT_START}
            or exists (
              select 1
              from access_invites ai
              where lower(ai.email) = lower(coalesce(u.email, ''))
                and (ai.created_at >= ${ALPHA_COHORT_START} or ai.sent_at >= ${ALPHA_COHORT_START})
            )
            or exists (select 1 from entries e where e.user_id = u.id and e.created_at >= ${ALPHA_COHORT_START})
            or exists (select 1 from product_events pe where pe.user_id = u.id and pe.created_at >= ${ALPHA_COHORT_START})
          )
      ),
      entry_stats as (
        select
          e.user_id,
          count(*)::int as entries,
          count(distinct date_trunc('day', e.created_at at time zone 'America/Sao_Paulo'))::int as entry_days,
          count(*) filter (where e.reflection is not null and nullif(trim(e.reflection), '') is not null)::int as reflected_entries,
          count(*) filter (where e.entry_mode = 'continue' or e.continued_from_entry_id is not null)::int as continuations,
          min(e.created_at) as first_entry_at,
          max(e.created_at) as last_entry_at
        from entries e
        inner join cohort_users cu on cu.id = e.user_id
        where e.created_at >= ${ALPHA_COHORT_START}
        group by e.user_id
      ),
      event_stats as (
        select
          pe.user_id,
          count(*)::int as product_events,
          count(*) filter (where pe.event_name = 'product_transcription_failed')::int as transcription_failures,
          count(*) filter (where pe.event_name = 'product_reflection_failed')::int as reflection_failures,
          min(pe.created_at) as first_event_at,
          max(pe.created_at) as last_event_at
        from product_events pe
        inner join cohort_users cu on cu.id = pe.user_id
        where pe.created_at >= ${ALPHA_COHORT_START}
        group by pe.user_id
      ),
      activity_stats as (
        select
          user_id,
          count(distinct local_day)::int as active_days
        from (
          select e.user_id, date_trunc('day', e.created_at at time zone 'America/Sao_Paulo') as local_day
          from entries e
          inner join cohort_users cu on cu.id = e.user_id
          where e.created_at >= ${ALPHA_COHORT_START}
          union
          select pe.user_id, date_trunc('day', pe.created_at at time zone 'America/Sao_Paulo') as local_day
          from product_events pe
          inner join cohort_users cu on cu.id = pe.user_id
          where pe.created_at >= ${ALPHA_COHORT_START}
        ) activity
        group by user_id
      ),
      per_user as (
        select
          left(md5(cu.id::text), 10) as anon_user,
          coalesce(es.entries, 0) as entries,
          coalesce(es.entry_days, 0) as entry_days,
          coalesce(ac.active_days, 0) as active_days,
          coalesce(evs.product_events, 0) as product_events,
          coalesce(es.reflected_entries, 0) as reflected_entries,
          coalesce(es.continuations, 0) as continuations,
          coalesce(evs.transcription_failures, 0) as transcription_failures,
          coalesce(evs.reflection_failures, 0) as reflection_failures,
          least(
            coalesce(es.first_entry_at, evs.first_event_at),
            coalesce(evs.first_event_at, es.first_entry_at)
          ) as first_seen_at,
          greatest(
            coalesce(es.last_entry_at, evs.last_event_at),
            coalesce(evs.last_event_at, es.last_entry_at)
          ) as last_seen_at
        from cohort_users cu
        left join entry_stats es on es.user_id = cu.id
        left join event_stats evs on evs.user_id = cu.id
        left join activity_stats ac on ac.user_id = cu.id
      )
      select
        anon_user as "anonUser",
        entries,
        entry_days as "entryDays",
        active_days as "activeDays",
        product_events as "productEvents",
        reflected_entries as "reflectedEntries",
        continuations,
        transcription_failures as "transcriptionFailures",
        reflection_failures as "reflectionFailures",
        first_seen_at as "firstSeenAt",
        last_seen_at as "lastSeenAt",
        case
          when reflected_entries > 0 and (active_days >= 2 or continuations > 0) then 'retorno_real'
          when reflected_entries >= 3 and active_days = 1 then 'intenso_sem_retorno'
          when reflected_entries > 0 then 'ativado_leve'
          else 'sinal_inicial'
        end as bucket
      from per_user
      where entries > 0 or product_events > 0
      order by
        case
          when reflected_entries > 0 and (active_days >= 2 or continuations > 0) then 0
          when reflected_entries >= 3 and active_days = 1 then 1
          when reflected_entries > 0 then 2
          else 3
        end,
        reflected_entries desc,
        product_events desc,
        anon_user asc
    `),
  );

  const productEventBreakdown = rows<BreakdownRow>(
    await db.execute(sql`
      select
        event_name as label,
        count(*)::int as total
      from product_events pe
      inner join users u on u.id = pe.user_id
      where pe.created_at >= ${ALPHA_COHORT_START}
        and lower(coalesce(u.email, '')) not like '%test%'
        and lower(coalesce(u.email, '')) not like '%launchtest%'
        and lower(coalesce(u.email, '')) not like '%example.%'
        and lower(coalesce(u.email, '')) not like '%leonardocamacho%'
      group by event_name
      order by count(*) desc, event_name asc
      limit 10
    `),
  );

  const [
    mapaFocusSummaryRows,
    mapaUsageRows,
    mapaFocusDistributionRows,
    mapaFocusCorrectionRows,
  ] = await Promise.all([
    db
      .execute(sql`
        with excluded_users as (
          select id
          from users
          where lower(coalesce(email, '')) like '%test%'
             or lower(coalesce(email, '')) like '%launchtest%'
             or lower(coalesce(email, '')) like '%example.%'
             or lower(coalesce(email, '')) like '%leonardocamacho%'
        ),
        cohort_users as (
          select u.id
          from users u
          where not exists (select 1 from excluded_users x where x.id = u.id)
            and (
              u.created_at >= ${ALPHA_COHORT_START}
              or exists (
                select 1
                from access_invites ai
                where lower(ai.email) = lower(coalesce(u.email, ''))
                  and (ai.created_at >= ${ALPHA_COHORT_START} or ai.sent_at >= ${ALPHA_COHORT_START})
              )
              or exists (select 1 from entries e where e.user_id = u.id and e.created_at >= ${ALPHA_COHORT_START})
              or exists (select 1 from product_events pe where pe.user_id = u.id and pe.created_at >= ${ALPHA_COHORT_START})
            )
        ),
        scoped_entries as (
          select e.*
          from entries e
          inner join cohort_users cu on cu.id = e.user_id
          where e.created_at >= ${ALPHA_COHORT_START}
        )
        select
          count(*)::int as "entries",
          count(*) filter (
            where coalesce(risk_level, 'none') <> 'high'
              and (
                nullif(trim(coalesce(transcript, '')), '') is not null
                or nullif(trim(coalesce(reflection, '')), '') is not null
              )
          )::int as "eligibleEntries",
          count(*) filter (where focus_classified_at is not null)::int as "classifiedEntries",
          count(*) filter (
            where focus_key is not null
              and focus_confidence in ('high', 'medium')
              and focus_hidden_at is null
              and focus_resolved_at is null
          )::int as "visibleFocusEntries",
          count(*) filter (
            where focus_key is not null
              and focus_hidden_at is not null
          )::int as "hiddenFocusEntries",
          count(*) filter (
            where focus_key is not null
              and focus_confidence in ('high', 'medium')
              and focus_hidden_at is null
              and focus_resolved_at is not null
          )::int as "resolvedPointEntries",
          count(*) filter (
            where focus_classified_at is not null
              and (focus_key is null or focus_confidence = 'low')
          )::int as "noFocusEntries",
          count(*) filter (
            where focus_classified_at is null
              and coalesce(risk_level, 'none') <> 'high'
              and (
                nullif(trim(coalesce(transcript, '')), '') is not null
                or nullif(trim(coalesce(reflection, '')), '') is not null
              )
          )::int as "pendingFocusEntries",
          count(*) filter (
            where focus_classified_at is null
              and created_at < now() - interval '2 hours'
              and coalesce(risk_level, 'none') <> 'high'
              and (
                nullif(trim(coalesce(transcript, '')), '') is not null
                or nullif(trim(coalesce(reflection, '')), '') is not null
              )
          )::int as "stalePendingEntries",
          count(distinct user_id) filter (
            where focus_key is not null
              and focus_confidence in ('high', 'medium')
              and focus_hidden_at is null
              and focus_resolved_at is null
          )::int as "usersWithFocus",
          count(*) filter (where focus_confidence = 'high')::int as "highConfidenceEntries",
          count(*) filter (where focus_confidence = 'medium')::int as "mediumConfidenceEntries",
          count(*) filter (where focus_confidence = 'low')::int as "lowConfidenceEntries",
          max(focus_classified_at) as "latestClassifiedAt"
        from scoped_entries
      `)
      .then((result) => rows<MapaFocusSummaryRow>(result)),
    db
      .execute(sql`
        with real_product_events as (
          select pe.*
          from product_events pe
          inner join users u on u.id = pe.user_id
          where pe.created_at >= ${ALPHA_COHORT_START}
            and lower(coalesce(u.email, '')) not like '%test%'
            and lower(coalesce(u.email, '')) not like '%launchtest%'
            and lower(coalesce(u.email, '')) not like '%example.%'
            and lower(coalesce(u.email, '')) not like '%leonardocamacho%'
        )
        select
          count(*) filter (where event_name = 'product_mapa_viewed')::int as "mapaViews",
          count(distinct user_id) filter (where event_name = 'product_mapa_viewed')::int as "mapaViewers",
          count(*) filter (where event_name = 'product_mapa_focus_viewed')::int as "focusViews",
          count(*) filter (where event_name = 'product_mapa_focus_card_clicked')::int as "focusCardClicks",
          count(*) filter (where event_name = 'product_mapa_focus_chip_clicked')::int as "focusChipClicks",
          count(*) filter (where event_name = 'product_mapa_entry_opened')::int as "entryOpens",
          count(*) filter (where event_name = 'product_focus_hidden')::int as "focusHiddenEvents",
          count(distinct user_id) filter (where event_name = 'product_focus_hidden')::int as "focusHiddenPeople",
          count(*) filter (where event_name = 'product_focus_point_resolved')::int as "focusPointResolvedEvents",
          count(distinct user_id) filter (where event_name = 'product_focus_point_resolved')::int as "focusPointResolvedPeople",
          count(*) filter (where event_name = 'product_focus_point_reopened')::int as "focusPointReopenedEvents"
        from real_product_events
      `)
      .then((result) => rows<MapaUsageRow>(result)),
    db
      .execute(sql`
        with excluded_users as (
          select id
          from users
          where lower(coalesce(email, '')) like '%test%'
             or lower(coalesce(email, '')) like '%launchtest%'
             or lower(coalesce(email, '')) like '%example.%'
             or lower(coalesce(email, '')) like '%leonardocamacho%'
        ),
        cohort_users as (
          select u.id
          from users u
          where not exists (select 1 from excluded_users x where x.id = u.id)
            and (
              u.created_at >= ${ALPHA_COHORT_START}
              or exists (
                select 1
                from access_invites ai
                where lower(ai.email) = lower(coalesce(u.email, ''))
                  and (ai.created_at >= ${ALPHA_COHORT_START} or ai.sent_at >= ${ALPHA_COHORT_START})
              )
              or exists (select 1 from entries e where e.user_id = u.id and e.created_at >= ${ALPHA_COHORT_START})
              or exists (select 1 from product_events pe where pe.user_id = u.id and pe.created_at >= ${ALPHA_COHORT_START})
            )
        ),
        scoped_entries as (
          select e.*
          from entries e
          inner join cohort_users cu on cu.id = e.user_id
          where e.created_at >= ${ALPHA_COHORT_START}
        )
        select
          focus_key as "focusKey",
          count(*) filter (
            where focus_confidence in ('high', 'medium')
              and focus_hidden_at is null
              and focus_resolved_at is null
          )::int as "visibleEntries",
          count(distinct user_id) filter (
            where focus_confidence in ('high', 'medium')
              and focus_hidden_at is null
              and focus_resolved_at is null
          )::int as "users",
          count(*) filter (where focus_hidden_at is not null)::int as "hiddenEntries",
          count(*) filter (
            where focus_confidence in ('high', 'medium')
              and focus_hidden_at is null
              and focus_resolved_at is not null
          )::int as "resolvedEntries",
          count(*) filter (
            where focus_confidence = 'high'
              and focus_hidden_at is null
              and focus_resolved_at is null
          )::int as "highConfidence",
          count(*) filter (
            where focus_confidence = 'medium'
              and focus_hidden_at is null
              and focus_resolved_at is null
          )::int as "mediumConfidence",
          max(focus_classified_at) as "latestClassifiedAt"
        from scoped_entries
        where focus_key is not null
        group by focus_key
        order by
          count(*) filter (
            where focus_confidence in ('high', 'medium')
              and focus_hidden_at is null
              and focus_resolved_at is null
          ) desc,
          count(distinct user_id) filter (
            where focus_confidence in ('high', 'medium')
              and focus_hidden_at is null
              and focus_resolved_at is null
          ) desc,
          focus_key asc
      `)
      .then((result) => rows<MapaFocusDistributionRow>(result)),
    db
      .execute(sql`
        with real_product_events as (
          select pe.*
          from product_events pe
          inner join users u on u.id = pe.user_id
          where pe.created_at >= ${ALPHA_COHORT_START}
            and lower(coalesce(u.email, '')) not like '%test%'
            and lower(coalesce(u.email, '')) not like '%launchtest%'
            and lower(coalesce(u.email, '')) not like '%example.%'
            and lower(coalesce(u.email, '')) not like '%leonardocamacho%'
        )
        select
          metadata->>'focus_key' as "focusKey",
          count(*)::int as total,
          count(distinct user_id)::int as people,
          max(created_at) as "latestAt"
        from real_product_events
        where event_name = 'product_focus_hidden'
          and nullif(metadata->>'focus_key', '') is not null
        group by metadata->>'focus_key'
        order by count(*) desc, metadata->>'focus_key' asc
      `)
      .then((result) => rows<MapaFocusCorrectionRow>(result)),
  ]);

  const [mapaFocusSummary] = mapaFocusSummaryRows;
  const [mapaUsage] = mapaUsageRows;

  const [pmfDeclaredSummary] = rows<PmfDeclaredSummaryRow>(
    await db.execute(sql`
      with real_feedback as (
        select pf.*
        from product_feedback pf
        inner join users u on u.id = pf.user_id
        where pf.created_at >= ${ALPHA_COHORT_START}
          and lower(coalesce(u.email, '')) not like '%test%'
          and lower(coalesce(u.email, '')) not like '%launchtest%'
          and lower(coalesce(u.email, '')) not like '%example.%'
          and lower(coalesce(u.email, '')) not like '%leonardocamacho%'
      )
      select
        count(*) filter (where kind = 'pmf' and action = 'shown')::int as "promptsShown",
        count(distinct user_id) filter (where kind = 'pmf' and action = 'shown')::int as "peoplePrompted",
        count(*) filter (where kind = 'pmf' and answered_at is not null)::int as "answered",
        count(distinct user_id) filter (where kind = 'pmf' and answered_at is not null)::int as "peopleAnswered",
        count(*) filter (where kind = 'pmf' and skipped_at is not null)::int as "skipped",
        count(*) filter (where kind = 'pmf' and snoozed_until is not null)::int as "snoozed",
        count(*) filter (where kind = 'pmf' and answer = 'very_disappointed')::int as "veryDisappointed",
        count(*) filter (where kind = 'pmf' and answer = 'somewhat_disappointed')::int as "somewhatDisappointed",
        count(*) filter (where kind = 'pmf' and answer = 'not_disappointed')::int as "notDisappointed",
        count(*) filter (where kind = 'pmf' and answer = 'not_sure_yet')::int as "notSureYet",
        count(*) filter (where kind = 'reflection_micro' and answer = 'positive')::int as "microPositive",
        count(*) filter (where kind = 'reflection_micro' and answer = 'negative')::int as "microNegative"
      from real_feedback
    `),
  );

  const pmfAnswerDistribution = rows<BreakdownRow>(
    await db.execute(sql`
      select
        case answer
          when 'very_disappointed' then 'faria muita falta'
          when 'somewhat_disappointed' then 'faria alguma falta'
          when 'not_disappointed' then 'não faria tanta falta'
          when 'not_sure_yet' then 'ainda usei pouco'
          else coalesce(answer, 'sem resposta')
        end as label,
        count(*)::int as total
      from product_feedback pf
      inner join users u on u.id = pf.user_id
      where pf.created_at >= ${ALPHA_COHORT_START}
        and pf.kind = 'pmf'
        and pf.answered_at is not null
        and lower(coalesce(u.email, '')) not like '%test%'
        and lower(coalesce(u.email, '')) not like '%launchtest%'
        and lower(coalesce(u.email, '')) not like '%example.%'
        and lower(coalesce(u.email, '')) not like '%leonardocamacho%'
      group by 1
      order by count(*) desc, label asc
    `),
  );

  const pmfReasonDistribution = rows<BreakdownRow>(
    await db.execute(sql`
      select
        case reason
          when 'more_clarity' then 'mais clareza'
          when 'continue_this_thread' then 'retomar este fio'
          when 'name_feeling' then 'nomear melhor o que sente'
          when 'organized_thoughts' then 'organizar pensamentos soltos'
          when 'clear_start' then 'saber melhor o que dizer'
          when 'closer_reflection' then 'devolutiva mais próxima'
          when 'right_moment' then 'momento certo'
          when 'lighter_experience' then 'experiência mais simples'
          when 'example_when_to_use' then 'ver quando usar'
          when 'clarity_after_speaking' then 'clareza depois de falar'
          when 'threads_continuity' then 'retomar fios'
          when 'patterns' then 'perceber padrões'
          when 'next_steps' then 'organizar próximos passos'
          when 'private_space' then 'espaço privado'
          when 'more_precise_reflections' then 'reflexões mais precisas'
          when 'better_memory' then 'memória melhor'
          when 'useful_reminders' then 'lembretes mais úteis'
          when 'privacy_control' then 'controle/privacidade'
          when 'more_natural_voice' then 'voz mais natural'
          when 'no_value_yet' then 'ainda não vi valor'
          when 'voice_did_not_fit' then 'voz não encaixou'
          when 'reflection_did_not_help' then 'reflexão não ajudou'
          when 'did_not_return' then 'não voltou a usar'
          when 'prefer_other_method' then 'prefere outro jeito'
          when 'forgot' then 'esqueceu'
          when 'no_right_moment' then 'faltou momento certo'
          when 'did_not_know_what_to_say' then 'não sabia o que falar'
          when 'privacy_doubt' then 'dúvida sobre privacidade'
          when 'first_experience_did_not_fit' then 'primeira experiência não encaixou'
          when 'other_closed' then 'outra coisa'
          else coalesce(reason, 'sem detalhe')
        end as label,
        count(*)::int as total
      from product_feedback pf
      inner join users u on u.id = pf.user_id
      where pf.created_at >= ${ALPHA_COHORT_START}
        and pf.kind = 'pmf'
        and pf.answered_at is not null
        and pf.reason is not null
        and lower(coalesce(u.email, '')) not like '%test%'
        and lower(coalesce(u.email, '')) not like '%launchtest%'
        and lower(coalesce(u.email, '')) not like '%example.%'
        and lower(coalesce(u.email, '')) not like '%leonardocamacho%'
      group by 1
      order by count(*) desc, label asc
      limit 10
    `),
  );

  const moodDistribution = rows<BreakdownRow>(
    await db.execute(sql`
      select
        coalesce(nullif(mood, ''), 'sem humor') as label,
        count(*)::int as total
      from entries e
      inner join users u on u.id = e.user_id
      where e.created_at >= ${ALPHA_COHORT_START}
        and lower(coalesce(u.email, '')) not like '%test%'
        and lower(coalesce(u.email, '')) not like '%launchtest%'
        and lower(coalesce(u.email, '')) not like '%example.%'
        and lower(coalesce(u.email, '')) not like '%leonardocamacho%'
      group by 1
      order by count(*) desc, label asc
    `),
  );

  const riskDistribution = rows<BreakdownRow>(
    await db.execute(sql`
      select
        coalesce(nullif(risk_level, ''), 'sem risco') as label,
        count(*)::int as total
      from entries e
      inner join users u on u.id = e.user_id
      where e.created_at >= ${ALPHA_COHORT_START}
        and lower(coalesce(u.email, '')) not like '%test%'
        and lower(coalesce(u.email, '')) not like '%launchtest%'
        and lower(coalesce(u.email, '')) not like '%example.%'
        and lower(coalesce(u.email, '')) not like '%leonardocamacho%'
      group by 1
      order by count(*) desc, label asc
    `),
  );

  const entryModeDistribution = rows<BreakdownRow>(
    await db.execute(sql`
      select
        coalesce(nullif(entry_mode, ''), 'new') as label,
        count(*)::int as total
      from entries e
      inner join users u on u.id = e.user_id
      where e.created_at >= ${ALPHA_COHORT_START}
        and lower(coalesce(u.email, '')) not like '%test%'
        and lower(coalesce(u.email, '')) not like '%launchtest%'
        and lower(coalesce(u.email, '')) not like '%example.%'
        and lower(coalesce(u.email, '')) not like '%leonardocamacho%'
      group by 1
      order by count(*) desc, label asc
    `),
  );

  const [alphaQualitativeSummary] = rows<AlphaQualitativeSummaryRow>(
    await db.execute(sql`
      with real_waitlist as (
        select w.id, w.email, w.confirmed_at, w.unlocked_at
        from waitlist w
        where w.created_at >= ${ALPHA_COHORT_START}
          and w.confirmed_at is not null
          and lower(coalesce(w.email, '')) not like '%test%'
          and lower(coalesce(w.email, '')) not like '%launchtest%'
          and lower(coalesce(w.email, '')) not like '%example.%'
          and lower(coalesce(w.email, '')) not like '%leonardocamacho%'
      )
      select
        count(*)::int as "confirmedWaitlistReal",
        count(*) filter (
          where rw.unlocked_at is not null
            or exists (
              select 1
              from access_invites ai
              where lower(ai.email) = lower(rw.email)
                and ai.sent_at is not null
            )
        )::int as "unlockedReal",
        count(*) filter (where wp.waitlist_id is not null)::int as "profileStarted",
        count(*) filter (
          where nullif(trim(wp.moment), '') is not null
            and nullif(trim(wp.rhythm), '') is not null
            and nullif(trim(wp.presence), '') is not null
            and nullif(trim(wp.value), '') is not null
        )::int as "profileComplete",
        count(*) filter (where nullif(trim(wp.value), '') is not null)::int as "hasValueAnswer",
        count(*) filter (where nullif(trim(wp.moment), '') is not null)::int as "hasMomentAnswer"
      from real_waitlist rw
      left join waitlist_profile wp on wp.waitlist_id = rw.id
    `),
  );

  const exclusionAudit = rows<ExclusionAuditRow>(
    await db.execute(sql`
      with reasons as (
        select 'interno: leonardocamacho' as reason, '%leonardocamacho%' as pattern
        union all select 'teste: launchtest', '%launchtest%'
        union all select 'teste: test', '%test%'
        union all select 'teste: example.*', '%example.%'
      )
      select
        reasons.reason,
        (
          select count(*)::int
          from users u
          where lower(coalesce(u.email, '')) like reasons.pattern
        ) as "users",
        (
          select count(*)::int
          from access_invites ai
          where ai.created_at >= ${ALPHA_COHORT_START}
            and lower(coalesce(ai.email, '')) like reasons.pattern
        ) as "accessInvites",
        (
          select count(*)::int
          from waitlist w
          where w.created_at >= ${ALPHA_COHORT_START}
            and lower(coalesce(w.email, '')) like reasons.pattern
        ) as "waitlistRows"
      from reasons
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
    access: {
      invites: asNumber(accessSummary?.invites),
      sent: asNumber(accessSummary?.sent),
      clicked: asNumber(accessSummary?.clicked),
      accountCreated: asNumber(accessSummary?.accountCreated),
      loginCompleted: asNumber(accessSummary?.loginCompleted),
      onboardingStarted: asNumber(accessSummary?.onboardingStarted),
      onboardingCompleted: asNumber(accessSummary?.onboardingCompleted),
      firstReflectionCompleted: asNumber(accessSummary?.firstReflectionCompleted),
      excludedByEmail: asNumber(accessSummary?.excludedByEmail),
    },
    accessEvents,
    product: {
      users: asNumber(productSummary?.users),
      activeUsers: asNumber(productSummary?.activeUsers),
      activatedUsers: asNumber(productSummary?.activatedUsers),
      returningUsers: asNumber(productSummary?.returningUsers),
      intenseNoReturnUsers: asNumber(productSummary?.intenseNoReturnUsers),
      entries: asNumber(productSummary?.entries),
      reflectedEntries: asNumber(productSummary?.reflectedEntries),
      transcribedEntries: asNumber(productSummary?.transcribedEntries),
      continuedEntries: asNumber(productSummary?.continuedEntries),
      threads: asNumber(productSummary?.threads),
      productEvents: asNumber(productSummary?.productEvents),
      transcriptionFailures: asNumber(productSummary?.transcriptionFailures),
      reflectionFailures: asNumber(productSummary?.reflectionFailures),
      lowRiskEntries: asNumber(productSummary?.lowRiskEntries),
      highRiskEntries: asNumber(productSummary?.highRiskEntries),
    },
    alphaUsers,
    productEventBreakdown,
    mapa: {
      classifierConfigured: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
      summary: {
        entries: asNumber(mapaFocusSummary?.entries),
        eligibleEntries: asNumber(mapaFocusSummary?.eligibleEntries),
        classifiedEntries: asNumber(mapaFocusSummary?.classifiedEntries),
        visibleFocusEntries: asNumber(mapaFocusSummary?.visibleFocusEntries),
        hiddenFocusEntries: asNumber(mapaFocusSummary?.hiddenFocusEntries),
        resolvedPointEntries: asNumber(mapaFocusSummary?.resolvedPointEntries),
        noFocusEntries: asNumber(mapaFocusSummary?.noFocusEntries),
        pendingFocusEntries: asNumber(mapaFocusSummary?.pendingFocusEntries),
        stalePendingEntries: asNumber(mapaFocusSummary?.stalePendingEntries),
        usersWithFocus: asNumber(mapaFocusSummary?.usersWithFocus),
        highConfidenceEntries: asNumber(mapaFocusSummary?.highConfidenceEntries),
        mediumConfidenceEntries: asNumber(mapaFocusSummary?.mediumConfidenceEntries),
        lowConfidenceEntries: asNumber(mapaFocusSummary?.lowConfidenceEntries),
        latestClassifiedAt: mapaFocusSummary?.latestClassifiedAt ?? null,
      },
      usage: {
        mapaViews: asNumber(mapaUsage?.mapaViews),
        mapaViewers: asNumber(mapaUsage?.mapaViewers),
        focusViews: asNumber(mapaUsage?.focusViews),
        focusCardClicks: asNumber(mapaUsage?.focusCardClicks),
        focusChipClicks: asNumber(mapaUsage?.focusChipClicks),
        entryOpens: asNumber(mapaUsage?.entryOpens),
        focusHiddenEvents: asNumber(mapaUsage?.focusHiddenEvents),
        focusHiddenPeople: asNumber(mapaUsage?.focusHiddenPeople),
        focusPointResolvedEvents: asNumber(mapaUsage?.focusPointResolvedEvents),
        focusPointResolvedPeople: asNumber(mapaUsage?.focusPointResolvedPeople),
        focusPointReopenedEvents: asNumber(mapaUsage?.focusPointReopenedEvents),
      },
      focusDistribution: mapaFocusDistributionRows.map((focus) => ({
        focusKey: focus.focusKey,
        visibleEntries: asNumber(focus.visibleEntries),
        users: asNumber(focus.users),
        hiddenEntries: asNumber(focus.hiddenEntries),
        resolvedEntries: asNumber(focus.resolvedEntries),
        highConfidence: asNumber(focus.highConfidence),
        mediumConfidence: asNumber(focus.mediumConfidence),
        latestClassifiedAt: focus.latestClassifiedAt ?? null,
      })),
      focusBreakdown: mapaFocusDistributionRows
        .filter((focus) => asNumber(focus.visibleEntries) > 0)
        .map((focus) => ({
          label: focusLabel(focus.focusKey),
          total: asNumber(focus.visibleEntries),
        })),
      focusCorrections: mapaFocusCorrectionRows.map((row) => ({
        focusKey: row.focusKey,
        total: asNumber(row.total),
        people: asNumber(row.people),
        latestAt: row.latestAt ?? null,
      })),
    },
    pmfDeclared: {
      promptsShown: asNumber(pmfDeclaredSummary?.promptsShown),
      peoplePrompted: asNumber(pmfDeclaredSummary?.peoplePrompted),
      answered: asNumber(pmfDeclaredSummary?.answered),
      peopleAnswered: asNumber(pmfDeclaredSummary?.peopleAnswered),
      skipped: asNumber(pmfDeclaredSummary?.skipped),
      snoozed: asNumber(pmfDeclaredSummary?.snoozed),
      veryDisappointed: asNumber(pmfDeclaredSummary?.veryDisappointed),
      somewhatDisappointed: asNumber(pmfDeclaredSummary?.somewhatDisappointed),
      notDisappointed: asNumber(pmfDeclaredSummary?.notDisappointed),
      notSureYet: asNumber(pmfDeclaredSummary?.notSureYet),
      microPositive: asNumber(pmfDeclaredSummary?.microPositive),
      microNegative: asNumber(pmfDeclaredSummary?.microNegative),
    },
    pmfAnswerDistribution,
    pmfReasonDistribution,
    moodDistribution,
    riskDistribution,
    entryModeDistribution,
    alphaQualitative: {
      confirmedWaitlistReal: asNumber(alphaQualitativeSummary?.confirmedWaitlistReal),
      unlockedReal: asNumber(alphaQualitativeSummary?.unlockedReal),
      profileStarted: asNumber(alphaQualitativeSummary?.profileStarted),
      profileComplete: asNumber(alphaQualitativeSummary?.profileComplete),
      hasValueAnswer: asNumber(alphaQualitativeSummary?.hasValueAnswer),
      hasMomentAnswer: asNumber(alphaQualitativeSummary?.hasMomentAnswer),
    },
    exclusionAudit,
  };
}

export default async function AdminPage({ searchParams }: { searchParams: SearchParams }) {
  const { token, tab } = await searchParams;
  const adminToken = process.env.WAITLIST_ADMIN_TOKEN?.trim();
  const activeTab = parseAdminTab(tab);

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
  const refreshHref = adminHref(adminToken, activeTab);
  const highestDailyValue = Math.max(
    1,
    ...data.dailyRows.flatMap((row) => [asNumber(row.signups), asNumber(row.confirmed), asNumber(row.referred)]),
  );
  const pmfLightRate = percent(data.product.returningUsers, data.product.activatedUsers);
  const pmfLightTone = data.product.returningUsers > 0 ? "neutral" : "warn";
  const pmfDeclaredResponseRate = percent(data.pmfDeclared.answered, data.pmfDeclared.promptsShown);
  const pmfVeryDisappointedRate = percent(data.pmfDeclared.veryDisappointed, data.pmfDeclared.answered);
  const mapaCoverageRate = percent(data.mapa.summary.classifiedEntries, data.mapa.summary.eligibleEntries);
  const mapaVisibleFocusRate = percent(data.mapa.summary.visibleFocusEntries, data.mapa.summary.classifiedEntries);
  const mapaHealthGood = data.mapa.classifierConfigured && data.mapa.summary.stalePendingEntries === 0;
  const returningUsers = data.alphaUsers.filter((user) => user.bucket === "retorno_real");
  const intenseNoReturnUsers = data.alphaUsers.filter((user) => user.bucket === "intenso_sem_retorno");
  const activatedLightUsers = data.alphaUsers.filter((user) => user.bucket === "ativado_leve");

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
            {activeTab === "launch" ? (
              <Link className={styles.button} href={exportHref}>
                Exportar CSV
              </Link>
            ) : null}
            <Link className={styles.secondary} href={refreshHref}>
              Atualizar
            </Link>
            <Link className={styles.secondary} href="/">
              Home
            </Link>
          </div>
        </section>

        <TabNav token={adminToken} activeTab={activeTab} />

        {activeTab === "launch" ? (
          <>
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
                  {data.topReferrers.map((person, index) => (
                    <tr key={person.referralCode}>
                      <td>
                        <strong>Convidante {index + 1}</strong>
                        <br />
                        <span className={styles.muted}>código {person.referralCode.slice(0, 8)}</span>
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
                {data.engagedPeople.map((person, index) => (
                  <tr key={person.referralCode}>
                    <td>
                      <strong>Pessoa {index + 1}</strong>
                      <br />
                      <span className={styles.muted}>código {person.referralCode.slice(0, 8)}</span>
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
                    data.flaggedRows.map((row, index) => (
                      <tr key={`${row.reason}-${dateKey(row.createdAt)}-${index}`}>
                        <td>Registro {index + 1}</td>
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
              {data.recentProfiles.map((profileRow, index) => {
                const completedFields = [
                  profileRow.hasMoment,
                  profileRow.hasRhythm,
                  profileRow.hasPresence,
                  profileRow.hasValue,
                ].filter(Boolean).length;

                return (
                  <article className={styles.answer} key={`${dateKey(profileRow.updatedAt)}-${index}`}>
                    <strong>Perfil recente {index + 1}</strong>
                    <p>
                      {completedFields}/4 campos preenchidos · atualizado {formatDate(profileRow.updatedAt)}
                    </p>
                    <p>
                      <span className={styles.muted}>Momento:</span> {profileRow.hasMoment ? "preenchido" : "vazio"} ·{" "}
                      <span className={styles.muted}>Ritmo:</span> {profileRow.hasRhythm ? "preenchido" : "vazio"} ·{" "}
                      <span className={styles.muted}>Presença:</span> {profileRow.hasPresence ? "preenchido" : "vazio"} ·{" "}
                      <span className={styles.muted}>Valor:</span> {profileRow.hasValue ? "preenchido" : "vazio"}
                    </p>
                  </article>
                );
              })}
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
          </>
        ) : null}

        {activeTab === "access" ? (
          <>
            <section className={styles.alertStrip}>
              <SignalRow
                label="Coorte Alpha"
                value={ALPHA_COHORT_LABEL}
                note={`${data.access.excludedByEmail} convite removido da leitura por email interno/teste`}
                tone={data.access.excludedByEmail ? "warn" : "good"}
                definition={help.accessInvites}
              />
              <SignalRow
                label="Conta criada"
                value={`${data.access.accountCreated}/${data.access.invites}`}
                note={`${percent(data.access.accountCreated, data.access.invites)} dos convites reais`}
                tone={data.access.accountCreated ? "good" : "warn"}
              />
              <SignalRow
                label="Primeira reflexão"
                value={`${data.access.firstReflectionCompleted}/${data.access.invites}`}
                note="Entrada no valor principal do Alpha"
                tone={data.access.firstReflectionCompleted ? "good" : "warn"}
                definition={help.accessFirstReflection}
              />
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Acesso Alpha</h2>
                <p>Leitura do convite até o primeiro valor, sem renderizar email ou nome.</p>
              </div>
              <div className={styles.grid}>
                <MetricCard
                  value={compactNumber(data.access.invites)}
                  label="Convites reais"
                  note={`${data.access.sent} enviados desde 19/06`}
                  definition={help.accessInvites}
                />
                <MetricCard
                  value={compactNumber(data.access.clicked)}
                  label="Links abertos"
                  note={`${percent(data.access.clicked, data.access.sent)} dos enviados`}
                  tone={data.access.clicked ? "good" : "neutral"}
                />
                <MetricCard
                  value={compactNumber(data.access.onboardingCompleted)}
                  label="Onboarding completo"
                  note={`${data.access.onboardingStarted} começaram onboarding`}
                  tone={data.access.onboardingCompleted ? "good" : "neutral"}
                />
                <MetricCard
                  value={compactNumber(data.access.firstReflectionCompleted)}
                  label="Primeiro valor"
                  note={`${percent(data.access.firstReflectionCompleted, data.access.accountCreated)} das contas criadas`}
                  tone={data.access.firstReflectionCompleted ? "good" : "warn"}
                  definition={help.accessFirstReflection}
                />
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Eventos de acesso</h2>
                <p>Diagnóstico por evento e origem. A tabela usa pessoa/convite como cardinalidade, nunca contato bruto.</p>
              </div>
              <div className={styles.tableCard}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Evento</th>
                      <th>Origem</th>
                      <th>Volume</th>
                      <th>Pessoas/convites</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.accessEvents.length ? (
                      data.accessEvents.map((event) => (
                        <tr key={`${event.eventName}-${event.source ?? "source"}`}>
                          <td>{event.eventName}</td>
                          <td>{event.source ?? "sem origem"}</td>
                          <td>{event.total}</td>
                          <td>{event.people}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4}>Nenhum evento de acesso na coorte.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}

        {activeTab === "product" ? (
          <>
            <section className={styles.alertStrip}>
              <SignalRow
                label="Coorte Alpha"
                value={ALPHA_COHORT_LABEL}
                note="Usuários internos/teste excluídos por regra de email auditável"
                tone="neutral"
              />
              <SignalRow
                label="PMF leve"
                value={pmfLightRate}
                note={`${data.product.returningUsers}/${data.product.activatedUsers} ativados voltaram de verdade`}
                tone={pmfLightTone}
                definition={help.pmfLight}
              />
              <SignalRow
                label="Intenso sem retorno"
                value={`${data.product.intenseNoReturnUsers} usuários`}
                note="Alta primeira sessão sem segundo dia observável"
                tone={data.product.intenseNoReturnUsers ? "warn" : "good"}
                definition={help.intenseNoReturn}
              />
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Mapa e Focos</h2>
                <p>Observabilidade do classificador oficial, dos focos vivos e dos estados definidos pelas pessoas.</p>
              </div>
              <div className={styles.grid}>
                <MetricCard
                  value={mapaCoverageRate}
                  label="Cobertura do classificador"
                  note={`${data.mapa.summary.classifiedEntries}/${data.mapa.summary.eligibleEntries} entradas elegíveis`}
                  tone={data.mapa.summary.pendingFocusEntries ? "warn" : "good"}
                  definition={help.mapaCoverage}
                />
                <MetricCard
                  value={compactNumber(data.mapa.summary.visibleFocusEntries)}
                  label="Focos vivos"
                  note={`${data.mapa.summary.usersWithFocus} pessoas com ao menos um foco`}
                  tone={data.mapa.summary.visibleFocusEntries ? "good" : "neutral"}
                  definition={help.mapaVisibleFocus}
                />
                <MetricCard
                  value={compactNumber(data.mapa.usage.mapaViews)}
                  label="Views do Mapa"
                  note={`${data.mapa.usage.mapaViewers} pessoas, ${data.mapa.usage.focusViews} views de foco`}
                  tone={data.mapa.usage.mapaViews ? "good" : "neutral"}
                  definition={help.mapaUsage}
                />
                <MetricCard
                  value={compactNumber(data.mapa.usage.focusHiddenEvents)}
                  label="Correções salvas"
                  note={`${data.mapa.usage.focusHiddenPeople} pessoas removeram foco`}
                  tone={data.mapa.usage.focusHiddenEvents ? "warn" : "good"}
                  definition={help.mapaCorrections}
                />
                <MetricCard
                  value={compactNumber(data.mapa.summary.resolvedPointEntries)}
                  label="Pontos resolvidos"
                  note={`${data.mapa.usage.focusPointResolvedPeople} pessoas resolveram ponto`}
                  tone={data.mapa.summary.resolvedPointEntries ? "neutral" : "good"}
                  definition={help.mapaVisibleFocus}
                />
              </div>
              <div className={styles.split}>
                <BreakdownList title="Focos vivos" rows={data.mapa.focusBreakdown} definition={help.mapaVisibleFocus} />
                <div className={styles.signalCard}>
                  <h3 className={styles.cardTitle}>Saúde do Mapa</h3>
                  <SignalRow
                    label="Classificador oficial"
                    value={data.mapa.classifierConfigured ? "configurado" : "sem chave"}
                    note="Lê apenas presença de ANTHROPIC_API_KEY, sem expor valor"
                    tone={data.mapa.classifierConfigured ? "good" : "warn"}
                  />
                  <SignalRow
                    label="Backlog elegível"
                    value={`${data.mapa.summary.pendingFocusEntries}`}
                    note={`${data.mapa.summary.stalePendingEntries} pendentes há mais de 2h`}
                    tone={data.mapa.summary.stalePendingEntries ? "warn" : "good"}
                    definition={help.mapaBacklog}
                  />
                  <SignalRow
                    label="Última classificação"
                    value={data.mapa.summary.latestClassifiedAt ? formatDate(data.mapa.summary.latestClassifiedAt) : "sem sinal"}
                    note={`${data.mapa.summary.noFocusEntries} entradas classificadas como sem foco`}
                    tone={mapaHealthGood ? "good" : "warn"}
                  />
                  <SignalRow
                    label="High / medium / low"
                    value={`${data.mapa.summary.highConfidenceEntries}/${data.mapa.summary.mediumConfidenceEntries}/${data.mapa.summary.lowConfidenceEntries}`}
                    note={`${mapaVisibleFocusRate} das classificadas viraram foco visível`}
                    tone="neutral"
                  />
                  <SignalRow
                    label="Resolvidos / reabertos"
                    value={`${data.mapa.usage.focusPointResolvedEvents}/${data.mapa.usage.focusPointReopenedEvents}`}
                    note={`${data.mapa.summary.resolvedPointEntries} pontos fora dos focos vivos por resolução`}
                    tone={data.mapa.usage.focusPointResolvedEvents ? "neutral" : "good"}
                  />
                  <SignalRow
                    label="Cartões / chips"
                    value={`${data.mapa.usage.focusCardClicks}/${data.mapa.usage.focusChipClicks}`}
                    note="Acessos ao foco pelo Mapa e pela Timeline/Fio"
                    tone={data.mapa.usage.focusCardClicks || data.mapa.usage.focusChipClicks ? "good" : "neutral"}
                  />
                  <SignalRow
                    label="Entradas abertas"
                    value={`${data.mapa.usage.entryOpens}`}
                    note="Aberturas de registro a partir do Mapa"
                    tone={data.mapa.usage.entryOpens ? "good" : "neutral"}
                  />
                </div>
              </div>
              <div className={styles.noteCard}>
                O admin do Mapa mostra apenas contagens, focos, confiança, eventos de uso, correções e pontos resolvidos. Não renderiza transcrição, reflexão, evidência textual, razão do foco, áudio, nome ou email.
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Distribuição dos focos</h2>
                <p>Onde o Mapa está encontrando padrões recorrentes, onde o usuário está corrigindo e quais pontos foram resolvidos por agora.</p>
              </div>
              <MapaFocusTable rows={data.mapa.focusDistribution} />
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Correções por foco</h2>
                <p>Remoções salvas pelo usuário. Alto volume aqui é sinal de categoria ruidosa ou expectativa mal calibrada.</p>
              </div>
              <MapaCorrectionsTable rows={data.mapa.focusCorrections} />
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>PMF leve do Alpha</h2>
                <p>Critério prático para amostra pequena: ativação, retorno real e intensidade que ainda não voltou.</p>
              </div>
              <div className={styles.grid}>
                <MetricCard
                  value={compactNumber(data.product.activatedUsers)}
                  label="Ativados"
                  note={`${data.product.reflectedEntries} reflexões concluídas`}
                  tone={data.product.activatedUsers ? "good" : "warn"}
                  definition={help.activatedUsers}
                />
                <MetricCard
                  value={compactNumber(data.product.returningUsers)}
                  label="Retorno real"
                  note="Atividade em 2+ dias ou continuidade explícita"
                  tone={data.product.returningUsers ? "good" : "warn"}
                  definition={help.returningUsers}
                />
                <MetricCard
                  value={pmfLightRate}
                  label="PMF leve"
                  note="Retorno real dividido por usuários ativados"
                  tone={pmfLightTone}
                  definition={help.pmfLight}
                />
                <MetricCard
                  value={compactNumber(data.product.intenseNoReturnUsers)}
                  label="Intensos sem retorno"
                  note="3+ reflexões em um único dia ativo"
                  tone={data.product.intenseNoReturnUsers ? "warn" : "good"}
                  definition={help.intenseNoReturn}
                />
              </div>
              <div className={styles.noteCard}>
                Critérios usados: ativado = pelo menos uma entrada com reflexão; retorno real = usuário ativado com atividade em dois ou mais dias locais ou continuação explícita de fio; intenso sem retorno = três ou mais reflexões no primeiro dia e nenhum segundo dia observável. Com amostra pequena, isso é leitura de Alpha, não prova estatística de PMF.
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>PMF declarada</h2>
                <p>Pergunta opcional depois de valor recebido. Complementa a PMF leve comportamental.</p>
              </div>
              <div className={styles.grid}>
                <MetricCard
                  value={compactNumber(data.pmfDeclared.promptsShown)}
                  label="PMF mostrada"
                  note={`${data.pmfDeclared.peoplePrompted} pessoas únicas`}
                  definition={help.pmfDeclared}
                />
                <MetricCard
                  value={compactNumber(data.pmfDeclared.answered)}
                  label="Respondidas"
                  note={`${pmfDeclaredResponseRate} dos prompts mostrados`}
                  tone={data.pmfDeclared.answered ? "good" : "neutral"}
                  definition={help.pmfDeclared}
                />
                <MetricCard
                  value={pmfVeryDisappointedRate}
                  label="Faria muita falta"
                  note={`${data.pmfDeclared.veryDisappointed}/${data.pmfDeclared.answered} respostas PMF`}
                  tone={data.pmfDeclared.veryDisappointed ? "good" : "neutral"}
                  definition={help.pmfDeclared}
                />
                <MetricCard
                  value={`${data.pmfDeclared.microPositive}/${data.pmfDeclared.microNegative}`}
                  label="Microfeedback"
                  note="Fez sentido / Não tanto"
                  definition="Feedback pós-reflexão. Não é nota e não avalia a pessoa."
                />
              </div>
              <div className={styles.split}>
                <BreakdownList title="Respostas PMF" rows={data.pmfAnswerDistribution} definition={help.pmfDeclared} />
                <BreakdownList title="Razões declaradas" rows={data.pmfReasonDistribution} definition={help.pmfDeclared} />
              </div>
              <div className={styles.noteCard}>
                PMF declarada usa apenas respostas fechadas. O usuário interno de teste fica fora deste agregado pela regra de exclusão da coorte.
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Alpha qualitativo agregado</h2>
                <p>Leitura do Ritual de Chegada por presença de campos preenchidos; não renderiza resposta aberta.</p>
              </div>
              <div className={styles.grid}>
                <MetricCard
                  value={compactNumber(data.alphaQualitative.confirmedWaitlistReal)}
                  label="Confirmados reais"
                  note={`${data.alphaQualitative.unlockedReal} já tinham acesso liberado`}
                />
                <MetricCard
                  value={compactNumber(data.alphaQualitative.profileStarted)}
                  label="Ritual iniciado"
                  note={`${percent(data.alphaQualitative.profileStarted, data.alphaQualitative.confirmedWaitlistReal)} dos confirmados reais`}
                />
                <MetricCard
                  value={compactNumber(data.alphaQualitative.profileComplete)}
                  label="Ritual completo"
                  note={`${data.alphaQualitative.hasMomentAnswer} deixaram momento inicial`}
                  definition={help.ritualsComplete}
                />
                <MetricCard
                  value={compactNumber(data.alphaQualitative.hasValueAnswer)}
                  label="Resposta de valor"
                  note="Sinal qualitativo sobre promessa e linguagem"
                  definition={help.safeQualitative}
                />
              </div>
              <div className={styles.noteCard}>
                Este bloco conta apenas presença de respostas no Ritual. O texto livre do perfil, nomes e emails ficam fora da aba Product.
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Uso do produto</h2>
                <p>Agregados seguros de diário, transcrição e reflexão. Conteúdo bruto não aparece no admin.</p>
              </div>
              <div className={styles.grid}>
                <MetricCard
                  value={compactNumber(data.product.activeUsers)}
                  label="Usuários ativos"
                  note={`${data.product.users} usuários reais na coorte`}
                  definition={help.productEvents}
                />
                <MetricCard
                  value={compactNumber(data.product.entries)}
                  label="Entradas"
                  note={`${data.product.transcribedEntries} com transcrição registrada`}
                  definition={help.safeQualitative}
                />
                <MetricCard
                  value={compactNumber(data.product.reflectedEntries)}
                  label="Reflexões"
                  note={`${percent(data.product.reflectedEntries, data.product.entries)} das entradas`}
                  tone={data.product.reflectedEntries ? "good" : "warn"}
                />
                <MetricCard
                  value={compactNumber(data.product.productEvents)}
                  label="Eventos de produto"
                  note={`${data.product.transcriptionFailures + data.product.reflectionFailures} falhas capturadas`}
                  tone={data.product.transcriptionFailures + data.product.reflectionFailures ? "warn" : "neutral"}
                  definition={help.productEvents}
                />
              </div>
              <div className={styles.gridThree}>
                <BreakdownList title="Eventos de produto" rows={data.productEventBreakdown} definition={help.productEvents} />
                <BreakdownList title="Humor agregado" rows={data.moodDistribution} definition={help.safeQualitative} />
                <BreakdownList title="Risco agregado" rows={data.riskDistribution} definition={help.safeQualitative} />
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Usuários com retorno real</h2>
                <p>IDs pseudônimos para follow-up operacional. Sem email, nome, diário, transcrição, reflexão ou áudio.</p>
              </div>
              <AlphaUserTable rows={returningUsers} empty="Nenhum retorno real ainda nesta coorte." />
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Intensos sem retorno</h2>
                <p>Pessoas que chegaram ao valor várias vezes no primeiro dia e ainda não voltaram.</p>
              </div>
              <AlphaUserTable rows={intenseNoReturnUsers} empty="Nenhum usuário intenso sem retorno nesta coorte." />
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Ativados sem segundo dia</h2>
                <p>Leitura intermediária: já houve reflexão, mas ainda falta retorno real.</p>
              </div>
              <AlphaUserTable rows={activatedLightUsers} empty="Nenhum ativado leve fora dos outros grupos." />
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Auditoria da exclusão</h2>
                <p>Regras explícitas para remover teste/interno da coorte sem apagar dados.</p>
              </div>
              <div className={styles.split}>
                <BreakdownList title="Modo de entrada" rows={data.entryModeDistribution} definition="Distribuição segura de entry_mode; não expõe texto do diário." />
                <div className={styles.tableCard}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Regra</th>
                        <th>Users</th>
                        <th>Access</th>
                        <th>Waitlist</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.exclusionAudit.map((row) => (
                        <tr key={row.reason}>
                          <td>{row.reason}</td>
                          <td>{row.users}</td>
                          <td>{row.accessInvites}</td>
                          <td>{row.waitlistRows}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className={styles.noteCard}>
                O admin de produto usa apenas IDs pseudônimos e agregados. Não há renderização de email, nome, transcrição, reflexão, áudio, resposta aberta ou URL de áudio.
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
