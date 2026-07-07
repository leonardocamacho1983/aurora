import { and, eq, isNotNull, isNull, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { entries } from "@/lib/db/schema";
import { getFocusDefinition, type FocusKey } from "./focus";

export type HideEntryFocusResult =
  | {
      status: "hidden";
      focusKey: FocusKey;
      focusConfidence: string | null;
    }
  | {
      status: "already_hidden";
      focusKey: FocusKey;
      focusConfidence: string | null;
    }
  | {
      status: "not_hidden";
      focusKey: FocusKey | null;
      focusConfidence: null;
    };

export type ResolveFocusResult =
  | {
      status: "resolved";
      focusKey: FocusKey;
      focusConfidence: string | null;
      entryCount: number;
    }
  | {
      status: "already_resolved";
      focusKey: FocusKey;
      focusConfidence: string | null;
      entryCount: number;
    }
  | {
      status: "not_resolved";
      focusKey: FocusKey | null;
      entryCount: 0;
    };

export type ReopenFocusResult =
  | {
      status: "reopened";
      focusKey: FocusKey;
      focusConfidence: string | null;
      entryCount: number;
    }
  | {
      status: "not_reopened";
      focusKey: FocusKey | null;
      entryCount: 0;
    };

export async function hideEntryFocusByEntryIdForUser({
  userId,
  entryId,
  hiddenAt = new Date(),
}: {
  userId: string;
  entryId: string;
  hiddenAt?: Date;
}): Promise<HideEntryFocusResult> {
  const [entry] = await db
    .select({
      focusKey: entries.focusKey,
      focusConfidence: entries.focusConfidence,
      focusHiddenAt: entries.focusHiddenAt,
    })
    .from(entries)
    .where(and(eq(entries.id, entryId), eq(entries.userId, userId)))
    .limit(1);

  const focus = getFocusDefinition(entry?.focusKey ?? "");
  if (!entry || !focus) {
    return {
      status: "not_hidden",
      focusKey: null,
      focusConfidence: null,
    };
  }

  if (entry.focusHiddenAt) {
    return {
      status: "already_hidden",
      focusKey: focus.key,
      focusConfidence: entry.focusConfidence,
    };
  }

  const [updated] = await db
    .update(entries)
    .set({ focusHiddenAt: hiddenAt })
    .where(and(eq(entries.id, entryId), eq(entries.userId, userId), isNull(entries.focusHiddenAt)))
    .returning({
      focusConfidence: entries.focusConfidence,
    });

  if (!updated) {
    return {
      status: "not_hidden",
      focusKey: focus.key,
      focusConfidence: null,
    };
  }

  return {
    status: "hidden",
    focusKey: focus.key,
    focusConfidence: updated.focusConfidence,
  };
}

export async function resolveEntryFocusByEntryIdForUser({
  userId,
  entryId,
  resolvedAt = new Date(),
}: {
  userId: string;
  entryId: string;
  resolvedAt?: Date;
}): Promise<ResolveFocusResult> {
  const [entry] = await db
    .select({
      focusKey: entries.focusKey,
      focusConfidence: entries.focusConfidence,
      focusResolvedAt: entries.focusResolvedAt,
      focusHiddenAt: entries.focusHiddenAt,
    })
    .from(entries)
    .where(and(eq(entries.id, entryId), eq(entries.userId, userId)))
    .limit(1);

  const focus = getFocusDefinition(entry?.focusKey ?? "");
  if (
    !entry ||
    !focus ||
    entry.focusHiddenAt ||
    (entry.focusConfidence !== "high" && entry.focusConfidence !== "medium")
  ) {
    return {
      status: "not_resolved",
      focusKey: focus?.key ?? null,
      entryCount: 0,
    };
  }

  if (entry.focusResolvedAt) {
    return {
      status: "already_resolved",
      focusKey: focus.key,
      focusConfidence: entry.focusConfidence,
      entryCount: 1,
    };
  }

  const [updated] = await db
    .update(entries)
    .set({ focusResolvedAt: resolvedAt })
    .where(
      and(
        eq(entries.id, entryId),
        eq(entries.userId, userId),
        isNull(entries.focusHiddenAt),
        isNull(entries.focusResolvedAt),
        or(eq(entries.focusConfidence, "high"), eq(entries.focusConfidence, "medium")),
      ),
    )
    .returning({ id: entries.id });

  if (!updated) {
    return {
      status: "not_resolved",
      focusKey: focus.key,
      entryCount: 0,
    };
  }

  return {
    status: "resolved",
    focusKey: focus.key,
    focusConfidence: entry.focusConfidence,
    entryCount: 1,
  };
}

export async function reopenEntryFocusByEntryIdForUser({
  userId,
  entryId,
}: {
  userId: string;
  entryId: string;
}): Promise<ReopenFocusResult> {
  const [entry] = await db
    .select({
      focusKey: entries.focusKey,
      focusConfidence: entries.focusConfidence,
      focusHiddenAt: entries.focusHiddenAt,
      focusResolvedAt: entries.focusResolvedAt,
    })
    .from(entries)
    .where(and(eq(entries.id, entryId), eq(entries.userId, userId)))
    .limit(1);

  const focus = getFocusDefinition(entry?.focusKey ?? "");
  if (
    !entry ||
    !focus ||
    entry.focusHiddenAt ||
    !entry.focusResolvedAt ||
    (entry.focusConfidence !== "high" && entry.focusConfidence !== "medium")
  ) {
    return {
      status: "not_reopened",
      focusKey: focus?.key ?? null,
      entryCount: 0,
    };
  }

  const [updated] = await db
    .update(entries)
    .set({ focusResolvedAt: null })
    .where(
      and(
        eq(entries.id, entryId),
        eq(entries.userId, userId),
        eq(entries.focusKey, focus.key),
        isNull(entries.focusHiddenAt),
        isNotNull(entries.focusResolvedAt),
        or(eq(entries.focusConfidence, "high"), eq(entries.focusConfidence, "medium")),
      ),
    )
    .returning({ focusConfidence: entries.focusConfidence });

  if (!updated) {
    return {
      status: "not_reopened",
      focusKey: focus.key,
      entryCount: 0,
    };
  }

  return {
    status: "reopened",
    focusKey: focus.key,
    focusConfidence: updated.focusConfidence,
    entryCount: 1,
  };
}

export async function hideEntryFocusForUser({
  userId,
  entryId,
  focusKey,
  hiddenAt = new Date(),
}: {
  userId: string;
  entryId: string;
  focusKey: string;
  hiddenAt?: Date;
}): Promise<HideEntryFocusResult> {
  const focus = getFocusDefinition(focusKey);
  if (!focus) {
    return {
      status: "not_hidden",
      focusKey: null,
      focusConfidence: null,
    };
  }

  const [updated] = await db
    .update(entries)
    .set({ focusHiddenAt: hiddenAt })
    .where(
      and(
        eq(entries.id, entryId),
        eq(entries.userId, userId),
        eq(entries.focusKey, focus.key),
        isNull(entries.focusHiddenAt),
      ),
    )
    .returning({
      focusConfidence: entries.focusConfidence,
    });

  if (!updated) {
    return {
      status: "not_hidden",
      focusKey: focus.key,
      focusConfidence: null,
    };
  }

  return {
    status: "hidden",
    focusKey: focus.key,
    focusConfidence: updated.focusConfidence,
  };
}
