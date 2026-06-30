import { notFound, redirect } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { entries, entryThreads } from "@/lib/db/schema";
import FioMagazineRealClient, { type FioMoment } from "./FioMagazineRealClient";

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

function threadColor(id: string) {
  const sum = [...id].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return THREAD_COLORS[sum % THREAD_COLORS.length];
}

function buildQuestion(title: string) {
  return `O que este fio ainda está tentando te mostrar sobre ${title.toLowerCase()}?`;
}

function momentFromRow(row: MomentRow, index: number, color: string): FioMoment {
  const frontText = excerpt(row.transcript ?? row.reflection, index === 0 ? 220 : 155);
  const reflection = cleanText(row.reflection);
  return {
    id: row.id,
    day: formatDay(row.createdAt),
    time: formatTime(row.createdAt),
    title: titleFrom(row.transcript ?? row.reflection),
    said: frontText || "Registro sem texto visível.",
    reading: reflection || "Este momento ainda não tem uma leitura da Aurora disponível.",
    readingHead: reflection ? "A Aurora percebeu" : "Ainda sem devolutiva",
    mood: row.mood ?? undefined,
    moodColor: MOOD_COLOR[row.mood ?? ""] ?? "var(--mood-neutro)",
    duration: `${wordCount(row.transcript ?? row.reflection) || 1} palavras`,
    color,
    position: row.threadPosition ?? index + 1,
  };
}

export default async function FioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  const rows: MomentRow[] = await db
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

  if (rows.length === 0) {
    notFound();
  }

  const color = threadColor(thread.id);
  const title = thread.title ?? titleFrom(thread.summary ?? rows[0].transcript ?? rows[0].reflection);
  const moments = rows.map((row, index) => momentFromRow(row, index, color));
  const latestMoment = moments[moments.length - 1];

  return (
    <FioMagazineRealClient
      title={title}
      summary={excerpt(thread.summary, 180) || "Momentos que voltaram com formas diferentes."}
      question={buildQuestion(title)}
      color={color}
      moments={moments}
      continueHref={`/diario?continueEntryId=${latestMoment.id}`}
    />
  );
}
