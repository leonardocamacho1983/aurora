import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { waitlistEvents } from "@/lib/db/schema";
import { sanitizeAnalyticsProperties } from "@/lib/analytics/attribution";
import { recordProductEvent } from "@/lib/analytics/product-events";
import { createClient } from "@/lib/supabase/server";

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
  "waitlist_inbox_clicked",
  "waitlist_status_link_clicked",
  "waitlist_resend_clicked",
  "invite_copied",
  "invite_shared",
  "invite_whatsapp_clicked",
  "arrival_ritual_step_completed",
  "arrival_ritual_completed",
  "launch_cta_clicked",
  "referral_room_viewed",
  "referral_home_return_clicked",
  "product_onboarding_viewed",
  "product_onboarding_step_viewed",
  "product_onboarding_answered",
  "product_onboarding_completed",
  "product_onboarding_skipped",
  "product_diary_viewed",
  "product_diary_recording_started",
  "product_diary_recording_stopped",
  "product_transcription_attempted",
  "product_transcription_succeeded",
  "product_transcription_succeeded_after_retry",
  "product_transcription_failed",
  "product_transcription_api_failed",
  "product_transcription_client_network_failed",
  "product_transcription_text_fallback_shown",
  "product_transcription_text_fallback_submitted",
  "product_reflection_attempted",
  "product_reflection_succeeded",
  "product_reflection_fallback_saved",
  "product_reflection_failed",
  "product_reflection_received",
  "product_crisis_resources_shown",
]);

const ALLOWED_PROPERTY_KEYS = new Set([
  "page",
  "category",
  "source",
  "has_referral",
  "referral_code",
  "mode",
  "provider",
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
  "variant",
  "first_value_goal",
  "preparation_steps",
  "completion",
  "completed_fields",
  "field_count",
  "fields",
  "alpha_ready",
  "has_onboarding_moment",
  "has_onboarding_presence",
  "entry_mode",
  "device_family",
  "audio_mime_type",
  "audio_size_bucket",
  "recorder_mime_type",
  "status",
  "duration_bucket",
  "error_class",
  "error_code",
  "retryable",
  "provider",
  "model",
  "request_id",
  "attempt",
  "latency_bucket",
  "transcript_length_bucket",
  "fallback_saved",
  "fallback_type",
  "failure_stage",
  "risk_level",
  "has_mood",
  "reflection_type",
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
  const source =
    typeof properties.source === "string"
      ? properties.source
      : typeof properties.source_type === "string"
        ? properties.source_type
        : "client_analytics";

  const isProductEvent = eventName.startsWith("product_");
  let storedProductEvent = false;
  if (isProductEvent) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      storedProductEvent = await recordProductEvent({
        userId: user?.id,
        eventName,
        source,
        metadata: properties,
        capturePostHog: false,
      });
    } catch (error) {
      console.error("/api/analytics product event error:", error);
    }
  }

  if (isProductEvent && !storedProductEvent) {
    return NextResponse.json({ status: "skipped" });
  }

  if (!storedProductEvent) {
    try {
      await db.insert(waitlistEvents).values({
        eventName,
        source,
        metadata: {
          ...properties,
          distinctId: distinctId.slice(0, 80),
        },
      });
    } catch (error) {
      console.error("/api/analytics db error:", error);
    }
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
