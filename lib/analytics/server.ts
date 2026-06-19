import { createHash } from "crypto";

type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

const POSTHOG_CAPTURE_PATH = "/capture/";

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

export function analyticsEmailId(email: string) {
  const normalized = email.trim().toLowerCase();
  return `email_${createHash("sha256").update(normalized).digest("hex").slice(0, 32)}`;
}

function sanitizeProperties(input: AnalyticsProperties) {
  const output: Record<string, string | number | boolean | null> = {};

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      output[key] = typeof value === "string" ? value.slice(0, 240) : value;
    }
  }

  return output;
}

export async function captureAuroraServer(
  eventName: string,
  distinctId: string,
  properties: AnalyticsProperties = {},
) {
  const token = posthogToken();
  if (!token) return;

  try {
    await fetch(`${posthogHost()}${POSTHOG_CAPTURE_PATH}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        api_key: token,
        event: eventName,
        distinct_id: distinctId || "server_anonymous",
        properties: {
          ...sanitizeProperties(properties),
          app: "aurora",
          capture_side: "server",
        },
      }),
    });
  } catch (error) {
    console.error("captureAuroraServer error:", error);
  }
}
