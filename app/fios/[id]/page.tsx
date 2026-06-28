import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { entries, entryThreads } from "@/lib/db/schema";
import { ProductNav } from "@/components/product/ProductNav";
import { renderProse } from "@/lib/render-prose";
import styles from "./Fio.module.css";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MomentRow = {
  id: string;
  transcript: string | null;
  reflection: string | null;
  mood: string | null;
  createdAt: Date;
  threadPosition: number | null;
};

const MOOD_LABEL: Record<string, string> = {
  leve: "Leve",
  calmo: "Calmo",
  pesado: "Pesado",
  "sensível": "Sensível",
  ansioso: "Ansioso",
};

const MOOD_COLOR: Record<string, string> = {
  leve: "#8ed4bb",
  calmo: "#a9c8f4",
  pesado: "#a8a0c4",
  "sensível": "#efb18f",
  ansioso: "#e6ad71",
};

function cleanText(text: string | null) {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

function excerpt(text: string | null, max = 132) {
  const clean = cleanText(text);
  if (!clean) return "Resumo curto";
  return clean.length > max ? `${clean.slice(0, max).trim()}...` : clean;
}

function wordCount(text: string | null) {
  const clean = cleanText(text);
  return clean ? clean.split(/\s+/).length : 0;
}

function formatThreadDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  })
    .format(date)
    .replace(".", "");
}

function formatMomentDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(date)
    .replace(".", "");
}

function moodLabel(mood: string | null) {
  return mood ? (MOOD_LABEL[mood] ?? mood) : "Sem humor";
}

function moodColor(mood: string | null) {
  return mood ? (MOOD_COLOR[mood] ?? "#a8a0c4") : "#a8a0c4";
}

function continueHref(entryId: string) {
  return `/diario?continueEntryId=${encodeURIComponent(entryId)}`;
}

function momentHref(threadId: string, entryId: string, view: FioView) {
  const params = new URLSearchParams({ moment: entryId, view });
  return `/fios/${threadId}?${params.toString()}`;
}

function fallbackTitle(rows: MomentRow[]) {
  const firstText = cleanText(rows[0]?.transcript ?? rows[0]?.reflection ?? null);
  if (!firstText) return "Fio do diário";
  return firstText.length > 46 ? `${firstText.slice(0, 46).trim()}...` : firstText;
}

function momentLabel(moment: MomentRow, index: number) {
  return `Momento ${moment.threadPosition ?? index + 1}`;
}

function momentState(moment: MomentRow) {
  if (moment.transcript && moment.reflection) return "Registro e leitura";
  if (moment.transcript) return "Só registrado";
  return "Leitura Aurora";
}

type FioView = "registro" | "aurora";

function normalizeView(value: string | undefined): FioView {
  return value === "aurora" ? "aurora" : "registro";
}

