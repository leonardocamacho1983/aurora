import * as Sentry from "@sentry/nextjs";
import { scrubSentryEvent } from "@/lib/monitoring/sentry-privacy";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  sendDefaultPii: false,
  tracesSampleRate: process.env.VERCEL_ENV === "production" ? 0.05 : 1.0,
  beforeBreadcrumb: (breadcrumb) => scrubSentryEvent({ breadcrumbs: [breadcrumb] }).breadcrumbs?.[0] ?? breadcrumb,
  beforeSend: (event) => scrubSentryEvent(event),
  beforeSendTransaction: (event) => scrubSentryEvent(event),
});
