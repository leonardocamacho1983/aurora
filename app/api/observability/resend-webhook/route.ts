import { Resend, type Webhook } from "resend";
import {
  RESEND_WEBHOOK_EVENTS,
  hasExpectedResendWebhookEvents,
  missingResendWebhookEvents,
  normalizeWebhookEndpoint,
  resendWebhookEndpoint,
} from "@/lib/email/resend-webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WebhookSummary = {
  id: string;
  endpoint: string;
  status: Webhook["status"];
  events: Webhook["events"];
  missingEvents: string[];
  hasExpectedEvents: boolean;
  signingSecretMatches: boolean | null;
};

function authorized(req: Request): boolean {
  const adminToken = process.env.WAITLIST_ADMIN_TOKEN?.trim();
  if (!adminToken) return false;

  const url = new URL(req.url);
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();

  return url.searchParams.get("token") === adminToken || bearer === adminToken;
}

function envStatus() {
  return {
    resendApiKeyConfigured: Boolean(process.env.RESEND_API_KEY?.trim()),
    resendWebhookSecretConfigured: Boolean(process.env.RESEND_WEBHOOK_SECRET?.trim()),
  };
}

function json(data: Record<string, unknown>, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function sanitizedError(error: unknown) {
  if (!error || typeof error !== "object") return "unknown_error";
  if ("name" in error && typeof error.name === "string") return error.name;
  if ("message" in error && typeof error.message === "string") return error.message.slice(0, 120);
  return "unknown_error";
}

function findTargetWebhook(webhooks: Webhook[], endpoint: string) {
  const expected = normalizeWebhookEndpoint(endpoint);
  return webhooks.find((webhook) => normalizeWebhookEndpoint(webhook.endpoint) === expected) ?? null;
}

async function webhookSummary(resend: Resend, webhook: Webhook): Promise<WebhookSummary> {
  const missingEvents = missingResendWebhookEvents(webhook.events);
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  let signingSecretMatches: boolean | null = null;

  if (secret) {
    const detail = await resend.webhooks.get(webhook.id);
    if (detail.error) {
      throw detail.error;
    }
    signingSecretMatches = detail.data.signing_secret === secret;
  }

  return {
    id: webhook.id,
    endpoint: webhook.endpoint,
    status: webhook.status,
    events: webhook.events,
    missingEvents,
    hasExpectedEvents: missingEvents.length === 0,
    signingSecretMatches,
  };
}

async function inspectOrEnsure(req: Request, ensure: boolean) {
  if (!authorized(req)) {
    return json({ error: "unauthorized" }, 401);
  }

  const status = envStatus();
  if (!status.resendApiKeyConfigured) {
    return json({ ok: false, ...status, error: "resend_api_key_not_configured" }, 503);
  }

  const endpoint = resendWebhookEndpoint(req.url);
  const resend = new Resend(process.env.RESEND_API_KEY);
  const list = await resend.webhooks.list({ limit: 100 });
  if (list.error) {
    return json({ ok: false, ...status, endpoint, error: sanitizedError(list.error) }, 502);
  }

  let action: "audit" | "unchanged" | "updated" | "missing" = ensure ? "unchanged" : "audit";
  let webhook = findTargetWebhook(list.data.data, endpoint);

  if (!webhook) {
    return json({
      ok: false,
      ...status,
      endpoint,
      action: "missing",
      webhook: null,
      expectedEvents: RESEND_WEBHOOK_EVENTS,
      note: "Create this endpoint in Resend, then store its signing secret in RESEND_WEBHOOK_SECRET.",
    });
  }

  if (ensure) {
    const shouldUpdate = webhook.status !== "enabled" || !hasExpectedResendWebhookEvents(webhook.events);
    if (shouldUpdate) {
      const update = await resend.webhooks.update(webhook.id, {
        status: "enabled",
        events: [...RESEND_WEBHOOK_EVENTS],
      });
      if (update.error) {
        return json({ ok: false, ...status, endpoint, error: sanitizedError(update.error) }, 502);
      }

      const refreshed = await resend.webhooks.list({ limit: 100 });
      if (refreshed.error) {
        return json({ ok: false, ...status, endpoint, error: sanitizedError(refreshed.error) }, 502);
      }
      webhook = findTargetWebhook(refreshed.data.data, endpoint);
      action = "updated";
    }
  }

  if (!webhook) {
    return json({ ok: false, ...status, endpoint, action: "missing", webhook: null }, 502);
  }

  try {
    const summary = await webhookSummary(resend, webhook);
    const ok =
      summary.status === "enabled" &&
      summary.hasExpectedEvents &&
      summary.signingSecretMatches === true &&
      status.resendWebhookSecretConfigured;

    return json({
      ok,
      ...status,
      endpoint,
      action,
      webhook: summary,
      expectedEvents: RESEND_WEBHOOK_EVENTS,
    });
  } catch (error) {
    return json({ ok: false, ...status, endpoint, error: sanitizedError(error) }, 502);
  }
}

export async function GET(req: Request) {
  return inspectOrEnsure(req, false);
}

export async function POST(req: Request) {
  return inspectOrEnsure(req, true);
}