export default async function FioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ moment?: string; view?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const view = normalizeView(query.view);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [thread] = await db
    .select({
      id: entryThreads.id,
      title: entryThreads.title,
      summary: entryThreads.summary,
      createdAt: entryThreads.createdAt,
      updatedAt: entryThreads.updatedAt,
    })
    .from(entryThreads)
    .where(and(eq(entryThreads.id, id), eq(entryThreads.userId, user.id)))
    .limit(1);

  if (!thread) {
    notFound();
  }

  const moments: MomentRow[] = await db
    .select({
      id: entries.id,
      transcript: entries.transcript,
      reflection: entries.reflection,
      mood: entries.mood,
      createdAt: entries.createdAt,
      threadPosition: entries.threadPosition,
    })
    .from(entries)
    .where(and(eq(entries.threadId, thread.id), eq(entries.userId, user.id)))
    .orderBy(asc(entries.threadPosition), asc(entries.createdAt));

  if (moments.length === 0) {
    notFound();
  }

  const selectedMoment = moments.find((moment) => moment.id === query.moment) ?? moments[moments.length - 1];
  const title = thread.title ?? fallbackTitle(moments);
  const reflectionPoint = selectedMoment.reflection ?? thread.summary;
  const latestReading = selectedMoment.reflection ?? thread.summary ?? selectedMoment.transcript;
  const selectedText =
    view === "aurora"
      ? selectedMoment.reflection ?? thread.summary ?? "Este momento ainda não tem leitura da Aurora disponível."
      : selectedMoment.transcript ?? "Este momento ainda não tem transcrição disponível.";
  const selectedWords = wordCount(selectedMoment.transcript);
  const threadMeta = `${formatThreadDate(thread.createdAt)} · ${moments.length} ${
    moments.length === 1 ? "momento" : "momentos"
  } · última leitura hoje`;

  return (
    <main className={styles.stage}>
      <ProductNav active="timeline" context={`${moments.length} ${moments.length === 1 ? "momento" : "momentos"}`} />
      <div className={styles.shell}>
        <section className={styles.desktopIntro} aria-labelledby="fio-open-title">
          <h1 id="fio-open-title">Fio aberto</h1>
          <p>{title}</p>
        </section>

        <section className={styles.mobileIntro} aria-labelledby="fio-mobile-title">
          <div className={styles.mobileTitleRow}>
            <h1 id="fio-mobile-title">Fio</h1>
            <Link href="/fios">Todos os fios</Link>
          </div>
          <h2>{title}</h2>
          <p>{threadMeta}</p>
        </section>

        <section className={styles.workspace} aria-label="Fio aberto">
          <aside className={styles.momentsPanel} aria-label="Momentos do fio">
            <h2>Momentos</h2>
            <div className={styles.momentList}>
              {moments.map((moment, index) => {
                const isSelected = moment.id === selectedMoment.id;
                return (
                  <Link
                    className={`${styles.momentRow} ${isSelected ? styles.selectedMoment : ""}`}
                    href={momentHref(thread.id, moment.id, view)}
                    key={moment.id}
                    aria-current={isSelected ? "true" : undefined}
                  >
                    <span
                      className={styles.dot}
                      style={{ backgroundColor: moodColor(moment.mood) }}
                      aria-hidden="true"
                    />
                    <div>
                      <h3>{momentLabel(moment, index)}</h3>
                      <p>{isSelected ? `${momentState(moment)} · selecionado` : excerpt(moment.transcript, 36)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </aside>

          <section className={styles.readerPanel} id="fio-reader" aria-labelledby="selected-moment-title">
            <div className={styles.segmented} aria-label="Visão do momento selecionado">
              <Link
                className={view === "registro" ? styles.segmentActive : undefined}
                href={momentHref(thread.id, selectedMoment.id, "registro")}
                aria-current={view === "registro" ? "true" : undefined}
              >
                Seu registro
              </Link>
              <Link
                className={view === "aurora" ? styles.segmentActive : undefined}
                href={momentHref(thread.id, selectedMoment.id, "aurora")}
                aria-current={view === "aurora" ? "true" : undefined}
              >
                Leitura Aurora
              </Link>
            </div>

            <div className={styles.readerBody} id="momento-selecionado">
              <h2 id="selected-moment-title">Momento selecionado</h2>
              <div className={styles.readerText}>{renderProse(selectedText)}</div>
              <p className={styles.readerMeta}>
                {view === "registro"
                  ? selectedWords > 0
                    ? `${selectedWords} palavras`
                    : "Sem contagem de palavras"
                  : "Leitura da Aurora"}
              </p>
            </div>

            <div className={styles.readerActions}>
              <Link href="/fios">Todos os fios</Link>
              <Link href={continueHref(selectedMoment.id)}>Adicionar momento</Link>
            </div>
            <p className={styles.helper}>
              Adicionar momento mantém esta sequência como um fio único.
            </p>
          </section>

          <aside className={styles.contextPanel} aria-label="Contexto do fio">
            <div className={styles.contextHead}>
              <span>Fio</span>
              <Link href="/timeline">Timeline</Link>
            </div>

            <section className={styles.threadInfo}>
              <h2>{title}</h2>
              <p>{formatThreadDate(thread.createdAt)} · {moments.length} {moments.length === 1 ? "momento" : "momentos"}</p>
            </section>

            {reflectionPoint && (
              <section className={`${styles.contextCard} ${styles.reflectionCard}`}>
                <h3>Ponto de reflexão</h3>
                <div>{renderProse(excerpt(reflectionPoint, 112))}</div>
              </section>
            )}
            <p className={styles.note}>Aparece só se houver algo retomável.</p>

            {latestReading && (
              <section className={`${styles.contextCard} ${styles.latestCard}`}>
                <h3>Leitura mais recente</h3>
                <div>{renderProse(excerpt(latestReading, 116))}</div>
              </section>
            )}

            <div className={`${styles.contextActions} ${styles.desktopContextActions}`}>
              <Link href={continueHref(selectedMoment.id)}>Só registrar novo momento</Link>
              <Link href="/fios">Todos os fios</Link>
            </div>

            <div className={`${styles.contextActions} ${styles.mobileContextActions}`}>
              <Link href={continueHref(selectedMoment.id)}>Adicionar momento</Link>
              <Link href="/fios">Todos os fios</Link>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
