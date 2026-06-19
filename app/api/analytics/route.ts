import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { waitlistEvents } from "@/lib/db/schema";
import { sanitizeAnalyticsProperties } from "@/lib/analytics/attribution";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_EVENTS = new Set([
  "landing_viewed",
  "teaser_started",
  "teaser_auto_started",
  "teaser_skipped",
  "teaser_replayed",
  "teaser_completed",
  "teaser_sound_toggled",
  "launch_page_viewed",
  "waitlist_submit_attempt",
  "waitlist_submit_success",
  "waitlist_submit_error",
  "invite_copied",
  "invite_shared",
  "invite_whatsapp_clicked",
  "arrival_ritual_step_completed",
  "arrival_ritual_completed",
  "launch_cta_clicked",
  "referral_room_viewed",
  "referral_home_return_clicked",
]);

const ALLOWED_PROPERTY_KEYS = new Set([
  "page",
  "category",
  "source",
  "has_referral",
  "referral_code",
  "mode",
  "step",
  "field",
  "confirmed",
  "confirmed_count",
  "path",
  "search",
  "referrer",
  "viewport",
  "label",
  "sound_on",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "source_type",
  "language",
  "timezone",
  "is_mobile",
]);

type AnalyticsBody = {
  eventName?: unknown;
  distinctId?: unknown;
  properties?: unknown;
};

function posthogHost() {
  return (
    process.env.NEXT_PUBLIC_POSTHOG_HOST?.replace(/\/$/, "") ||
    process.env.POSTHOG_HOST?.replace(/\/$/, "") ||
    "https://us.i.posthog.com"
  );
}

function posthogToken() {
  return (
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ||
    process.env.NEXT_PUBLIC_POSTHOG_KEY ||
    process.env.POSTHOG_PROJECT_TOKEN ||
    ""
  );
}

export async function POST(request: Request) {
  let body: AnalyticsBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: "ignored" });
  }

  const eventName = typeof body.eventName === "string" ? body.eventName : "";
  const distinctId = typeof body.distinctId === "string" ? body.distinctId : "anonymous";
  if (!ALLOWED_EVENTS.has(eventName)) {
    return NextResponse.json({ status: "ignored" });
  }

  const properties = sanitizeAnalyticsProperties(body.properties, ALLOWED_PROPERTY_KEYS);

  try {
    await db.insert(waitlistEvents).values({
      eventName,
      source:
        typeof properties.source === "string"
          ? properties.source
          : typeof properties.source_type === "string"
            ? properties.source_type
            : "client_analytics",
      metadata: {
        ...properties,
        distinctId: distinctId.slice(0, 80),
      },
    });
  } catch (error) {
    console.error("/api/analytics db error:", error);
  }

  const token = posthogToken();
  if (!token) {
    return NextResponse.json({ status: "skipped" });
  }

  try {
    await fetch(`${posthogHost()}/capture/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        api_key: token,
        event: eventName,
        distinct_id: distinctId,
        properties: {
          ...properties,
          app: "aurora",
        },
      }),
    });
  } catch (error) {
    console.error("/api/analytics error:", error);
  }

  return NextResponse.json({ status: "ok" });
}
