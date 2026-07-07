import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, asc, eq, isNotNull, or } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { entries } from "@/lib/db/schema";
import { HideFocusButton } from "@/app/mapa/HideFocusButton";
import { MapaTrackedLink } from "@/app/mapa/MapaAnalytics";
import { resolveEntryFocus } from "@/app/mapa/actions";
import { liveFocusSignalFromStored } from "@/lib/mapa/focus";
import { renderProse } from "@/lib/render-prose";
import styles from "./Fio.module.css";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MOOD_COLOR: Record<string, string> = {
  leve: "var(--mood-leve)",
  calmo: "var(--mood-calmo)",
  pesado: "var(--mood-pesado)",
  sensivel: "var(--mood-sensivel)",
  sensível: "var(--mood-sensivel)",
  ansioso: "var(--mood-ansioso)",
};

const THREAD_COLORS = [
  "var(--aurora-pink)",
  "var(--aurora-blue)",
  "var(--aurora-mint)",
  "var(--aurora-warm)",
  "var(--accent-soft)",
];

type FioRow = {
  id: string;
  transcript: string | null;
  reflection: string | null;
  mood: string | null;
  entryMode: string;
  continuedFromEntryId: string | null;
  focusKey: string | null;
  focusConfidence: string | null;
  focusHiddenAt: Date | null;
  focusResolvedAt: Date | null;
  createdAt: Date;
};

