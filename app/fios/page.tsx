import Link from "next/link";
import { redirect } from "next/navigation";
import { and, desc, eq, isNotNull, isNull, or, sql } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { entries, entryThreads } from "@/lib/db/schema";
import { ProductNav } from "@/components/product/ProductNav";
import { renderProse } from "@/lib/render-prose";
import styles from "./Fios.module.css";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ThreadRow = {
  id: string;
  title: string | null;
  summary: string | null;
  updatedAt: Date;
  momentCount: number;
  latestText: string | null;
};

type SuggestedThreadRow = {
  id: string;
  transcript: string | null;
  reflection: string | null;
  mood: string | null;
  createdAt: Date;
};

function excerpt(text: string | null, max = 150) {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return "Fio do diário";
  return clean.length > max ? `${clean.slice(0, max).trim()}...` : clean;
}

function entryText(row: SuggestedThreadRow) {
  return (row.transcript ?? row.reflection ?? "").replace(/\s+/g, " ").trim();
}

function suggestedTitle(row: SuggestedThreadRow) {
  return excerpt(row.transcript ?? row.reflection, 74);
}

function suggestedPreview(row: SuggestedThreadRow) {
  return row.reflection ?? entryText(row);
}

function moodLabel(mood: string | null) {
  if (!mood) return "Registro";
  return mood.charAt(0).toUpperCase() + mood.slice(1);
}

function formatUpdatedAt(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function FiosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const rows = await db
    .select({
      id: entryThreads.id,
      title: entryThreads.title,
      summary: entryThreads.summary,
      updatedAt: entryThreads.updatedAt,
      momentCount: sql<number>`count(${entries.id})::int`,
      latestText: sql<string | null>`(
        array_agg(coalesce(${entries.transcript}, ${entries.reflection}) order by ${entries.createdAt} desc)
      )[1]`,
    })
    .from(entryThreads)
    .leftJoin(entries, and(eq(entries.threadId, entryThreads.id), eq(entries.userId, user.id)))
    .where(and(eq(entryThreads.userId, user.id), isNotNull(entryThreads.rootEntryId)))
    .groupBy(entryThreads.id)
    .orderBy(desc(entryThreads.updatedAt))
    .limit(40);

  const threads = rows as ThreadRow[];
  const suggestedThreads: SuggestedThreadRow[] = await db
    .select({
      id: entries.id,
      transcript: entries.transcript,
      reflection: entries.reflection,
      mood: entries.mood,
      createdAt: entries.createdAt,
    })
    .from(entries)
    .where(
      and(
        eq(entries.userId, user.id),
        isNull(entries.threadId),
        or(isNotNull(entries.transcript), isNotNull(entries.reflection)),
      ),
    )
    .orderBy(desc(entries.createdAt))
    .limit(12);
  const visibleCount = threads.length + suggestedThreads.length;

  return (
    <main className={styles.stage}>
      <ProductNav
        active="timeline"
        context={`${visibleCount} ${visibleCount === 1 ? "fio" : "fios"}`}
      />
      <div className={styles.inner}>
        <section className={styles.hero} aria-labelledby="fios-title">
          <p>Fios</p>
          <h1 id="fios-title" className="font-serif">Linhas de pensamento em andamento.</h1>
          <div className={styles.heroActions}>
            <Link href="/timeline">Timeline</Link>
            <Link href="/diario">Nova entrada</Link>
          </div>
        </section>

        {threads.length === 0 && suggestedThreads.length === 0 ? (
          <section className={styles.empty}>
            <p>Nenhum fio ainda</p>
            <h2 className="font-serif">Quando você continuar um registro, ele vira fio.</h2>
            <div className={styles.emptyActions}>
              <Link href="/timeline">Ver Timeline</Link>
              <Link href="/diario">Nova entrada</Link>
            </div>
          </section>
        ) : (
          <div className={styles.sections}>
            {threads.length > 0 && (
              <section className={styles.listSection} aria-label="Fios em andamento">
                <div className={styles.sectionHead}>
                  <p>Em andamento</p>
                  <span>{threads.length} {threads.length === 1 ? "fio" : "fios"}</span>
                </div>
                <div className={styles.list}>
                  {threads.map((thread) => (
                    <Link className={styles.threadCard} href={`/fios/${thread.id}`} key={thread.id}>
                      <div className={styles.threadMeta}>
                        <span>{thread.momentCount} {thread.momentCount === 1 ? "momento" : "momentos"}</span>
                        <span>{formatUpdatedAt(thread.updatedAt)}</span>
                      </div>
                      <h2 className="font-serif">{thread.title ?? excerpt(thread.latestText, 74)}</h2>
                      <div className={styles.preview}>{renderProse(thread.summary ?? excerpt(thread.latestText))}</div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {suggestedThreads.length > 0 && (
              <section className={styles.listSection} aria-label="Fios sugeridos">
                <div className={styles.sectionHead}>
                  <p>Para retomar</p>
                  <span>{suggestedThreads.length} {suggestedThreads.length === 1 ? "registro" : "registros"}</span>
                </div>
                <div className={styles.list}>
                  {suggestedThreads.map((entry) => (
                    <Link className={styles.threadCard} href={`/diario?continueEntryId=${entry.id}`} key={entry.id}>
                      <div className={styles.threadMeta}>
                        <span>1 momento · {moodLabel(entry.mood)}</span>
                        <span>{formatUpdatedAt(entry.createdAt)}</span>
                      </div>
                      <h2 className="font-serif">{suggestedTitle(entry)}</h2>
                      <div className={styles.preview}>{renderProse(excerpt(suggestedPreview(entry)))}</div>
                      <span className={styles.cardAction}>Continuar como fio</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
