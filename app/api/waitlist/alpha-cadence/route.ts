import { NextResponse } from "next/server";
import { siteUrl } from "@/lib/referral/urls";
import {
  isAlphaCadenceKind,
  runAlphaCadenceAutomation,
} from "@/lib/waitlist/alpha-cadence";

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
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();

  if (adminToken && url.searchParams.get("token") === adminToken) return true;
  if (adminToken && bearer === adminToken) return true;
  return false;
}

function dryRunFromUrl(request: Request) {
  const value = new URL(request.url).searchParams.get("dryRun");
  return value !== "0" && value !== "false";
}

function limitFromUrl(request: Request) {
  const parsed = Number(new URL(request.url).searchParams.get("limit") ?? 100);
  if (!Number.isFinite(parsed)) return 100;
  return Math.max(1, Math.min(500, Math.floor(parsed)));
}

async function run(request: Request) {
  const authorized = request.method === "GET" ? isCronAuthorized(request) || isAdminAuthorized(request) : isAdminAuthorized(request);
  if (!authorized) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const requestedKind = url.searchParams.get("kind");
  if (requestedKind && !isAlphaCadenceKind(requestedKind)) {
    return NextResponse.json({ error: "invalid kind" }, { status: 400 });
  }
  const kind = isAlphaCadenceKind(requestedKind) ? requestedKind : undefined;

  const results = await runAlphaCadenceAutomation({
    baseUrl: siteUrl(request.url),
    dryRun: dryRunFromUrl(request),
    limit: limitFromUrl(request),
    kind,
  });

  return NextResponse.json({
    status: "ok",
    results,
  });
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
