import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recordProductEvent } from "@/lib/analytics/product-events";
import { hideEntryFocusByEntryIdForUser } from "@/lib/mapa/focus-visibility";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function requestSurface(request: Request) {
  try {
    const body = (await request.json()) as { surface?: unknown };
    return typeof body.surface === "string" ? body.surface.trim().slice(0, 80) : "entry_focus";
  } catch {
    return "entry_focus";
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "invalid entry id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const surface = await requestSurface(request);
  const result = await hideEntryFocusByEntryIdForUser({
    userId: user.id,
    entryId: id,
  });

  if (result.status === "not_hidden") {
    return NextResponse.json({ error: "focus not found" }, { status: 404 });
  }

  if (result.status === "hidden") {
    await recordProductEvent({
      userId: user.id,
      eventName: "product_focus_hidden",
      source: "entry_focus_api",
      metadata: {
        status: "hidden",
        focus_key: result.focusKey,
        focus_confidence: result.focusConfidence,
        surface,
      },
    });
  }

  revalidatePath("/mapa");
  revalidatePath(`/mapa/${result.focusKey}`);
  revalidatePath(`/fios/${id}`);
  revalidatePath("/timeline");

  return NextResponse.json({
    status: result.status,
    entryId: id,
    focusKey: result.focusKey,
  });
}
