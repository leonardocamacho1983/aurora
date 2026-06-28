import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { and, desc, eq, isNotNull, or, sql } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { entries, entryThreads } from "@/lib/db/schema";
import { generateInsights, type InsightSource } from "@/lib/ai/insights";
import { ProductNav } from "@/components/product/ProductNav";
import { renderProse } from "@/lib/render-prose";
import styles from "./Timeline.module.css";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MOODS = ["calmo", "leve", "ansioso", "sensível", "pesado"] as const;
const RANGES = ["week", "month", "all"] as const;

const MOOD_COLOR: Record<string, string> = {
  leve: "var(--mood-leve)",
  calmo: "var(--mood-calmo)",
  pesado: "var(--mood-pesado)",
  sensível: "var(--mood-sensivel)",
  ansioso: "var(--mood-ansioso)",
};

const MOOD_LABEL: Record<string, string> = {
  leve: "Leve",
  calmo: "Calmo",
  pesado: "Pesado",
  sensível: "Sensível",
  ansioso: "Ansioso",
};

const RANGE_LABEL: Record<(typeof RANGES)[number], string> = {
  week: "Semana",
  month: "Mês",
  all: "Tudo",
};

type Row = {
  id: string;
  transcript: string | null;
  reflection: string | null;
  mood: string | null;
  threadId: string | null;
  createdAt: Date;
};

type TimelineSearchParams = {
  range?: string;
  mood?: string;
};

type ThreadPreviewRow = {
  id: string;
  title: string | null;
  summary: string | null;
  updatedAt: Date;
  momentCount: number;
  latestText: string | null;
  latestMood: string | null;
};

function normalizeRange(value: string | undefined): (typeof RANGES)[number] {
  return RANGES.includes(value as (typeof RANGES)[number])
    ? (value as (typeof RANGES)[number])
    : "week";
}

