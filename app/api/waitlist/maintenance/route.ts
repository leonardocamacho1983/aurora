import { NextResponse } from "next/server";
import { runWaitlistMaintenance } from "@/lib/waitlist/maintenance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isCronAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();

  if (!cronSecret) return false;
  return bearer === cronSecret;
}

function isAdminAuthorized(request: Request) {
  const url = new URL(request.url);
  const adminToken = process.env.WAITLIST_ADMIN_TOKEN?.trim();

  if (adminToken && url.searchParams.get("token") === adminToken) return true;
  return false;
}

function limitFromUrl(request: Request) {
  const url = new URL(request.url);
  const parsed = Number(url.searchParams.get("limit") ?? 200);
  if (!Number.isFinite(parsed)) return 200;
  return Math.max(1, Math.min(500, Math.floor(parsed)));
}

function dryRunFromUrl(request: Request) {
  const url = new URL(request.url);
  return url.searchParams.get("dryRun") === "1" || url.searchParams.get("dryRun") === "true";
}

async function runMaintenance(request: Request) {
  if (request.method === "GET" && !process.env.CRON_SECRET?.trim()) {
    return NextResponse.json({ error: "cron not configured" }, { status: 503 });
  }

  const authorized = request.method === "GET" ? isCronAuthorized(request) : isAdminAuthorized(request);
  if (!authorized) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const result = await runWaitlistMaintenance({
    dryRun: dryRunFromUrl(request),
    limit: limitFromUrl(request),
  });

  return NextResponse.json({
    status: "ok",
    ...result,
  });
}

export async function GET(request: Request) {
  return runMaintenance(request);
}

export async function POST(request: Request) {
  return runMaintenance(request);
}
