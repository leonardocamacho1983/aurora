import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { entries } from "@/lib/db/schema";
import { generateWeeklyPattern } from "@/lib/ai/weekly-pattern";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MOOD_COLOR: Record<string, string> = {
  leve: "var(--mood-leve)",
  calmo: "var(--mood-calmo)",
  pesado: "var(--mood-pesado)",
  sensível: "var(--mood-sensivel)",
  ansioso: "var(--mood-ansioso)",
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

function trecho(reflection: string | null, transcript: string | null): string {
  const raw = (reflection ?? transcript ?? "").replace(/\s+/g, " ").trim();
  return raw.length > 110 ? `${raw.slice(0, 110)}…` : raw;
}

export default async function TimelinePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const rows = await db
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

  // Padrão da semana: entradas dos últimos 7 dias.
  const weekAgo = Date.now() - 7 * 86_400_000;
  const week = rows.filter((r) => r.createdAt.getTime() >= weekAgo);
  let pattern: string;
  try {
    pattern = await generateWeeklyPattern(week);
  } catch {
    pattern = "Um passo de cada vez. Toque no orb quando quiser falar.";
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        maxWidth: 620,
        margin: "0 auto",
        padding: "var(--space-7) var(--space-5)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-6)",
      }}
    >
      <header style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <p
          className="font-serif"
          style={{ fontSize: "1.4rem", lineHeight: 1.4, color: "var(--ink)", margin: 0 }}
        >
          {pattern}
        </p>
        <Link
          href="/diario"
          style={{ color: "var(--accent)", fontSize: "0.95rem", textDecoration: "none" }}
        >
          ＋ Nova entrada
        </Link>
      </header>

      {rows.length === 0 ? (
        <p style={{ color: "var(--ink-soft)" }}>
          Ainda não há entradas. Toque no orb pra começar.
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column" }}>
          {rows.map((e) => (
            <li
              key={e.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "var(--space-3)",
                padding: "var(--space-4) 0",
                borderTop: "1px solid var(--hairline)",
              }}
            >
              <span
                aria-hidden="true"
                title={e.mood ?? undefined}
                style={{
                  flex: "0 0 auto",
                  width: 10,
                  height: 10,
                  marginTop: 7,
                  borderRadius: "50%",
                  background: e.mood ? (MOOD_COLOR[e.mood] ?? "var(--ink-faint)") : "var(--hairline)",
                }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                <span style={{ color: "var(--ink-faint)", fontSize: "0.8rem" }}>
                  {formatDate(e.createdAt)}
                </span>
                <span style={{ color: "var(--ink-soft)" }}>
                  {trecho(e.reflection, e.transcript)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
