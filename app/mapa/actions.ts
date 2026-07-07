"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { recordProductEvent } from "@/lib/analytics/product-events";
import {
  hideEntryFocusByEntryIdForUser,
  reopenFocusForUser,
  resolveFocusForUser,
} from "@/lib/mapa/focus-visibility";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type HideEntryFocusInput = {
  entryId: string;
  focusKey: string;
};

type FocusStateInput = {
  focusKey: string;
};

function cleanActionInput(input: HideEntryFocusInput | FocusStateInput) {
  return {
    entryId: "entryId" in input ? input.entryId.trim().slice(0, 80) : "",
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

export async function resolveFocus(input: FocusStateInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { focusKey } = cleanActionInput(input);
  const result = await resolveFocusForUser({
    userId: user.id,
    focusKey,
  });

  if (result.status === "resolved") {
    await recordProductEvent({
      userId: user.id,
      eventName: "product_focus_resolved",
      source: "mapa",
      metadata: {
        status: "resolved",
        focus_key: result.focusKey,
        entry_count: result.entryCount,
      },
    });
  }

  revalidatePath("/mapa");
  if (result.focusKey) revalidatePath(`/mapa/${result.focusKey}`);
  revalidatePath("/timeline");
  redirect(result.focusKey ? `/mapa/${result.focusKey}?encerrado=1` : "/mapa");
}

export async function reopenFocus(input: FocusStateInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { focusKey } = cleanActionInput(input);
  const result = await reopenFocusForUser({
    userId: user.id,
    focusKey,
  });

  if (result.status === "reopened") {
    await recordProductEvent({
      userId: user.id,
      eventName: "product_focus_reopened",
      source: "mapa",
      metadata: {
        status: "reopened",
        focus_key: result.focusKey,
        entry_count: result.entryCount,
      },
    });
  }

  revalidatePath("/mapa");
  if (result.focusKey) revalidatePath(`/mapa/${result.focusKey}`);
  revalidatePath("/timeline");
  redirect(result.focusKey ? `/mapa/${result.focusKey}?reaberto=1` : "/mapa");
}
