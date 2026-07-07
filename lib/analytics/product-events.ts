import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { captureAuroraServer } from "@/lib/analytics/server";

type ProductEventMetadataValue = string | number | boolean | null | undefined;
export type ProductEventMetadata = Record<string, ProductEventMetadataValue>;

const ALLOWED_METADATA_KEYS = new Set([
  "attempt",
  "audio_mime_type",
  "audio_size_bucket",
  "capture_side",
  "device_family",
  "duration_bucket",
  "entry_count",
  "entry_mode",
  "error_class",
  "error_code",
  "fallback_saved",
  "focus_confidence",
  "focus_count",
  "focus_key",
  "has_mood",
  "has_focus",
  "intent",
  "language",
  "latency_bucket",
  "model",
  "provider",
  "rag_used",
  "recorder_mime_type",
  "reflection_type",
  "request_id",
  "retryable",
  "risk_level",
  "route_confidence",
  "route_intent",
  "route_latency_bucket",
  "total_latency_bucket",
  "status",
  "storage_path_present",
  "surface",
  "transcript_length_bucket",
]);

function sanitizeProductEventMetadata(metadata: ProductEventMetadata = {}) {
  const clean: Record<string, string | number | boolean | null> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (!ALLOWED_METADATA_KEYS.has(key) || value === undefined) continue;
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      clean[key] = typeof value === "string" ? value.slice(0, 180) : value;
    }
  }

  return clean;
}

export async function recordProductEvent({
  userId,
  eventName,
  source = "server",
  metadata,
  distinctId,
  capturePostHog = false,
}: {
  userId: string | null | undefined;
  eventName: string;
  source?: string;
  metadata?: ProductEventMetadata;
  distinctId?: string;
  capturePostHog?: boolean;
}) {
  if (!userId) return false;

  const cleanMetadata = sanitizeProductEventMetadata(metadata);

  try {
    await db.execute(sql`
      insert into product_events (user_id, event_name, source, metadata)
      values (${userId}::uuid, ${eventName}, ${source}, ${JSON.stringify(cleanMetadata)}::jsonb)
    `);
  } catch (error) {
    console.error("recordProductEvent db error:", error);
    return false;
  }

  if (capturePostHog && distinctId) {
    await captureAuroraServer(eventName, distinctId, {
      ...cleanMetadata,
      source,
      capture_side: "server",
    });
  }

  return true;
}
