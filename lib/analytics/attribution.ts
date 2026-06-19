export type SafeAnalyticsProperties = Record<string, string | number | boolean | null>;

const SOCIAL_HOSTS = [
  "facebook.",
  "instagram.",
  "linkedin.",
  "t.co",
  "twitter.",
  "x.com",
  "whatsapp.",
  "wa.me",
  "youtube.",
  "tiktok.",
  "threads.",
];

const SEARCH_HOSTS = [
  "google.",
  "bing.",
  "duckduckgo.",
  "yahoo.",
  "ecosia.",
  "perplexity.",
  "chatgpt.",
];

export function safeHost(value: string | null | undefined) {
  if (!value) return "";
  try {
    return new URL(value).hostname.replace(/^www\./, "").slice(0, 120);
  } catch {
    return value.replace(/^www\./, "").slice(0, 120);
  }
}

export function classifyTrafficSource(properties: {
  utm_source?: string | null;
  utm_medium?: string | null;
  referral_code?: string | null;
  referrer?: string | null;
}) {
  const utmSource = String(properties.utm_source || "").toLowerCase();
  const utmMedium = String(properties.utm_medium || "").toLowerCase();
  const referralCode = String(properties.referral_code || "");
  const referrer = safeHost(properties.referrer).toLowerCase();

  if (referralCode) return "invite";
  if (utmSource || utmMedium) return "campaign";
  if (!referrer) return "direct";
  if (SEARCH_HOSTS.some((host) => referrer.includes(host))) return "search";
  if (SOCIAL_HOSTS.some((host) => referrer.includes(host))) return "social";
  return "referral";
}

export function sanitizeAnalyticsProperties(
  input: unknown,
  allowedKeys: ReadonlySet<string>,
): SafeAnalyticsProperties {
  if (!input || typeof input !== "object") return {};
  const output: SafeAnalyticsProperties = {};

  for (const [key, value] of Object.entries(input)) {
    if (!allowedKeys.has(key)) continue;
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      output[key] = typeof value === "string" ? value.slice(0, 220) : value;
    }
  }

  output.source_type = classifyTrafficSource({
    utm_source: typeof output.utm_source === "string" ? output.utm_source : null,
    utm_medium: typeof output.utm_medium === "string" ? output.utm_medium : null,
    referral_code: typeof output.referral_code === "string" ? output.referral_code : null,
    referrer: typeof output.referrer === "string" ? output.referrer : null,
  });

  return output;
}
