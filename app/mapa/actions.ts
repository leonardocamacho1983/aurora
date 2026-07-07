"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { recordProductEvent } from "@/lib/analytics/product-events";
import {
  hideEntryFocusByEntryIdForUser,
  reopenEntryFocusByEntryIdForUser,
  resolveEntryFocusByEntryIdForUser,
} from "@/lib/mapa/focus-visibility";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type HideEntryFocusInput = {
  entryId: string;
  focusKey: string;
};

function cleanActionInput(input: HideEntryFocusInput) {
  return {
    entryId: input.entryId.trim().slice(0, 80),
    focusKey: input.focusKey.trim().slice(0, 80),
  };
}

export async function hideEntryFocus(input: HideEntryFocusInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { entryId, focusKey } = cleanActionInput(input);

  if (!UUID_RE.test(entryId)) {
    redirect("/mapa");
  }

  const result = await hideEntryFocusByEntryIdForUser({
    userId: user.id,
    entryId,
  });

  if (result.status === "hidden") {
    await recordProductEvent({
      userId: user.id,
      eventName: "product_focus_hidden",
      source: "mapa",
      metadata: {
        status: "hidden",
        focus_key: result.focusKey,
        focus_confidence: result.focusConfidence,
      },
    });
  }

  revalidatePath("/mapa");
  if (result.focusKey) revalidatePath(`/mapa/${result.focusKey}`);
  revalidatePath("/timeline");
  redirect(result.focusKey ? `/mapa/${result.focusKey}?ajustado=1` : `/mapa/${focusKey}`);
}

export async function resolveEntryFocus(input: HideEntryFocusInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { entryId, focusKey } = cleanActionInput(input);

  if (!UUID_RE.test(entryId)) {
    redirect("/mapa");
  }

  const result = await resolveEntryFocusByEntryIdForUser({
    userId: user.id,
    entryId,
  });

  if (result.status === "resolved") {
    await recordProductEvent({
      userId: user.id,
      eventName: "product_focus_point_resolved",
      source: "mapa",
      metadata: {
        status: "resolved",
        focus_key: result.focusKey,
        focus_confidence: result.focusConfidence,
        entry_count: result.entryCount,
      },
    });
  }

  revalidatePath("/mapa");
  if (result.focusKey) revalidatePath(`/mapa/${result.focusKey}`);
  revalidatePath(`/fios/${entryId}`);
  revalidatePath("/timeline");
  redirect(result.focusKey ? `/mapa/${result.focusKey}?pontoResolvido=1` : `/mapa/${focusKey}`);
}

export async function reopenEntryFocus(input: HideEntryFocusInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { entryId, focusKey } = cleanActionInput(input);

  if (!UUID_RE.test(entryId)) {
    redirect("/mapa");
  }

  const result = await reopenEntryFocusByEntryIdForUser({
    userId: user.id,
    entryId,
  });

  if (result.status === "reopened") {
    await recordProductEvent({
      userId: user.id,
      eventName: "product_focus_point_reopened",
      source: "mapa",
      metadata: {
        status: "reopened",
        focus_key: result.focusKey,
        focus_confidence: result.focusConfidence,
        entry_count: result.entryCount,
      },
    });
  }

  revalidatePath("/mapa");
  if (result.focusKey) revalidatePath(`/mapa/${result.focusKey}`);
  revalidatePath(`/fios/${entryId}`);
  revalidatePath("/timeline");
  redirect(result.focusKey ? `/mapa/${result.focusKey}?pontoReaberto=1` : `/mapa/${focusKey}`);
}
