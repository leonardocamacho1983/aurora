import { db } from "@/lib/db";
import { waitlistEvents } from "@/lib/db/schema";
import {
  sendResendLifecycleEvent,
  syncResendLifecycleContact,
} from "@/lib/email/resend-lifecycle";
import type {
  AuroraLifecycleEventName,
  LifecycleContactProperties,
} from "@/lib/email/lifecycle-contract";

export async function recordAuroraLifecycleEvent(input: {
  waitlistId?: string | null;
  eventName: AuroraLifecycleEventName;
  source: string;
  contact: LifecycleContactProperties;
  metadata?: Record<string, unknown>;
}) {
  const metadata = {
    ...(input.metadata ?? {}),
    provider: "resend",
    resend_lifecycle_sync_enabled:
      process.env.RESEND_LIFECYCLE_SYNC_ENABLED === "1" ||
      process.env.RESEND_LIFECYCLE_SYNC_ENABLED === "true",
    ritual_status: input.contact.ritualStatus,
    ritual_intent: input.contact.ritualIntent,
    access_status: input.contact.accessStatus,
    lifecycle_state: input.contact.lifecycleState,
  };

  await db.insert(waitlistEvents).values({
    waitlistId: input.waitlistId ?? null,
    eventName: input.eventName.replaceAll(".", "_"),
    source: input.source,
    metadata,
  });

  try {
    const result = await sendResendLifecycleEvent({
      eventName: input.eventName,
      contact: input.contact,
      payload: input.metadata,
    });

    await db.insert(waitlistEvents).values({
      waitlistId: input.waitlistId ?? null,
      eventName: result.skipped ? "resend_lifecycle_event_skipped" : "resend_lifecycle_event_sent",
      source: input.source,
      metadata: {
        lifecycle_event: input.eventName,
        reason: result.skipped ? result.reason ?? "sync_disabled" : null,
      },
    });
  } catch (error) {
    await db.insert(waitlistEvents).values({
      waitlistId: input.waitlistId ?? null,
      eventName: "resend_lifecycle_event_failed",
      source: input.source,
      metadata: {
        lifecycle_event: input.eventName,
        error: error instanceof Error ? error.message.slice(0, 500) : "unknown_error",
      },
    });
  }
}

export async function syncAuroraLifecycleContact(input: {
  waitlistId?: string | null;
  source: string;
  contact: LifecycleContactProperties;
}) {
  try {
    const result = await syncResendLifecycleContact(input.contact);
    await db.insert(waitlistEvents).values({
      waitlistId: input.waitlistId ?? null,
      eventName: result.skipped ? "resend_lifecycle_contact_skipped" : "resend_lifecycle_contact_synced",
      source: input.source,
      metadata: {
        reason: result.skipped ? result.reason ?? "sync_disabled" : null,
        lifecycle_state: input.contact.lifecycleState,
        ritual_intent: input.contact.ritualIntent,
      },
    });
  } catch (error) {
    await db.insert(waitlistEvents).values({
      waitlistId: input.waitlistId ?? null,
      eventName: "resend_lifecycle_contact_failed",
      source: input.source,
      metadata: {
        error: error instanceof Error ? error.message.slice(0, 500) : "unknown_error",
      },
    });
  }
}