function normalizeMood(value: string | undefined): string | null {
  return MOODS.includes(value as (typeof MOODS)[number]) ? value ?? null : null;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysAgo(d: Date): number {
  return Math.round((startOfDay(new Date()).getTime() - startOfDay(d).getTime()) / 86_400_000);
}

function inRange(row: Row, range: (typeof RANGES)[number]) {
  const age = Date.now() - row.createdAt.getTime();
  if (range === "week") return age <= 7 * 86_400_000;
  if (range === "month") return age <= 31 * 86_400_000;
  return true;
}

function formatShortDate(d: Date): string {
  const days = daysAgo(d);
  if (days <= 0) return "Hoje";
  if (days === 1) return "Ontem";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(d);
}

function formatTime(d: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(d);
}

function formatMonth(d: Date): string {
  const month = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(d);
  return month.charAt(0).toUpperCase() + month.slice(1);
}

function entryText(row: Row): string {
  return (row.transcript ?? row.reflection ?? "").replace(/\s+/g, " ").trim();
}

function excerpt(row: Row, max = 124): string {
  const text = entryText(row);
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

function textExcerpt(text: string, max = 168): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return clean;
  return clean.length > max ? `${clean.slice(0, max).trim()}…` : clean;
}

function moodColor(mood: string | null): string {
  return mood ? (MOOD_COLOR[mood] ?? "var(--mood-neutro)") : "var(--mood-neutro)";
}

function moodLabel(mood: string | null): string {
  return mood ? (MOOD_LABEL[mood] ?? mood) : "Neutro";
}

function countWords(text: string | null): number {
  const t = (text ?? "").trim();
  return t ? t.split(/\s+/).length : 0;
}

function entryMeasure(row: Row): string {
  const words = countWords(row.transcript ?? row.reflection);
  if (words === 0) return "Registro";
  return `${words} ${words === 1 ? "palavra" : "palavras"}`;
}

function hrefFor(range: (typeof RANGES)[number], mood: string | null, updates: TimelineSearchParams) {
  const params = new URLSearchParams();
  const nextRange = (updates.range ? normalizeRange(updates.range) : range) ?? "week";
  const nextMood = "mood" in updates ? normalizeMood(updates.mood) : mood;

  if (nextRange !== "week") params.set("range", nextRange);
  if (nextMood) params.set("mood", nextMood);

  const query = params.toString();
  return query ? `/timeline?${query}` : "/timeline";
}

function topMood(rows: Row[]): string | null {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (!row.mood) continue;
    counts.set(row.mood, (counts.get(row.mood) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function groupedByMonth(rows: Row[]) {
  const groups = new Map<string, Row[]>();
  for (const row of rows) {
    const key = formatMonth(row.createdAt);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  return [...groups.entries()];
}

function OrbMark({ className }: { className?: string }) {
  return <span className={`${styles.orbMark} ${className ?? ""}`} aria-hidden="true" />;
}

function PeriodTabs({ range, mood }: { range: (typeof RANGES)[number]; mood: string | null }) {
  return (
    <nav className={styles.periodTabs} aria-label="Filtrar registros por período">
      {RANGES.map((item) => (
        <Link
          key={item}
          href={hrefFor(range, mood, { range: item })}
          className={item === range ? styles.activeTab : undefined}
          aria-current={item === range ? "page" : undefined}
        >
          {RANGE_LABEL[item]}
        </Link>
      ))}
    </nav>
  );
}

function MoodDot({ mood }: { mood: string | null }) {
  return (
    <span
      className={styles.moodDot}
      style={{ background: moodColor(mood) }}
      aria-hidden="true"
    />
  );
}

function MoodFilters({ range, mood }: { range: (typeof RANGES)[number]; mood: string | null }) {
  return (
    <div className={styles.filterSet} aria-label="Filtrar por humor">
      {MOODS.map((item) => {
        const active = item === mood;
        return (
          <Link
            key={item}
            href={hrefFor(range, mood, { mood: active ? undefined : item })}
            className={active ? styles.activeChip : undefined}
            aria-current={active ? "true" : undefined}
          >
            <MoodDot mood={item} />
            {moodLabel(item)}
          </Link>
        );
      })}
    </div>
  );
}

function Header({ range, mood }: { range: (typeof RANGES)[number]; mood: string | null }) {
  return (
    <header className={styles.header}>
      <h1>Linha do tempo</h1>
      <div className={styles.headerFilters}>
        <PeriodTabs range={range} mood={mood} />
        <Link href="/diario" className={styles.newEntry}>
          <span>Nova entrada</span>
          <span aria-hidden="true">+</span>
        </Link>
      </div>
    </header>
  );
}

function threadTitle(thread: ThreadPreviewRow) {
  return thread.title ?? textExcerpt(thread.latestText ?? "Fio do diário", 72);
}

function ThreadRail({ threads }: { threads: ThreadPreviewRow[] }) {
  if (threads.length === 0) return null;

  return (
    <section className={styles.threadSection} aria-labelledby="threads-title">
      <div className={styles.sectionHeader}>
        <p className={styles.sectionLabel} id="threads-title">Fios</p>
        <span>Entradas com mais de um momento</span>
      </div>
      <div className={styles.threadGrid}>
        {threads.slice(0, 6).map((thread) => (
          <Link className={styles.threadCard} href={`/fios/${thread.id}`} key={thread.id}>
            <div className={styles.threadMeta}>
              <span>{thread.momentCount} momentos</span>
              <span>{formatShortDate(thread.updatedAt)}</span>
            </div>
            <h2 className="font-serif">{threadTitle(thread)}</h2>
            <div className={styles.threadPreview}>
              {renderProse(textExcerpt(thread.summary ?? thread.latestText ?? "", 150))}
            </div>
            <span className={styles.threadAction}>Abrir fio</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function MobileControls({ range, mood }: { range: (typeof RANGES)[number]; mood: string | null }) {
  return (
    <section className={styles.mobileControls} aria-label="Filtros da linha do tempo">
      <PeriodTabs range={range} mood={mood} />
      <div className={styles.mobileMoodRow}>
        {(["calmo", "leve", "ansioso"] as const).map((item) => {
          const active = item === mood;
          return (
            <Link
              key={item}
              href={hrefFor(range, mood, { mood: active ? undefined : item })}
              className={active ? styles.activeChip : undefined}
              aria-current={active ? "true" : undefined}
            >
              <MoodDot mood={item} />
              {moodLabel(item)}
            </Link>
          );
        })}
        <Link href={hrefFor(range, mood, { mood: undefined })} aria-label="Limpar filtro de humor">
          <span aria-hidden="true">⌘</span>
        </Link>
      </div>
    </section>
  );
}

function NowCard({ row }: { row: Row }) {
  const actionHref = row.threadId ? `/fios/${row.threadId}` : `/diario?continueEntryId=${row.id}`;
  return (
    <section className={styles.nowSection} aria-labelledby="now-title">
      <p className={styles.sectionLabel} id="now-title">Agora</p>
      <article className={styles.nowCard}>
        <div className={styles.nowMeta}>
          <span>
            <MoodDot mood={row.mood} />
            {formatShortDate(row.createdAt)}
          </span>
          <time>{formatTime(row.createdAt)}</time>
        </div>
        <div className={`font-serif ${styles.nowText}`}>{renderProse(excerpt(row, 140))}</div>
        <div className={styles.nowAside}>
          <span>{entryMeasure(row)}</span>
          <Link
            href={actionHref}
            className={styles.cardThreadAction}
            aria-label={row.threadId ? "Abrir fio deste registro" : "Continuar este registro como fio"}
          >
            {row.threadId ? "Abrir fio" : "Continuar como fio"}
          </Link>
        </div>
      </article>
    </section>
  );
}

function WeekRail({
  rows,
  mood,
  range,
}: {
  rows: Row[];
  mood: string | null;
  range: (typeof RANGES)[number];
}) {
  if (rows.length === 0) return null;

  const clima = mood ?? topMood(rows);
  const title = range === "week" ? "Esta semana" : "Destaques";

  return (
    <section className={styles.weekSection} aria-labelledby="week-title">
      <div className={styles.sectionHeader}>
        <p className={styles.sectionLabel} id="week-title">{title}</p>
        <span>Arraste para ver mais</span>
      </div>
      <div className={styles.weekRail}>
        {rows.slice(0, 5).map((row, index) => {
          const actionHref = row.threadId ? `/fios/${row.threadId}` : `/diario?continueEntryId=${row.id}`;
          return (
          <article
            className={styles.weekCard}
            data-size={index === 0 ? "tall" : index === 1 ? "wide" : "compact"}
            data-visual={index === 1 ? "wash" : undefined}
            key={row.id}
          >
            <div className={styles.weekCardMeta}>
              <span>{formatShortDate(row.createdAt)}</span>
              <span>{formatTime(row.createdAt)}</span>
            </div>
            <div className={`font-serif ${styles.weekText}`}>{renderProse(excerpt(row, index === 0 ? 82 : 94))}</div>
            <span className={styles.weekMood}>
              <MoodDot mood={row.mood} />
              {moodLabel(row.mood)}
            </span>
            <Link className={styles.cardThreadAction} href={actionHref}>
              {row.threadId ? "Abrir fio" : "Continuar como fio"}
            </Link>
          </article>
          );
        })}
        <article className={`${styles.weekCard} ${styles.roundSummary}`}>
          <div className={styles.roundIcon} aria-hidden="true">≈</div>
          <p>Seu padrão esta semana</p>
          <strong>{moodLabel(clima)}</strong>
          <span>
            Presença · Descanso
            <br />
            Criação
          </span>
          <MoodDot mood={clima} />
        </article>
      </div>
      <div className={styles.railDots} aria-hidden="true">
        <span />
        <span className={styles.activeRailDot} />
        <span />
        <span />
      </div>
    </section>
  );
}

async function InsightsPanel({
  week,
  latest,
  range,
  mood,
}: {
  week: InsightSource[];
  latest: Row | null;
  range: (typeof RANGES)[number];
  mood: string | null;
}) {
  let main = "A Timeline guarda os sinais recentes sem transformar seu diário em dashboard.";

  try {
    const data = await generateInsights(week);
    main = data.main;
  } catch {
    // Mantém fallback local e evita bloquear a timeline.
  }

  const displayMain = textExcerpt(main, 168);

  return (
    <>
      <aside className={styles.insightRail} id="patterns" aria-label="Padrão da semana e filtros">
        <section className={styles.patternCard}>
          <p className={styles.sectionLabel}>Padrão da semana</p>
          <div className={`font-serif ${styles.patternText}`}>{renderProse(displayMain)}</div>
          <a href="#records" className={styles.softAction}>Entender padrão <span aria-hidden="true">›</span></a>
        </section>

        <div className={styles.railDivider} />

        <section className={styles.railFilters} aria-label="Filtros avançados">
          <p className={styles.sectionLabel}>Filtrar por</p>
          <span>Humor</span>
          <MoodFilters range={range} mood={mood} />
          <span>Data</span>
          <div className={styles.dateFilters}>
            <Link href={hrefFor(range, mood, { range: "week" })}>Últimos 7 dias</Link>
            <Link href={hrefFor(range, mood, { range: "month" })}>Este mês</Link>
            <Link href={hrefFor(range, mood, { range: "all" })}>Tudo</Link>
          </div>
        </section>
      </aside>

      <section className={styles.mobilePatternCard} aria-label="Padrão da semana">
        <span className={styles.mobilePatternIcon} aria-hidden="true">✦</span>
        <div>
          <p className={styles.sectionLabel}>Padrão da semana</p>
          <div className={`font-serif ${styles.mobilePatternText}`}>{renderProse(textExcerpt(main, 128))}</div>
        </div>
        <a href="#records" aria-label="Ir para registros">
          <span aria-hidden="true">›</span>
        </a>
      </section>
    </>
  );
}

function Archive({ groups }: { groups: [string, Row[]][] }) {
  if (groups.length === 0) return null;

  return (
    <section className={styles.archive} id="records" aria-labelledby="records-title">
      <div className={styles.archiveHeader}>
        <p className={styles.sectionLabel} id="records-title">Registros</p>
        <a href="#records">Ver mais <span aria-hidden="true">›</span></a>
      </div>
      {groups.slice(0, 2).map(([month, monthRows]) => (
        <div className={styles.monthGroup} key={month}>
          <h2>{month}</h2>
          <div className={styles.archiveTable}>
            {monthRows.slice(0, 5).map((row) => (
              row.threadId ? (
                <Link className={styles.archiveRow} href={`/fios/${row.threadId}`} key={row.id}>
                  <time>{formatShortDate(row.createdAt)}</time>
                  <MoodDot mood={row.mood} />
                  <div className={`font-serif ${styles.archiveText}`}>{renderProse(excerpt(row, 104))}</div>
                  <span className={styles.archiveMeasure}>Abrir fio</span>
                </Link>
              ) : (
                <Link className={styles.archiveRow} href={`/diario?continueEntryId=${row.id}`} key={row.id}>
                  <time>{formatShortDate(row.createdAt)}</time>
                  <MoodDot mood={row.mood} />
                  <div className={`font-serif ${styles.archiveText}`}>{renderProse(excerpt(row, 104))}</div>
                  <span className={styles.archiveMeasure}>Continuar</span>
                </Link>
              )
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function EmptyState({ hasEntries, range, mood }: { hasEntries: boolean; range: (typeof RANGES)[number]; mood: string | null }) {
  return (
    <section className={styles.empty}>
      <p className={styles.sectionLabel}>{hasEntries ? "sem resultado" : "primeiro registro"}</p>
      <h1 className="font-serif">
        {hasEntries ? "Nenhum registro nesse filtro." : "Sua linha começa com uma fala."}
      </h1>
      <p>
        {hasEntries
          ? "Ajuste o período ou o humor para reencontrar outros momentos."
          : "Grave alguns minutos no diário. A Aurora organiza os primeiros fios quando você terminar."}
      </p>
      <div className={styles.emptyActions}>
        {hasEntries && <Link href={hrefFor(range, mood, { range: "all", mood: undefined })}>Limpar filtros</Link>}
        <Link href="/diario">Nova entrada</Link>
      </div>
    </section>
  );
}

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<TimelineSearchParams>;
}) {
  const params = await searchParams;
  const range = normalizeRange(params.range);
  const mood = normalizeMood(params.mood);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const rows: Row[] = await db
    .select({
      id: entries.id,
      transcript: entries.transcript,
      reflection: entries.reflection,
      mood: entries.mood,
      threadId: entries.threadId,
      createdAt: entries.createdAt,
    })
    .from(entries)
    .where(
      and(
        eq(entries.userId, user.id),
        or(isNotNull(entries.transcript), isNotNull(entries.reflection)),
      ),
    )
    .orderBy(desc(entries.createdAt))
    .limit(120);

  const threadRows = await db
    .select({
      id: entryThreads.id,
      title: entryThreads.title,
      summary: entryThreads.summary,
      updatedAt: entryThreads.updatedAt,
      momentCount: sql<number>`count(${entries.id})::int`,
      latestText: sql<string | null>`(
        array_agg(coalesce(${entries.transcript}, ${entries.reflection}) order by ${entries.createdAt} desc)
      )[1]`,
      latestMood: sql<string | null>`(array_agg(${entries.mood} order by ${entries.createdAt} desc))[1]`,
    })
    .from(entryThreads)
    .leftJoin(entries, and(eq(entries.threadId, entryThreads.id), eq(entries.userId, user.id)))
    .where(and(eq(entryThreads.userId, user.id), isNotNull(entryThreads.rootEntryId)))
    .groupBy(entryThreads.id)
    .orderBy(desc(entryThreads.updatedAt))
    .limit(24);

  const threads = (threadRows as ThreadPreviewRow[]).filter((thread) => thread.momentCount > 1);

  const filteredRows = rows.filter((row) => inRange(row, range) && (!mood || row.mood === mood));
  const latest = filteredRows[0] ?? null;
  const weekRows = rows.filter((r) => inRange(r, "week"));
  const week: InsightSource[] = weekRows.map((r) => ({
    transcript: r.transcript,
    reflection: r.reflection,
    mood: r.mood,
  }));
  const railRows = filteredRows.filter((row) => row.id !== latest?.id);
  const archiveGroups = groupedByMonth(filteredRows.filter((row) => row.id !== latest?.id));

  return (
    <main className={styles.stage}>
      <ProductNav
        active="timeline"
        context={`${rows.length} registros`}
      />
      <div className={styles.inner}>
        <Header range={range} mood={mood} />
        <MobileControls range={range} mood={mood} />

        {filteredRows.length === 0 ? (
          <EmptyState hasEntries={rows.length > 0} range={range} mood={mood} />
        ) : (
          <div className={styles.layout}>
            <div className={styles.contentColumn}>
              {latest && <NowCard row={latest} />}
              <ThreadRail threads={threads} />
              <WeekRail rows={railRows} mood={mood} range={range} />
              <Suspense fallback={<div className={styles.skeleton}>Lendo os fios da sua semana…</div>}>
                <InsightsPanel week={week} latest={latest} range={range} mood={mood} />
              </Suspense>
              <Archive groups={archiveGroups} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
