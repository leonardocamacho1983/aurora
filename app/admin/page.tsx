import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { waitlist, waitlistEvents, waitlistProfile } from "@/lib/db/schema";
import styles from "./Admin.module.css";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Aurora Founder Cockpit",
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
  totalProfiles: number;
  names: number;
  started: number;
  complete: number;
};

type EventSummaryRow = {
  eventName: string;
  total: number;
  uniquePeople: number;
};

type TopReferrerRow = {
  email: string;
  name: string | null;
  referralCode: string;
  confirmedReferrals: number;
};

type MilestoneRow = {
  unlocked5: number;
  unlocked10: number;
  unlocked15: number;
  unlocked20: number;
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

function compactNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(value);
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
  wide,
}: {
  value: string;
  label: string;
  note: string;
  wide?: boolean;
}) {
  return (
    <article className={`${styles.card} ${wide ? styles.wide : ""}`}>
      <div className={styles.metricValue}>{value}</div>
      <div className={styles.metricLabel}>{label}</div>
      <div className={styles.metricNote}>{note}</div>
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
        count(*)::int as "totalProfiles",
        count(*) filter (where nullif(trim(name), '') is not null)::int as "names",
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
        count(r.id)::int as "confirmedReferrals"
      from waitlist w
      left join waitlist_profile wp on wp.waitlist_id = w.id
      left join waitlist r on r.referred_by_code = w.referral_code and r.confirmed_at is not null
      group by w.id, wp.name
      order by count(r.id) desc, w.created_at asc
      limit 10
    `),
  );

  const [milestones] = rows<MilestoneRow>(
    await db.execute(sql`
      with ref_counts as (
        select
          w.id,
          count(r.id)::int as confirmed_referrals
        from waitlist w
        left join waitlist r on r.referred_by_code = w.referral_code and r.confirmed_at is not null
        group by w.id
      )
      select
        count(*) filter (where confirmed_referrals >= 5)::int as "unlocked5",
        count(*) filter (where confirmed_referrals >= 10)::int as "unlocked10",
        count(*) filter (where confirmed_referrals >= 15)::int as "unlocked15",
        count(*) filter (where confirmed_referrals >= 20)::int as "unlocked20"
      from ref_counts
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

  const rhythmRows = rows<{ value: string | null; total: number }>(
    await db.execute(sql`
      select rhythm as value, count(*)::int as total
      from waitlist_profile
      where nullif(trim(rhythm), '') is not null
      group by rhythm
      order by count(*) desc
      limit 8
    `),
  );

  const presenceRows = rows<{ value: string | null; total: number }>(
    await db.execute(sql`
      select presence as value, count(*)::int as total
      from waitlist_profile
      where nullif(trim(presence), '') is not null
      group by presence
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
      totalProfiles: asNumber(profile?.totalProfiles),
      names: asNumber(profile?.names),
      started: asNumber(profile?.started),
      complete: asNumber(profile?.complete),
    },
    eventSummary,
    topReferrers,
    milestones: {
      unlocked5: asNumber(milestones?.unlocked5),
      unlocked10: asNumber(milestones?.unlocked10),
      unlocked15: asNumber(milestones?.unlocked15),
      unlocked20: asNumber(milestones?.unlocked20),
    },
    recentProfiles,
    recentEvents,
    rhythmRows,
    presenceRows,
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

  const qualified = Math.max(data.profile.started, data.profile.complete);
  const usdTarget = 1_000_000;
  const assumedPrice = 9;
  const assumedPaidConversion = 0.08;
  const neededQualified = Math.ceil(usdTarget / 12 / assumedPrice / assumedPaidConversion);
  const targetProgress = Math.min(100, Math.round((qualified / neededQualified) * 10000) / 100);
  const projectedMrr = qualified * assumedPrice * assumedPaidConversion;
  const exportHref = `/api/waitlist/export?token=${encodeURIComponent(adminToken)}`;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <div>
            <div className={styles.brand}>
              <span className={styles.orb} />
              Aurora Founder Cockpit
            </div>
            <h1 className={styles.title}>Da lista de espera ao motor de crescimento.</h1>
            <p className={styles.lead}>
              Um painel para acompanhar desejo, indicação, ritual e qualidade do lançamento. A pergunta central é simples: a
              Aurora está criando confiança suficiente para ser compartilhada?
            </p>
            <div className={styles.actions}>
              <Link className={styles.button} href={exportHref}>
                Exportar CSV
              </Link>
              <Link className={styles.secondary} href={`/admin?token=${encodeURIComponent(adminToken)}`}>
                Atualizar painel
              </Link>
              <Link className={styles.secondary} href="/">
                Ver home
              </Link>
            </div>
          </div>
          <aside className={styles.heroPanel}>
            <div className={styles.heroStat}>
              <strong>{percent(data.summary.confirmed, data.summary.total)}</strong>
              <span>confirmação da lista</span>
            </div>
            <div className={styles.heroStat}>
              <strong>{ratio(data.summary.confirmedReferred, data.summary.confirmed)}</strong>
              <span>convites confirmados por pessoa confirmada</span>
            </div>
            <div className={styles.heroStat}>
              <strong>{percent(data.profile.complete, data.summary.confirmed)}</strong>
              <span>Ritual completo entre confirmados</span>
            </div>
          </aside>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Norte do lançamento</h2>
            <p>Os números que mostram se a Aurora está sendo entendida, desejada e compartilhada.</p>
          </div>
          <div className={styles.grid}>
            <MetricCard value={compactNumber(data.summary.total)} label="Pessoas na lista" note={`${data.summary.signups7} novas nos últimos 7 dias`} />
            <MetricCard value={compactNumber(data.summary.confirmed)} label="Emails confirmados" note={`${data.summary.pending} ainda precisam confirmar`} />
            <MetricCard value={compactNumber(data.summary.confirmedReferred)} label="Entradas por convite" note={`${percent(data.summary.confirmedReferred, data.summary.confirmed)} dos confirmados vieram por indicação`} />
            <MetricCard value={compactNumber(data.profile.complete)} label="Rituais completos" note={`${data.profile.started} pessoas começaram o Ritual de Chegada`} />
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Máquina viral</h2>
            <p>O loop de indicação funciona quando a pessoa sente orgulho de trazer gente querida para perto.</p>
          </div>
          <div className={styles.gridThree}>
            <MetricCard value={compactNumber(shareEvents.total)} label="Gestos de compartilhamento" note={`${shareEvents.unique} pessoas acionaram algum convite`} />
            <MetricCard value={ratio(data.summary.confirmedReferred, data.summary.confirmed)} label="K-factor confirmado" note="Convites confirmados por pessoa confirmada" />
            <MetricCard value={compactNumber(data.milestones.unlocked5)} label="Acesso antecipado desbloqueado" note={`${data.milestones.unlocked10} chegaram ao marco de 10`} />
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Rumo a US$1M ARR</h2>
            <p>Modelo simples para orientar foco. Hipótese: US$9 mensais, 8% dos leads qualificados virando pagantes.</p>
          </div>
          <div className={styles.gridThree}>
            <article className={`${styles.card} ${styles.wide}`}>
              <div className={styles.metricValue}>{targetProgress}%</div>
              <div className={styles.metricLabel}>Progresso de base qualificada</div>
              <div className={styles.metricNote}>
                {compactNumber(qualified)} qualificados de {compactNumber(neededQualified)} necessários pela hipótese atual.
              </div>
              <div className={styles.bar}>
                <span style={{ width: `${targetProgress}%` }} />
              </div>
            </article>
            <MetricCard
              value={`US$${Math.round(projectedMrr).toLocaleString("pt-BR")}`}
              label="MRR potencial do funil atual"
              note="Estimativa conservadora baseada no Ritual ou perfil iniciado"
            />
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Top indicações</h2>
            <p>Quem já está levando a Aurora adiante.</p>
          </div>
          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Pessoa</th>
                  <th>Código</th>
                  <th>Confirmados</th>
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
                    <td>{person.referralCode}</td>
                    <td>{person.confirmedReferrals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Sinais de desejo</h2>
            <p>As respostas do Ritual ajudam a entender promessa, linguagem e primeiro uso.</p>
          </div>
          <div className={styles.split}>
            <div className={styles.answerCard}>
              <div className={styles.answerList}>
                {data.recentProfiles.map((profileRow) => (
                  <article className={styles.answer} key={`${profileRow.email}-${profileRow.updatedAt.toISOString()}`}>
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
            <div className={styles.tableCard}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Sinal</th>
                    <th>Resposta</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.rhythmRows.map((row) => ({ type: "Ritmo", ...row })), ...data.presenceRows.map((row) => ({ type: "Presença", ...row }))].map(
                    (row, index) => (
                      <tr key={`${row.type}-${row.value}-${index}`}>
                        <td>{row.type}</td>
                        <td>{row.value}</td>
                        <td>{row.total}</td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
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
              <div className={styles.event} key={`${event.eventName}-${event.createdAt.toISOString()}-${index}`}>
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
