import { redirect } from "next/navigation";
import { and, desc, eq, isNotNull, or } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { entries } from "@/lib/db/schema";
import TimelineMagazineClient, {
  type MagazineDayGroup,
  type MagazinePiece,
  type MagazineThread,
} from "./TimelineMagazineClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EntryRow = {
  id: string;
  transcript: string | null;
  reflection: string | null;
  mood: string | null;
  entryMode: string;
  continuedFromEntryId: string | null;
  createdAt: Date;
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

function excerpt(value: string | null | undefined, max = 176) {
  const text = cleanText(value);
  return text.length > max ? `${text.slice(0, max).trim()}...` : text;
}

function titleFrom(text: string | null | undefined) {
  const clean = cleanText(text);
  if (!clean) return "Registro do diário";
  const firstSentence = clean.split(/[.!?]\s/u)[0] ?? clean;
  return firstSentence.length > 58 ? `${firstSentence.slice(0, 58).trim()}...` : firstSentence;
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

function threadColor(id: string) {
  const sum = [...id].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return THREAD_COLORS[sum % THREAD_COLORS.length];
}

function buildThreadIndex(rows: EntryRow[]) {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const childrenByParent = new Map<string, EntryRow[]>();

  for (const row of rows) {
    if (!row.continuedFromEntryId) continue;
    const children = childrenByParent.get(row.continuedFromEntryId) ?? [];
    children.push(row);
    childrenByParent.set(row.continuedFromEntryId, children);
  }

  for (const children of childrenByParent.values()) {
    children.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  function rootFor(row: EntryRow) {
    const seen = new Set<string>([row.id]);
    let current = row;

    while (current.continuedFromEntryId) {
      const parent = byId.get(current.continuedFromEntryId);
      if (!parent || seen.has(parent.id)) break;
      seen.add(parent.id);
      current = parent;
    }

    return current;
  }

  function collectFrom(root: EntryRow) {
    const chain: EntryRow[] = [];
    const seen = new Set<string>();

    function walk(row: EntryRow) {
      if (seen.has(row.id)) return;
      seen.add(row.id);
      chain.push(row);
      for (const child of childrenByParent.get(row.id) ?? []) {
        walk(child);
      }
    }

    walk(root);
    return chain;
  }

  return new Map(
    rows.map((row) => {
      const root = rootFor(row);
      const chain = collectFrom(root);
      const title = titleFrom(root.transcript ?? root.reflection);
      const thread: MagazineThread = {
        id: root.id,
        title,
        color: threadColor(root.id),
        href: `/fios/${row.id}`,
        desc:
          chain.length > 1
            ? `Uma sequência de ${chain.length} registros ligados.`
            : "Um registro que pode continuar sem recontar tudo.",
        momentCount: chain.length,
      };

      return [row.id, thread] as const;
    }),
  );
}

function pieceFromRow(
  row: EntryRow,
  indexInDay: number,
  threads: Map<string, MagazineThread>,
): MagazinePiece {
  const thread = threads.get(row.id) ?? null;
  const frontText = excerpt(row.transcript ?? row.reflection, indexInDay === 0 ? 220 : 150);
  const reflection = cleanText(row.reflection);
  const hasReflection = Boolean(reflection);

  return {
    id: row.id,
    kind: indexInDay === 0 ? "feature" : "note",
    time: formatTime(row.createdAt),
    href: `/fios/${row.id}`,
    continueHref: `/diario?continueEntryId=${row.id}&source=timeline`,
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
          body: "Este momento está guardado, mas ainda não tem uma leitura da Aurora para virar card.",
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

export default async function TimelinePage() {
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
      entryMode: entries.entryMode,
      continuedFromEntryId: entries.continuedFromEntryId,
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

  const threads = buildThreadIndex(rows);

  return (
    <TimelineMagazineClient
      groups={buildGroups(rows, threads)}
      totalCount={rows.length}
      generatedAtLabel={todayLabel()}
    />
  );
}
