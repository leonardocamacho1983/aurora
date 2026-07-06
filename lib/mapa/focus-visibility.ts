import { and, eq, isNull } from "drizzle-orm";
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
