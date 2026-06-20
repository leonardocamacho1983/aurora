import { Resend, type WebhookEventPayload } from "resend";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { waitlist, waitlistEvents } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TRACKED_EMAIL_EVENTS = new Set([
  "email.delivered",
  "email.opened",
  "email.clicked",
  "email.bounced",
  "email.complained",
  "email.delivery_delayed",
  "email.failed",
  "email.suppressed",
]);

function rows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === "object" && "rows" in result) {
    return (result as { rows?: T[] }).rows ?? [];
  }
  return [];
}

function headersForVerification(request: Request) {
  return {
    id: request.headers.get("svix-id") ?? "",
    timestamp: request.headers.get("svix-timestamp") ?? "",
    signature: request.headers.get("svix-signature") ?? "",
  };
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function firstRecipient(event: WebhookEventPayload) {
  const to = "to" in event.data && Array.isArray(event.data.to) ? event.data.to : [];
  return normalizeEmail(to[0]);
}

function eventMetadata(event: WebhookEventPayload) {
  const data = event.data as unknown as Record<string, unknown>;
  const metadata: Record<string, string | number | boolean | null> = {
    provider: "resend",
    provider_event_type: event.type,
    provider_email_id: typeof data.email_id === "string" ? data.email_id.slice(0, 120) : null,
    provider_created_at: typeof data.created_at === "string" ? data.created_at : event.created_at,
  };

  if (event.type === "email.bounced" && "bounce" in event.data) {
    metadata.bounce_type = event.data.bounce.type.slice(0, 80);
    metadata.bounce_subtype = event.data.bounce.subType.slice(0, 80);
    metadata.has_bounce_message = Boolean(event.data.bounce.message);
  }

  if (event.type === "email.clicked" && "click" in event.data) {
    try {
      const url = new URL(event.data.click.link);
      metadata.link_host = url.hostname.slice(0, 120);
    } catch {
      metadata.link_host = null;
    }
  }

  if (event.type === "email.failed" && "failed" in event.data) {
    metadata.has_failure_reason = Boolean(event.data.failed.reason);
  }

  if (event.type === "email.suppressed" && "suppressed" in event.data) {
    metadata.suppressed_type = event.data.suppressed.type.slice(0, 80);
    metadata.has_suppressed_message = Boolean(event.data.suppressed.message);
  }

  return metadata;
}

async function waitlistIdForRecipient(email: string) {
  if (!email) return null;
  const rows = await db
    .select({ id: waitlist.id })
    .from(waitlist)
    .where(eq(waitlist.email, email))
    .limit(1);
  return rows[0]?.id ?? null;
}

async function alreadyRecorded(eventName: string, providerEmailId: string | null) {
  if (!providerEmailId) return false;
  const result = await db.execute(sql`
    select 1
    from waitlist_events
    where event_name = ${eventName}
      and metadata->>'provider_email_id' = ${providerEmailId}
    limit 1
  `);
  return rows<{ "?column?": number }>(result).length > 0;
}

export async function POST(request: Request) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    return NextResponse.json({ error: "webhook not configured" }, { status: 503 });
  }

  const payload = await request.text();
  let event: WebhookEventPayload;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY || "re_webhook_verify_only");
    event = resend.webhooks.verify({
      payload,
      headers: headersForVerification(request),
      webhookSecret,
    });
  } catch {
    return NextResponse.json({ error: "invalid webhook" }, { status: 400 });
  }

  if (!TRACKED_EMAIL_EVENTS.has(event.type)) {
    return NextResponse.json({ status: "ignored" });
  }

  const metadata = eventMetadata(event);
  const providerEmailId = typeof metadata.provider_email_id === "string" ? metadata.provider_email_id : null;
  const eventName = event.type.replace(".", "_");
  if (await alreadyRecorded(eventName, providerEmailId)) {
    return NextResponse.json({ status: "duplicate" });
  }

  await db.insert(waitlistEvents).values({
    waitlistId: await waitlistIdForRecipient(firstRecipient(event)),
    eventName,
    source: "resend_webhook",
    metadata,
  });

  return NextResponse.json({ status: "ok" });
}
