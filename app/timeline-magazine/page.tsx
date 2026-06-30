import { redirect } from "next/navigation";
import { and, desc, eq, isNotNull, or, sql } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { entries, entryThreads } from "@/lib/db/schema";
import TimelineMagazineRealClient, {
  type MagazineDayGroup,
  type MagazinePiece,
  type MagazineThread,
} from "./TimelineMagazineRealClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EntryRow = {
  id: string;
  transcript: string | null;
  reflection: string | null;
  mood: string | null;
  threadId: string | null;
  entryMode: string;
  createdAt: Date;
};

type ThreadRow = {
  id: string;
  title: string | null;
  summary: string | null;
  updatedAt: Date;
  momentCount: number;
};

const MOOD_COLOR: Record<string, string> = {
  leve: "var(--mood-leve)",
  calmo: "var(--mood-calmo)",
  pesado: "var(--mood-pesado)",
  sensivel: "var(--mood-sensivel)",
  sensível: "var(--mood-sensivel)",
  ansioso: "var(--mood-ansioso)",
};

function cleanText(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function excerpt(value: string | null | undefined, max = 176) {
  const text = cleanText(value);
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

function titleFrom(text: string | null | undefined) {
  const clean = cleanText(text);
  if (!clean) return "Registro do diário";
  const firstSentence = clean.split(/[.!?]\s/)[0] ?? clean;
  return firstSentence.length > 58 ? `${firstSentence.slice(0, 58).trim()}…` : firstSentence;
}

function dayLabel(date: Date) {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const then = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.round((start.getTime() - then.getTime()) / 86_400_000);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Ontem";
  const label = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "short",
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function groupId(date: Date) {
  return new Intl.DateTimeFormat("en-CA").format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(date);
}

function durationFrom(row: EntryRow) {
  const words = cleanText(row.transcript ?? row.reflection).split(/\s+/).filter(Boolean).length;
  if (!words) return "registro";
  return `${words} ${words === 1 ? "palavra" : "palavras"}`;
}

function threadFallback(row: EntryRow, threads: Map<string, MagazineThread>): MagazineThread | null {
  if (!row.threadId) return null;
  return (
    threads.get(row.threadId) ?? {
      id: row.threadId,
      title: "Fio do diário",
      color: "var(--accent)",
      href: `/fios/${row.threadId}`,
      desc: "Um tema que voltou em mais de um momento.",
      momentCount: 1,
    }
  );
}

function pieceFromRow(row: EntryRow, indexInDay: number, threads: Map<string, MagazineThread>): MagazinePiece {
  const thread = threadFallback(row, threads);
  const frontText = excerpt(row.transcript ?? row.reflection, indexInDay === 0 ? 220 : 150);
  const reflection = cleanText(row.reflection);
  const hasReflection = Boolean(reflection);

  return {
    id: row.id,
    kind: indexInDay === 0 ? "feature" : "note",
    time: formatTime(row.createdAt),
    href: thread?.href ?? `/diario?continueEntryId=${row.id}`,
    thread,
    mood: row.mood ?? undefined,
    moodColor: MOOD_COLOR[row.mood ?? ""] ?? "var(--mood-neutro)",
    duration: durationFrom(row),
    title: titleFrom(row.transcript ?? row.reflection),
    said: frontText || "Registro sem texto visível.",
    excerpt: frontText || "Registro sem texto visível.",
    reading: hasReflection
      ? {
          head: "A Aurora percebeu",
          body: reflection,
        }
      : {
          head: "Ainda sem devolutiva",
          body: "Este momento está guardado, mas ainda não tem uma leitura da Aurora para virar o card.",
        },
  };
}

function buildGroups(rows: EntryRow[], threads: Map<string, MagazineThread>): MagazineDayGroup[] {
  const groups = new Map<string, { date: Date; pieces: MagazinePiece[] }>();

  for (const row of rows) {
    const key = groupId(row.createdAt);
    const current = groups.get(key) ?? { date: row.createdAt, pieces: [] };
    current.pieces.push(pieceFromRow(row, current.pieces.length, threads));
    groups.set(key, current);
  }

  return [...groups.entries()].map(([id, group]) => ({
    id,
    day: dayLabel(group.date),
    dek:
      group.pieces.length > 1
        ? "Alguns momentos ficaram próximos o bastante para formar uma página."
        : "Um momento guardado sem precisar virar relatório.",
    pieces: group.pieces,
  }));
}

function todayLabel() {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date());
}

export default async function TimelineMagazinePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const rows: EntryRow[] = await db
    .select({
      id: entries.id,
      transcript: entries.transcript,
      reflection: entries.reflection,
      mood: entries.mood,
      threadId: entries.threadId,
      entryMode: entries.entryMode,
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
    .limit(80);

  const threadRows = (await db
    .select({
      id: entryThreads.id,
      title: entryThreads.title,
      summary: entryThreads.summary,
      updatedAt: entryThreads.updatedAt,
      momentCount: sql<number>`count(${entries.id})::int`,
    })
    .from(entryThreads)
    .leftJoin(entries, and(eq(entries.threadId, entryThreads.id), eq(entries.userId, user.id)))
    .where(eq(entryThreads.userId, user.id))
    .groupBy(entryThreads.id)
    .orderBy(desc(entryThreads.updatedAt))
    .limit(30)) as ThreadRow[];

  const threadColors = [
    "var(--aurora-pink)",
    "var(--aurora-blue)",
    "var(--aurora-mint)",
    "var(--aurora-warm)",
    "var(--accent-soft)",
  ];

  const threads = new Map<string, MagazineThread>(
    threadRows.map((thread, index) => [
      thread.id,
      {
        id: thread.id,
        title: thread.title ?? titleFrom(thread.summary),
        color: threadColors[index % threadColors.length],
        href: `/fios/${thread.id}`,
        desc: excerpt(thread.summary, 110) || "Um tema que voltou em mais de um momento.",
        momentCount: thread.momentCount,
      },
    ]),
  );

  return (
    <TimelineMagazineRealClient
      groups={buildGroups(rows, threads)}
      totalCount={rows.length}
      generatedAtLabel={todayLabel()}
      firstName={(user.user_metadata?.name as string | undefined)?.split(" ")[0] ?? user.email?.split("@")[0] ?? "você"}
    />
  );
}
