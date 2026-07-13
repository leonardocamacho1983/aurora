import { and, desc, eq, isNotNull, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { entries, users } from "@/lib/db/schema";

const LOCALE = "pt-BR";
const TIME_ZONE = "America/Sao_Paulo";
const MOOD_COLORS: Record<string, string> = {
  leve: "var(--mood-leve)",
  calmo: "var(--mood-calmo)",
  pesado: "var(--mood-pesado)",
  sensivel: "var(--mood-sensivel)",
  ansioso: "var(--mood-ansioso)",
};

type EntryRow = {
  id: string;
  transcript: string | null;
  reflection: string | null;
  mood: string | null;
  entryMode: string;
  continuedFromEntryId: string | null;
  createdAt: Date;
};

export type PresenceDay = {
  key: string;
  spoke: boolean;
  today: boolean;
  label: string;
};

export type MoodPoint = {
  key: string;
  mood: string;
  label: string;
  moodLabel: string;
  color: string;
};

export type MoodPeriod = {
  points: MoodPoint[];
  caption: string;
};

export type ContinuedConversation = {
  id: string;
  title: string;
  meta: string;
  quote: string;
  continueHref: string;
  totalContinuedConversations: number;
};

export type ProfileDashboard = {
  account: {
    name: string | null;
    locale: string;
    plan: string;
    createdAt: Date | null;
  };
  entryCount: number;
  activeDays30: number;
  firstEntryAt: Date | null;
  lastEntryAt: Date | null;
  presenceDays: PresenceDay[];
  moodPeriods: {
    semana: MoodPeriod;
    mes: MoodPeriod;
    tudo: MoodPeriod;
  };
  latestContinuedConversation: ContinuedConversation | null;
};

function cleanText(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function excerpt(value: string | null | undefined, max = 190) {
  const text = cleanText(value);
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max).trim()}...` : text;
}

function titleFrom(value: string | null | undefined) {
  const text = cleanText(value);
  if (!text) return "Conversa do diário";
  const firstSentence = text.split(/[.!?]\s/u)[0] ?? text;
  return firstSentence.length > 54 ? `${firstSentence.slice(0, 54).trim()}...` : firstSentence;
}

function normalizeMood(mood: string | null | undefined) {
  const value = cleanText(mood).toLowerCase();
  if (!value) return null;
  if (value === "sensível") return "sensivel";
  if (MOOD_COLORS[value]) return value;
  return null;
}

function moodLabel(mood: string) {
  if (mood === "sensivel") return "Sensível";
  return mood.charAt(0).toUpperCase() + mood.slice(1);
}

function moodAdjective(mood: string) {
  if (mood === "calmo") return "calma";
  if (mood === "pesado") return "pesada";
  if (mood === "ansioso") return "ansiosa";
  if (mood === "sensivel") return "sensível";
  return "leve";
}

function dayKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: TIME_ZONE,
    year: "numeric",
  }).format(date);
}

function shortDayMonth(date: Date) {
  return new Intl.DateTimeFormat(LOCALE, {
    day: "2-digit",
    month: "short",
    timeZone: TIME_ZONE,
  }).format(date).replace(" de ", " ").replace(/\.$/, "");
}

function monthYear(date: Date) {
  return new Intl.DateTimeFormat(LOCALE, {
    month: "long",
    timeZone: TIME_ZONE,
    year: "numeric",
  }).format(date);
}

function monthShort(date: Date) {
  return new Intl.DateTimeFormat(LOCALE, {
    month: "short",
    timeZone: TIME_ZONE,
  }).format(date).replace(/\.$/, "");
}

function weekdayShort(date: Date) {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TIME_ZONE,
    weekday: "short",
  }).format(date).replace(/\.$/, "");
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function daysAgo(date: Date) {
  const diff = Math.round((startOfDay(new Date()).getTime() - startOfDay(date).getTime()) / 86_400_000);
  if (diff <= 0) return "hoje";
  if (diff === 1) return "ontem";
  return `há ${diff} dias`;
}

function monthsBetween(start: Date, end: Date) {
  const raw = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
  return Math.max(0, raw);
}

function buildPresenceDays(rows: EntryRow[]) {
  const today = startOfDay(new Date());
  const spokenDays = new Set(rows.map((row) => dayKey(row.createdAt)));
  const days: PresenceDay[] = [];

  for (let index = 29; index >= 0; index -= 1) {
    const date = addDays(today, -index);
    const key = dayKey(date);
    days.push({
      key,
      spoke: spokenDays.has(key),
      today: index === 0,
      label: shortDayMonth(date),
    });
  }

  return days;
}

function latestMoodByDay(rows: EntryRow[], start: Date, end: Date) {
  const byDay = new Map<string, EntryRow>();
  for (const row of rows) {
    if (row.createdAt < start || row.createdAt > end || !normalizeMood(row.mood)) continue;
    const key = dayKey(row.createdAt);
    const current = byDay.get(key);
    if (!current || row.createdAt > current.createdAt) byDay.set(key, row);
  }
  return [...byDay.values()].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

function moodPoint(row: EntryRow, label: string): MoodPoint | null {
  const mood = normalizeMood(row.mood);
  if (!mood) return null;
  return {
    key: row.id,
    mood,
    label,
    moodLabel: moodLabel(mood),
    color: MOOD_COLORS[mood],
  };
}

function captionFor(points: MoodPoint[], period: "semana" | "mes" | "tudo") {
  if (points.length === 0) {
    return "Quando houver humor suficiente, ele aparece aqui como sinal leve, não como nota.";
  }

  const counts = new Map<string, number>();
  for (const point of points) counts.set(point.mood, (counts.get(point.mood) ?? 0) + 1);
  const [dominant] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? ["calmo", 0];
  const adjective = moodAdjective(dominant);

  if (period === "semana") return `Uma semana mais ${adjective}. Nada para resolver — só notar.`;
  if (period === "mes") return `Um mês com mais presença ${adjective}. Um traço do que passou por aqui.`;
  return `Ao longo do tempo, os tons contam uma história sem transformar você em pontuação.`;
}

function buildMoodPeriods(rows: EntryRow[]) {
  const ascRows = [...rows].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const today = new Date();
  const weekStart = addDays(startOfDay(today), -6);
  const monthStart = addDays(startOfDay(today), -29);
  const weekRows = latestMoodByDay(ascRows, weekStart, today);
  const monthRows = latestMoodByDay(ascRows, monthStart, today).slice(-12);
  const allRows = ascRows.filter((row) => normalizeMood(row.mood)).slice(-12);

  const semanaPoints = weekRows
    .map((row) => moodPoint(row, weekdayShort(row.createdAt)))
    .filter(Boolean) as MoodPoint[];
  const mesPoints = monthRows
    .map((row) => moodPoint(row, new Intl.DateTimeFormat(LOCALE, { day: "numeric", timeZone: TIME_ZONE }).format(row.createdAt)))
    .filter(Boolean) as MoodPoint[];
  const tudoPoints = allRows
    .map((row) => moodPoint(row, monthShort(row.createdAt)))
    .filter(Boolean) as MoodPoint[];

  return {
    semana: {
      points: semanaPoints,
      caption: captionFor(semanaPoints, "semana"),
    },
    mes: {
      points: mesPoints,
      caption: captionFor(mesPoints, "mes"),
    },
    tudo: {
      points: tudoPoints,
      caption: captionFor(tudoPoints, "tudo"),
    },
  };
}

function buildLatestContinuedConversation(rows: EntryRow[]): ContinuedConversation | null {
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

  function collect(root: EntryRow) {
    const chain: EntryRow[] = [];
    const seen = new Set<string>();
    function walk(row: EntryRow) {
      if (seen.has(row.id)) return;
      seen.add(row.id);
      chain.push(row);
      for (const child of childrenByParent.get(row.id) ?? []) walk(child);
    }
    walk(root);
    return chain;
  }

  const roots = new Map<string, EntryRow>();
  for (const row of rows) roots.set(rootFor(row).id, rootFor(row));

  const conversations = [...roots.values()]
    .map((root) => collect(root))
    .filter((chain) => chain.length > 1)
    .sort((a, b) => b[b.length - 1].createdAt.getTime() - a[a.length - 1].createdAt.getTime());

  const latestChain = conversations[0];
  if (!latestChain) return null;

  const root = latestChain[0];
  const latest = latestChain[latestChain.length - 1];
  const quote = excerpt(latest.reflection || root.reflection || latest.transcript || root.transcript);

  return {
    id: root.id,
    title: titleFrom(root.transcript || root.reflection),
    meta: `${latestChain.length} ${latestChain.length === 1 ? "momento" : "momentos"} · última ${daysAgo(latest.createdAt)}`,
    quote: quote ? `“${quote}”` : "“Quando quiser, a Aurora retoma de onde vocês pararam.”",
    continueHref: `/diario?continueEntryId=${latest.id}&source=account_profile`,
    totalContinuedConversations: conversations.length,
  };
}

export function profileSinceLine(input: {
  createdAt: Date | null;
  firstEntryAt: Date | null;
  entryCount: number;
}) {
  const start = input.firstEntryAt ?? input.createdAt;
  if (!start) return "Seu espaço na Aurora";
  const months = monthsBetween(start, new Date());
  const monthCopy = months <= 0 ? "primeiro mês de conversas" : `${months} ${months === 1 ? "mês" : "meses"} de conversas`;
  if (input.entryCount <= 0) return `Com a Aurora desde ${monthYear(start)}`;
  return `Com a Aurora desde ${monthYear(start)} · ${monthCopy}`;
}

export async function getProfileDashboard(userId: string): Promise<ProfileDashboard> {
  const [accountRow] = await db
    .select({
      name: users.name,
      locale: users.locale,
      plan: users.plan,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

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
        eq(entries.userId, userId),
        or(isNotNull(entries.transcript), isNotNull(entries.reflection)),
      ),
    )
    .orderBy(desc(entries.createdAt))
    .limit(500);

  const chronologicalRows = [...rows].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const firstEntryAt = chronologicalRows[0]?.createdAt ?? null;
  const lastEntryAt = rows[0]?.createdAt ?? null;
  const presenceDays = buildPresenceDays(rows);

  return {
    account: {
      name: accountRow?.name ?? null,
      locale: accountRow?.locale ?? "pt-BR",
      plan: accountRow?.plan ?? "free",
      createdAt: accountRow?.createdAt ?? null,
    },
    entryCount: rows.length,
    activeDays30: presenceDays.filter((day) => day.spoke).length,
    firstEntryAt,
    lastEntryAt,
    presenceDays,
    moodPeriods: buildMoodPeriods(rows),
    latestContinuedConversation: buildLatestContinuedConversation(chronologicalRows),
  };
}
