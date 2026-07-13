import { describe, expect, it } from "vitest";
import {
  RESEND_WEBHOOK_EVENTS,
  hasExpectedResendWebhookEvents,
  missingResendWebhookEvents,
  normalizeWebhookEndpoint,
} from "@/lib/email/resend-webhook";

describe("resend webhook helpers", () => {
  it("keeps the production email event contract explicit", () => {
    expect(RESEND_WEBHOOK_EVENTS).toEqual([
      "email.delivered",
      "email.opened",
      "email.clicked",
      "email.bounced",
      "email.complained",
      "email.delivery_delayed",
      "email.failed",
      "email.suppressed",
    ]);
  });

  it("detects missing events without requiring exact order", () => {
    const configured = ["email.failed", "email.delivered", "email.opened"];

    expect(hasExpectedResendWebhookEvents(configured)).toBe(false);
    expect(missingResendWebhookEvents(configured)).toEqual([
      "email.clicked",
      "email.bounced",
      "email.complained",
      "email.delivery_delayed",
      "email.suppressed",
    ]);
  });

  it("normalizes endpoints before matching webhooks", () => {
    expect(normalizeWebhookEndpoint(" https://www.faleaurora.com/api/resend/webhook/ ")).toBe(
      "https://www.faleaurora.com/api/resend/webhook",
    );
  });
});
