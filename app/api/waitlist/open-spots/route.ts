import { NextResponse } from "next/server";
import { siteUrl } from "@/lib/referral/urls";
import {
  getOpenSpotsReport,
  isOpenSpotsFollowUpKind,
  OPEN_SPOTS_CAMPAIGN,
  runOpenSpotsFollowUpAutomation,
  runOpenSpotsInviteCampaign,
} from "@/lib/waitlist/open-spots-campaign";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONFIRM_SEND = "send-open-spots-20-free-2026-07-14";

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
  const url = new URL(request.url);
  const claim = url.searchParams.get("claim")?.trim();
  if (claim) {
    const ritual = new URL("/chegada", siteUrl(request.url));
    ritual.searchParams.set("token", claim);
    ritual.searchParams.set("utm_source", "email");
    ritual.searchParams.set("utm_medium", "lifecycle");
    ritual.searchParams.set("utm_campaign", OPEN_SPOTS_CAMPAIGN);
    return NextResponse.redirect(ritual);
  }

  const authorized = request.method === "GET" ? isCronAuthorized(request) || isAdminAuthorized(request) : isAdminAuthorized(request);
  if (!authorized) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const mode = url.searchParams.get("mode") ?? "followup";
  if (mode === "report") {
    return NextResponse.json({
      status: "ok",
      report: await getOpenSpotsReport(),
    });
  }

  const dryRun = dryRunFromUrl(request);
  if (mode === "invite") {
    if (!dryRun && url.searchParams.get("confirm") !== CONFIRM_SEND) {
      return NextResponse.json(
        {
          error: "missing live send confirmation",
          campaign: OPEN_SPOTS_CAMPAIGN,
          confirm: CONFIRM_SEND,
        },
        { status: 400 },
      );
    }

    const result = await runOpenSpotsInviteCampaign({
      baseUrl: siteUrl(request.url),
      dryRun,
      limit: limitFromUrl(request),
    });

    return NextResponse.json({
      status: "ok",
      mode,
      result,
      report: await getOpenSpotsReport(),
    });
  }

  if (mode !== "followup") {
    return NextResponse.json({ error: "invalid mode" }, { status: 400 });
  }

  const requestedKind = url.searchParams.get("kind");
  if (requestedKind && !isOpenSpotsFollowUpKind(requestedKind)) {
    return NextResponse.json({ error: "invalid kind" }, { status: 400 });
  }

  const result = await runOpenSpotsFollowUpAutomation({
    baseUrl: siteUrl(request.url),
    dryRun,
    limit: limitFromUrl(request),
    kind: isOpenSpotsFollowUpKind(requestedKind) ? requestedKind : undefined,
  });

  return NextResponse.json({
    status: "ok",
    mode,
    dryRun,
    result,
    report: await getOpenSpotsReport(),
  });
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
