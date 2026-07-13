import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const adminToken = process.env.WAITLIST_ADMIN_TOKEN?.trim();
  if (!adminToken) return false;

  const url = new URL(req.url);
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();

  return url.searchParams.get("token") === adminToken || bearer === adminToken;
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SENTRY_DSN?.trim()) {
    return Response.json({ error: "sentry_not_configured" }, { status: 503 });
  }

  const eventId = Sentry.captureMessage("Aurora Sentry smoke test", {
    level: "info",
    tags: {
      check: "sentry_smoke",
      surface: "observability",
    },
    extra: {
      route: "/api/observability/sentry-smoke",
      pii: "none",
    },
  });

  await Sentry.flush(2000);

  return Response.json({ ok: true, eventId });
}
