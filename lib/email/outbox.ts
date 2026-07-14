import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { emailOutbox } from "@/lib/db/schema";
import type { EmailTopicKey } from "@/lib/email/lifecycle-contract";

export type EmailOutboxStatus = "pending" | "sent" | "skipped" | "failed";

export type EnqueueEmailInput = {
  waitlistId?: string | null;
  email: string;
  eventName: string;
  templateKey?: string | null;
  topicKey?: EmailTopicKey | null;
  priority?: number;
  idempotencyKey: string;
  payloadSummary?: Record<string, unknown>;
  nextAttemptAt?: Date;
};

export async function enqueueEmail(input: EnqueueEmailInput) {
  const now = new Date();
  const [row] = await db
    .insert(emailOutbox)
    .values({
      waitlistId: input.waitlistId ?? null,
      email: input.email.trim().toLowerCase(),
      eventName: input.eventName,
      templateKey: input.templateKey ?? null,
      topicKey: input.topicKey ?? null,
      priority: input.priority ?? 50,
      idempotencyKey: input.idempotencyKey,
      payloadSummary: input.payloadSummary ?? null,
      nextAttemptAt: input.nextAttemptAt ?? now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: emailOutbox.idempotencyKey,
      set: {
        priority: input.priority ?? 50,
        nextAttemptAt: input.nextAttemptAt ?? now,
        payloadSummary: input.payloadSummary ?? null,
        updatedAt: now,
      },
    })
    .returning({
      id: emailOutbox.id,
      status: emailOutbox.status,
      idempotencyKey: emailOutbox.idempotencyKey,
    });

  return row;
}

export async function markEmailOutboxStatus(input: {
  idempotencyKey: string;
  status: EmailOutboxStatus;
  providerEventId?: string | null;
  lastError?: string | null;
}) {
  const now = new Date();
  const [row] = await db
    .update(emailOutbox)
    .set({
      status: input.status,
      providerEventId: input.providerEventId ?? null,
      lastError: input.lastError?.slice(0, 1000) ?? null,
      sentAt: input.status === "sent" ? now : undefined,
      updatedAt: now,
    })
    .where(eq(emailOutbox.idempotencyKey, input.idempotencyKey))
    .returning({
      id: emailOutbox.id,
      status: emailOutbox.status,
    });

  return row;
}

export async function emailOutboxHasPending(idempotencyKey: string) {
  const rows = await db
    .select({ id: emailOutbox.id })
    .from(emailOutbox)
    .where(and(eq(emailOutbox.idempotencyKey, idempotencyKey), eq(emailOutbox.status, "pending")))
    .limit(1);

  return rows.length > 0;
}
