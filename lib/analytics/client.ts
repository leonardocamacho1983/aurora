"use client";

type EventProperties = Record<string, string | number | boolean | null | undefined>;

const CLIENT_ID_KEY = "aurora_client_id";
const REF_KEY = "aurora_ref";
const INVITE_CONTEXT_KEY = "aurora_invite_context";

function clientId() {
  try {
    const rawContext = localStorage.getItem(INVITE_CONTEXT_KEY);
    if (rawContext) {
      const context = JSON.parse(rawContext) as { referralCode?: string };
      if (typeof context.referralCode === "string" && context.referralCode) {
        return `ref_${context.referralCode}`;
      }
    }

    const existing = localStorage.getItem(CLIENT_ID_KEY);
    if (existing) return existing;
    const next =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `anon_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(CLIENT_ID_KEY, next);
    return next;
  } catch {
    return "anonymous";
  }
}

function readStoredRef(): string {
  try {
    const raw = localStorage.getItem(REF_KEY);
    if (!raw) return "";
    const data = JSON.parse(raw) as { code?: string };
    return typeof data.code === "string" ? data.code : "";
  } catch {
    return "";
  }
}

function readSearchProperties() {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") || undefined,
    utm_medium: params.get("utm_medium") || undefined,
    utm_campaign: params.get("utm_campaign") || undefined,
    utm_content: params.get("utm_content") || undefined,
    utm_term: params.get("utm_term") || undefined,
    referral_code: params.get("ref") || readStoredRef() || undefined,
  };
}

export function trackAurora(eventName: string, properties: EventProperties = {}) {
  if (typeof window === "undefined") return;

  const payload = {
    eventName,
    distinctId: clientId(),
    properties: {
      ...properties,
      path: window.location.pathname,
      search: window.location.search.slice(0, 160),
      referrer: document.referrer ? new URL(document.referrer).hostname : "",
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      ...readSearchProperties(),
    },
  };

  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/analytics", blob);
      return;
    }
  } catch {
    /* fall through to fetch */
  }

  fetch("/api/analytics", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}
