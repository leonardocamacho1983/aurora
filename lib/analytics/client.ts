"use client";

type EventProperties = Record<string, string | number | boolean | null | undefined>;

const CLIENT_ID_KEY = "aurora_client_id";

function clientId() {
  try {
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

export function trackAurora(eventName: string, properties: EventProperties = {}) {
  if (typeof window === "undefined") return;

  const payload = {
    eventName,
    distinctId: clientId(),
    properties: {
      ...properties,
      path: window.location.pathname,
      referrer: document.referrer ? new URL(document.referrer).hostname : "",
      viewport: `${window.innerWidth}x${window.innerHeight}`,
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