function cleanText(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function excerpt(value: string | null | undefined, max = 170) {
  const text = cleanText(value);
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

function titleFrom(text: string | null | undefined) {
  const clean = cleanText(text);
  if (!clean) return "Fio do diário";
  const firstSentence = clean.split(/[.!?]\s/)[0] ?? clean;
  return firstSentence.length > 58 ? `${firstSentence.slice(0, 58).trim()}…` : firstSentence;
}

function formatDay(date: Date) {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const then = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.round((start.getTime() - then.getTime()) / 86_400_000);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Ontem";
  if (diff < 14) {
    const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(date);
    return weekday.charAt(0).toUpperCase() + weekday.slice(1);
  }
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(date);
}

function wordCount(value: string | null | undefined) {
  const text = cleanText(value);
  return text ? text.split(/\s+/).length : 0;
}

function entryMeasure(row: FioRow) {
  const words = wordCount(row.transcript ?? row.reflection);
  if (!words) return "registro";
  return `${words} ${words === 1 ? "palavra" : "palavras"}`;
}

function moodColor(mood: string | null) {
  return mood ? (MOOD_COLOR[mood] ?? "var(--mood-neutro)") : "var(--mood-neutro)";
}

function moodLabel(mood: string | null) {
  if (!mood) return "registro";
  return mood === "sensivel" ? "sensível" : mood;
}

function threadColor(id: string) {
  const sum = [...id].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return THREAD_COLORS[sum % THREAD_COLORS.length];
}

function buildQuestion(title: string) {
  const subject = title.toLowerCase().replace(/[.!?…]+$/u, "");
  return `O que este fio ainda está tentando te mostrar sobre ${subject}?`;
}

function buildFioRows(anchorId: string, rows: FioRow[]) {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const childrenByParent = new Map<string, FioRow[]>();

  for (const row of rows) {
    if (!row.continuedFromEntryId) continue;
    const children = childrenByParent.get(row.continuedFromEntryId) ?? [];
    children.push(row);
    childrenByParent.set(row.continuedFromEntryId, children);
  }

  for (const children of childrenByParent.values()) {
    children.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  const anchor = byId.get(anchorId);
  if (!anchor) return [];

  const seen = new Set<string>();
  const ancestors: FioRow[] = [];
  let current: FioRow | undefined = anchor;

  while (current?.continuedFromEntryId) {
    const parent = byId.get(current.continuedFromEntryId);
    if (!parent || seen.has(parent.id)) break;
    seen.add(parent.id);
    ancestors.unshift(parent);
    current = parent;
  }

  const chain = [...ancestors, anchor];
  for (const row of chain) seen.add(row.id);

  function appendDescendants(row: FioRow) {
    const children = childrenByParent.get(row.id) ?? [];
    for (const child of children) {
      if (seen.has(child.id)) continue;
      seen.add(child.id);
      chain.push(child);
      appendDescendants(child);
    }
  }

  appendDescendants(anchor);

  return chain;
}

export default async function FioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const rows: FioRow[] = await db
    .select({
      id: entries.id,
      transcript: entries.transcript,
      reflection: entries.reflection,
      mood: entries.mood,
      entryMode: entries.entryMode,
      continuedFromEntryId: entries.continuedFromEntryId,
      focusKey: entries.focusKey,
      focusConfidence: entries.focusConfidence,
      focusHiddenAt: entries.focusHiddenAt,
      focusResolvedAt: entries.focusResolvedAt,
      createdAt: entries.createdAt,
    })
    .from(entries)
    .where(
      and(
        eq(entries.userId, user.id),
        or(isNotNull(entries.transcript), isNotNull(entries.reflection)),
      ),
    )
    .orderBy(asc(entries.createdAt))
    .limit(500);

  const fioRows = buildFioRows(id, rows);
  if (fioRows.length === 0) {
    notFound();
  }

  const root = fioRows[0];
  const latest = fioRows[fioRows.length - 1];
  const color = threadColor(root.id);
  const title = titleFrom(root.transcript ?? root.reflection);
  const summary =
    fioRows.length === 1
      ? "Este registro ainda pode continuar sem você precisar recontar tudo."
      : `Uma sequência de ${fioRows.length} registros ligados desde ${formatDay(root.createdAt).toLowerCase()}.`;
  const continueHref = `/diario?continueEntryId=${latest.id}&source=fio`;

  return (
    <main className={styles.stage} style={{ "--fio": color } as React.CSSProperties}>
      <Link className={styles.floatBack} href="/timeline">
        <span aria-hidden="true">←</span>
        Timeline
      </Link>

      <div className={styles.mag}>
        <section className={styles.cover}>
          <div className={styles.folioLine}>
            <span>Aurora Fios</span>
            <span>
              {fioRows.length} {fioRows.length === 1 ? "momento" : "momentos"}
            </span>
          </div>
          <h1 className={styles.fioTitle}>{title}</h1>
          <p>{summary}</p>
          <Link className={styles.cBtn} href={continueHref}>
            Continuar fio <span aria-hidden="true">→</span>
          </Link>
        </section>

        <section className={styles.recordIndex} aria-labelledby="registros-fio-title">
          <div className={styles.recordIndexHead}>
            <span className={styles.label}>Registros neste fio</span>
            <h2 id="registros-fio-title">
              {fioRows.length} {fioRows.length === 1 ? "registro ligado" : "registros ligados"}
            </h2>
          </div>
          <div className={styles.recordList}>
            {fioRows.map((row, index) => (
              <a className={styles.recordRow} href={`#registro-${row.id}`} key={row.id}>
                <span className={styles.recordDot} style={{ background: moodColor(row.mood) }} aria-hidden="true" />
                <span className={styles.recordCopy}>
                  <strong>
                    {index + 1}. {formatDay(row.createdAt)} · {formatTime(row.createdAt)}
                  </strong>
                  <span>{titleFrom(row.transcript ?? row.reflection)}</span>
                </span>
                <span className={styles.recordMeta}>ver</span>
              </a>
            ))}
          </div>
        </section>

        <section className={styles.pergunta}>
          <span className={styles.label}>Pergunta viva</span>
          <q>{buildQuestion(title)}</q>
          <p>Você não precisa responder agora. A pergunta fica aqui, junto dos momentos, enquanto o fio segue.</p>
        </section>

        <section className={styles.threadGrid} aria-label="Momentos deste fio">
          <aside className={styles.threadId}>
            <h2>{title}</h2>
            <p>{summary}</p>
            <span>
              voltou {fioRows.length} {fioRows.length === 1 ? "vez" : "vezes"}
            </span>
          </aside>
          <div className={styles.stream}>
            {fioRows.map((row, index) => {
              const spoken = cleanText(row.transcript);
              const reflection = cleanText(row.reflection);
              const focus = liveFocusSignalFromStored({
                focusKey: row.focusKey,
                confidence: row.focusConfidence,
                hiddenAt: row.focusHiddenAt,
                resolvedAt: row.focusResolvedAt,
              });
              return (
                <article
                  className={`${styles.piece} ${index === 0 ? styles.feature : styles.note}`}
                  id={`registro-${row.id}`}
                  key={row.id}
                >
                  <div className={styles.card}>
                    <div className={styles.face}>
                      <p className={styles.meta}>
                        {formatDay(row.createdAt)} · {formatTime(row.createdAt)}
                      </p>
                      {index === 0 ? (
                        <div className={styles.said}>{renderProse(excerpt(spoken || reflection, 260))}</div>
                      ) : (
                        <>
                          <h3 className={styles.noteTitle}>{titleFrom(spoken || reflection)}</h3>
                          <div className={styles.excerpt}>{renderProse(excerpt(spoken || reflection, 180))}</div>
                        </>
                      )}
                      <div className={styles.chipRow}>
                        <span className={styles.mood}>
                          <i style={{ background: moodColor(row.mood) }} aria-hidden="true" />
                          {moodLabel(row.mood)} · {entryMeasure(row)}
                        </span>
                        {row.entryMode === "continue" || row.continuedFromEntryId ? (
                          <span className={styles.linked}>continuação</span>
                        ) : null}
                        {focus ? (
                          <span className={styles.focusChip} style={{ "--focus-color": focus.color } as React.CSSProperties}>
                            <i aria-hidden="true" />
                            {focus.label}
                          </span>
                        ) : null}
                      </div>
                      {focus ? (
                        <div className={styles.focusActions}>
                          <MapaTrackedLink
                            className={styles.cBtn}
                            eventName="product_mapa_focus_chip_clicked"
                            eventProperties={{
                              source: "fio",
                              surface: "fio_entry",
                              focus_key: focus.key,
                              focus_confidence: row.focusConfidence,
                            }}
                            href={`/mapa/${focus.key}`}
                          >
                            Ver no Mapa
                          </MapaTrackedLink>
                          <form action={resolveEntryFocus.bind(null, { entryId: row.id, focusKey: focus.key })}>
                            <button className={styles.ghostBtn} type="submit">
                              Resolver ponto
                            </button>
                          </form>
                          <HideFocusButton
                            className={styles.ghostBtn}
                            entryId={row.id}
                            fallbackFocusKey={focus.key}
                            surface="fio_entry"
                          />
                        </div>
                      ) : null}
                      <div className={styles.reading}>
                        <span className={styles.label}>{reflection ? "A Aurora percebeu" : "Ainda sem devolutiva"}</span>
                        <div>
                          {reflection
                            ? renderProse(reflection)
                            : "Este momento está guardado, mas ainda não tem uma leitura da Aurora disponível."}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className={styles.continue} id="continuar">
          <div className={styles.continueIntro}>
            <span className={styles.label}>Continuar a partir daqui</span>
            <h2>Você não precisa repetir tudo.</h2>
            <p>A Aurora retoma este fio com você. A próxima fala entra ligada ao último registro.</p>
          </div>

          <Link className={styles.cBtn} href={continueHref}>
            Continuar fio <span aria-hidden="true">→</span>
          </Link>
        </section>

        <footer className={styles.colophon}>
          <Link className={styles.back} href="/timeline">← Voltar à Timeline</Link>
          <span>privado · só seu</span>
        </footer>
      </div>
    </main>
  );
}
