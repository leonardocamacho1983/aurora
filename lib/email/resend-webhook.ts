import type { WebhookEvent } from "resend";
import { siteUrl } from "@/lib/referral/urls";

export const RESEND_WEBHOOK_EVENTS = [
  "email.delivered",
  "email.opened",
  "email.clicked",
  "email.bounced",
  "email.complained",
  "email.delivery_delayed",
  "email.failed",
  "email.suppressed",
] as const satisfies readonly WebhookEvent[];

export function resendWebhookEndpoint(requestUrl?: string) {
  return `${siteUrl(requestUrl)}/api/resend/webhook`;
}

export function normalizeWebhookEndpoint(endpoint: string) {
  return endpoint.trim().replace(/\/+$/, "");
}

export function missingResendWebhookEvents(events: readonly string[] | null | undefined) {
  const configured = new Set(events ?? []);
  return RESEND_WEBHOOK_EVENTS.filter((event) => !configured.has(event));
}

export function hasExpectedResendWebhookEvents(events: readonly string[] | null | undefined) {
  return missingResendWebhookEvents(events).length === 0;
}
