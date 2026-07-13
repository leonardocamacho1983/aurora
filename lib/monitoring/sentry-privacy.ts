import type { Breadcrumb, Event } from "@sentry/core";

const REDACTED = "[Filtered by Aurora]";

const SENSITIVE_KEY_PATTERN =
  /(token|secret|password|authorization|cookie|email|name|phone|audio|audioUrl|transcript|transcription|reflection|diary|entry|entries|journal|prompt|message|content|body|answer|response|feedback|openText|raw|text)/i;

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const LONG_TOKEN_PATTERN = /\b(?:[A-Za-z0-9_-]{24,}|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\b/g;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function redactString(value: string): string {
  return value.replace(EMAIL_PATTERN, REDACTED).replace(LONG_TOKEN_PATTERN, REDACTED);
}

export function sanitizeUrl(value: string | undefined): string | undefined {
  if (!value) return value;

  try {
    const parsed = new URL(value, "https://www.faleaurora.com");
    parsed.search = "";
    parsed.hash = "";

    if (parsed.pathname.startsWith("/lista/")) {
      parsed.pathname = "/lista/[token]";
    }

    if (parsed.pathname.startsWith("/r/")) {
      parsed.pathname = "/r/[code]";
    }

    return parsed.origin === "https://www.faleaurora.com" ? parsed.pathname : parsed.toString();
  } catch {
    return redactString(value.split("?")[0]?.split("#")[0] ?? value);
  }
}

function scrubValue(value: unknown, depth = 0): unknown {
  if (depth > 4) return REDACTED;

  if (typeof value === "string") return redactString(value);
  if (typeof value !== "object" || value === null) return value;
  if (Array.isArray(value)) return value.map((item) => scrubValue(item, depth + 1));
  if (!isPlainObject(value)) return REDACTED;

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key) ? REDACTED : scrubValue(item, depth + 1),
    ]),
  );
}

function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
  const data = isPlainObject(breadcrumb.data) ? scrubValue(breadcrumb.data) : breadcrumb.data;

  return {
    ...breadcrumb,
    message: breadcrumb.message ? redactString(breadcrumb.message) : breadcrumb.message,
    data: isPlainObject(data) ? data : breadcrumb.data,
  };
}

export function scrubSentryEvent<T extends Event>(event: T): T {
  const request = event.request
    ? {
        ...event.request,
        url: sanitizeUrl(event.request.url),
        cookies: undefined,
        data: undefined,
        env: undefined,
        headers: undefined,
        query_string: undefined,
      }
    : undefined;

  return {
    ...event,
    user: undefined,
    request,
    breadcrumbs: event.breadcrumbs?.map(scrubBreadcrumb),
    contexts: (isPlainObject(event.contexts) ? scrubValue(event.contexts) : event.contexts) as Event["contexts"],
    extra: (isPlainObject(event.extra) ? scrubValue(event.extra) : event.extra) as Event["extra"],
  } as T;
}
