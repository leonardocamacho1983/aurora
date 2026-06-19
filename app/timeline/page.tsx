import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { entries } from "@/lib/db/schema";
import { generateInsights, type InsightSource } from "@/lib/ai/insights";
import { renderProse } from "@/lib/render-prose";
import styles from "./Timeline.module.css";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MOOD_COLOR: Record<string, string> = {
  leve: "var(--mood-leve)",
  calmo: "var(--mood-calmo)",
  pesado: "var(--mood-pesado)",
  sensível: "var(--mood-sensivel)",
  ansioso: "var(--mood-ansioso)",
};

type Row = {
  id: string;
  transcript: string | null;
  reflection: string | null;
  mood: string | null;
  createdAt: Date;
};

function formatDate(d: Date): string {
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const days = Math.round(
    (startOfDay(new Date()).getTime() - startOfDay(d).getTime()) / 86_400_000,
  );
  if (days <= 0) return "hoje";
  if (days === 1) return "ontem";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(d);
}

// Histórico = palavra do usuário (transcrição primeiro).
function trecho(transcript: string | null, reflection: string | null): string {
  const raw = (transcript ?? reflection ?? "").replace(/\s+/g, " ").trim();
  return raw.length > 120 ? `${raw.slice(0, 120)}…` : raw;
}

function moodColor(mood: string | null): string {
  return mood ? (MOOD_COLOR[mood] ?? "var(--ink-faint)") : "var(--hairline)";
}

function countWords(text: string | null): number {
  const t = (text ?? "").trim();
  return t ? t.split(/\s+/).length : 0;
}

// Insights (voz da Aurora) — assíncrono, chega por streaming via Suspense.
async function InsightsBlock({ week }: { week: InsightSource[] }) {
  let main = "Um passo de cada vez. Toque no orb quando quiser falar.";
  let secondary: string[] = [];
  try {
    const data = await generateInsights(week);
    main = data.main;
    secondary = data.secondary;
  } catch {
    // mantém o fallback
  }

  return (
    <>
      <section className={styles.mainInsight}>
        <span className={styles.label}>leitura da semana</span>
        <div className={`font-serif ${styles.mainInsightText}`}>{renderProse(main)}</div>
      </section>

      {secondary.length > 0 && (
        <div className={styles.board}>
          {secondary.map((s, i) => (
            <article key={i} className={`${styles.card} ${styles.insightCard}`}>
              <span className={styles.label}>insight</span>
              <div className={`font-serif ${styles.insightText}`}>{renderProse(s)}</div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

export default async function TimelinePage() {
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
      createdAt: entries.createdAt,
    })
    .from(entries)
    .where(eq(entries.userId, user.id))
    .orderBy(desc(entries.createdAt))
    .limit(60);

  const latest = rows[0];
  const rest = rows.slice(1);
  const weekAgo = Date.now() - 7 * 86_400_000;
  const weekRows = rows.filter((r) => r.createdAt.getTime() >= weekAgo);
  const week: InsightSource[] = weekRows.map((r) => ({
    transcript: r.transcript,
    reflection: r.reflection,
    mood: r.mood,
  }));
  const wordsThisWeek = weekRows.reduce((sum, r) => sum + countWords(r.transcript), 0);

  return (
    <main className={styles.stage}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.topCopy}>
            <Link href="/" className={styles.brand}>
              <span className={styles.brandOrb} aria-hidden="true" />
              <span>Aurora</span>
            </Link>
            <p className={styles.kicker}>Sua linha do tempo</p>
            {weekRows.length > 0 && (
              <p className={styles.usage}>
                {weekRows.length}{" "}
                {weekRows.length === 1 ? "registro" : "registros"} · {wordsThisWeek}{" "}
                {wordsThisWeek === 1 ? "palavra" : "palavras"} esta semana
              </p>
            )}
          </div>
          <Link href="/diario" className={styles.orbButton} aria-label="Nova entrada">
            <span>Falar</span>
          </Link>
        </div>

        {rows.length === 0 ? (
          <section className={styles.empty}>
            <p className={styles.label}>primeiro registro</p>
            <h1 className="font-serif">Sua linha começa com uma fala.</h1>
            <p>Grave alguns minutos no diário. A Aurora organiza o primeiro ponto quando você terminar.</p>
            <Link href="/diario" className={styles.primaryLink}>Começar pelo diário</Link>
          </section>
        ) : (
          <>
            {/* Hero — palavra mais recente, ainda quente */}
            {latest && (
              <section className={styles.hero}>
                <div className={styles.heroBody}>
                  <span className={styles.label}>{formatDate(latest.createdAt)} · você trouxe</span>
                  <div className={`font-serif ${styles.heroText}`}>
                    {renderProse(latest.transcript ?? latest.reflection ?? "")}
                  </div>
                  {latest.mood && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", color: "var(--ink-soft)", fontSize: "0.9rem" }}>
                      <span className={styles.dot} style={{ background: moodColor(latest.mood) }} />
                      {latest.mood}
                    </span>
                  )}
                </div>
              </section>
            )}

            {/* Insights (voz da Aurora, streaming) */}
            <Suspense
              fallback={<div className={styles.skeleton}>Lendo os fios da sua semana…</div>}
            >
              <InsightsBlock week={week} />
            </Suspense>

            {/* Histórico — palavra do usuário, esfriando */}
            {rest.length > 0 && (
              <section className={styles.history}>
                <div className={styles.sectionHead}>
                  <span className={styles.label}>histórico</span>
                  <p>Registros anteriores, em ordem do mais recente para o mais antigo.</p>
                </div>
                <div className={styles.board}>
                  {rest.map((e) => (
                    <article key={e.id} className={styles.card}>
                      <div className={styles.entryHead}>
                        <span className={styles.dot} style={{ background: moodColor(e.mood) }} />
                        <span className={styles.date}>{formatDate(e.createdAt)}</span>
                      </div>
                      <p className={`font-serif ${styles.trecho}`}>
                        {trecho(e.transcript, e.reflection)}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
