import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { analyticsEmailId, captureAuroraServer } from "@/lib/analytics/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PMF_VARIANT = "alpha_pmf_v1";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const KINDS = new Set(["reflection_micro", "pmf"]);
const ACTIONS = new Set(["shown", "answered", "skipped", "snoozed"]);
const MICRO_ANSWERS = new Set(["positive", "negative"]);
const PMF_ANSWERS = new Set([
  "very_disappointed",
  "somewhat_disappointed",
  "not_disappointed",
  "not_sure_yet",
]);
const PMF_REASONS = new Set([
  "more_clarity",
  "continue_this_thread",
  "name_feeling",
  "organized_thoughts",
  "clear_start",
  "closer_reflection",
  "right_moment",
  "lighter_experience",
  "example_when_to_use",
  "clarity_after_speaking",
  "threads_continuity",
  "patterns",
  "next_steps",
  "private_space",
  "more_precise_reflections",
  "better_memory",
  "useful_reminders",
  "privacy_control",
  "more_natural_voice",
  "no_value_yet",
  "voice_did_not_fit",
  "reflection_did_not_help",
  "did_not_return",
  "prefer_other_method",
  "forgot",
  "no_right_moment",
  "did_not_know_what_to_say",
  "privacy_doubt",
  "first_experience_did_not_fit",
  "other_closed",
]);

type EntryRow = {
  id: string;
  riskLevel: string;
  entryMode: string;
  hasReflection: boolean;
};

type StatsRow = {
  reflectedEntries: number;
  activeDays: number;
  continuedEntries: number;
};

type FeedbackStateRow = {
  microAnswered: number;
  pmfAnswered: number;
  pmfSnoozed: number;
};

type UserFlagRow = {
  pmfTestEnabled: boolean;
};

type FeedbackBody = {
  kind?: unknown;
  action?: unknown;
  entryId?: unknown;
  answer?: unknown;
  reason?: unknown;
  source?: unknown;
  variant?: unknown;
};

function rows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === "object" && "rows" in result) {
    return (result as { rows?: T[] }).rows ?? [];
  }
  return [];
}

function asNumber(value: unknown) {
  return Number(value ?? 0);
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

function cleanEnum(value: unknown, allowed: Set<string>) {
  return typeof value === "string" && allowed.has(value) ? value : null;
}

function cleanSource(value: unknown) {
  if (typeof value !== "string") return "diary_reflection";
  return value === "timeline" ? "timeline" : "diary_reflection";
}

function eventName(kind: string, action: string) {
  if (kind === "reflection_micro") {
    return action === "shown"
      ? "product_reflection_feedback_shown"
      : "product_reflection_feedback_answered";
  }

  const suffix: Record<string, string> = {
    shown: "shown",
    answered: "answered",
    skipped: "skipped",
    snoozed: "snoozed",
  };
  return `product_pmf_prompt_${suffix[action] ?? "answered"}`;
}

async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

async function entryForUser(userId: string, entryId: string) {
  const [entry] = rows<EntryRow>(
    await db.execute(sql`
      select
        id::text,
        risk_level as "riskLevel",
        coalesce(entry_mode, 'new') as "entryMode",
        (reflection is not null and nullif(trim(reflection), '') is not null) as "hasReflection"
      from entries
      where id = ${entryId}::uuid
        and user_id = ${userId}::uuid
      limit 1
    `),
  );
  return entry ?? null;
}

async function recordProductEvent({
  userId,
  event,
  source,
  metadata,
}: {
  userId: string;
  event: string;
  source: string;
  metadata: Record<string, string | number | boolean | null>;
}) {
  try {
    await db.execute(sql`
      insert into product_events (user_id, event_name, source, metadata)
      values (${userId}::uuid, ${event}, ${source}, ${JSON.stringify(metadata)}::jsonb)
    `);
  } catch (error) {
    console.error("/api/product-feedback product_events error:", error);
  }
}

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const entryId = url.searchParams.get("entryId");
  if (!isUuid(entryId)) {
    return NextResponse.json({
      reflectionMicro: { eligible: false },
      pmf: { eligible: false, variant: PMF_VARIANT },
    });
  }

  const entry = await entryForUser(user.id, entryId);
  if (!entry?.hasReflection || entry.riskLevel === "high") {
    return NextResponse.json({
      reflectionMicro: { eligible: false },
      pmf: { eligible: false, variant: PMF_VARIANT },
    });
  }

  const [stats] = rows<StatsRow>(
    await db.execute(sql`
      select
        count(*) filter (
          where reflection is not null and nullif(trim(reflection), '') is not null
        )::int as "reflectedEntries",
        count(distinct date_trunc('day', created_at at time zone 'America/Sao_Paulo'))::int as "activeDays",
        count(*) filter (
          where coalesce(entry_mode, 'new') = 'continue'
             or continued_from_entry_id is not null
        )::int as "continuedEntries"
      from entries
      where user_id = ${user.id}::uuid
    `),
  );

  const [feedback] = rows<FeedbackStateRow>(
    await db.execute(sql`
      select
        count(*) filter (
          where kind = 'reflection_micro'
            and entry_id = ${entryId}::uuid
            and answered_at is not null
        )::int as "microAnswered",
        count(*) filter (
          where kind = 'pmf'
            and answered_at is not null
        )::int as "pmfAnswered",
        count(*) filter (
          where kind = 'pmf'
            and snoozed_until is not null
            and snoozed_until > now()
        )::int as "pmfSnoozed"
      from product_feedback
      where user_id = ${user.id}::uuid
    `),
  );

  const [flags] = rows<UserFlagRow>(
    await db.execute(sql`
      select
        coalesce((onboarding_context->>'pmf_test_enabled')::boolean, false) as "pmfTestEnabled"
      from users
      where id = ${user.id}::uuid
      limit 1
    `),
  );

  const reflectedEntries = asNumber(stats?.reflectedEntries);
  const activeDays = asNumber(stats?.activeDays);
  const continuedEntries = asNumber(stats?.continuedEntries);
  const normalPmfEligible =
    reflectedEntries >= 2 || activeDays >= 2 || continuedEntries >= 1;
  const testPmfEligible = Boolean(flags?.pmfTestEnabled) && reflectedEntries >= 1;
  const pmfEligible =
    (normalPmfEligible || testPmfEligible) &&
    asNumber(feedback?.pmfAnswered) === 0 &&
    asNumber(feedback?.pmfSnoozed) === 0;

  return NextResponse.json({
    reflectionMicro: {
      eligible: asNumber(feedback?.microAnswered) === 0,
    },
    pmf: {
      eligible: pmfEligible,
      variant: PMF_VARIANT,
      testMode: testPmfEligible && !normalPmfEligible,
    },
  });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: FeedbackBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const kind = cleanEnum(body.kind, KINDS);
  const action = cleanEnum(body.action, ACTIONS);
  if (!kind || !action) {
    return NextResponse.json({ error: "invalid_feedback_event" }, { status: 400 });
  }

  const entryId = isUuid(body.entryId) ? body.entryId : null;
  const entry = entryId ? await entryForUser(user.id, entryId) : null;
  if (entryId && !entry) {
    return NextResponse.json({ error: "entry_not_found" }, { status: 404 });
  }

  const answer =
    kind === "reflection_micro"
      ? cleanEnum(body.answer, MICRO_ANSWERS)
      : cleanEnum(body.answer, PMF_ANSWERS);
  const reason = kind === "pmf" ? cleanEnum(body.reason, PMF_REASONS) : null;
  if (action === "answered" && !answer) {
    return NextResponse.json({ error: "invalid_answer" }, { status: 400 });
  }

  const source = cleanSource(body.source);
  const variant = body.variant === PMF_VARIANT ? PMF_VARIANT : PMF_VARIANT;
  const event = eventName(kind, action);
  const now = new Date();
  const nowIso = now.toISOString();
  const snoozedUntil =
    action === "snoozed"
      ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;
  const metadata = {
    variant,
    source,
    kind,
    action,
    entry_id: entryId,
    answer,
    reason,
    entry_mode: entry?.entryMode ?? null,
  };

  await db.execute(sql`
    insert into product_feedback (
      user_id,
      entry_id,
      kind,
      action,
      answer,
      reason,
      source,
      variant,
      metadata,
      shown_at,
      answered_at,
      skipped_at,
      snoozed_until
    )
    values (
      ${user.id}::uuid,
      ${entryId}::uuid,
      ${kind},
      ${action},
      ${answer},
      ${reason},
      ${source},
      ${variant},
      ${JSON.stringify(metadata)}::jsonb,
      ${action === "shown" ? nowIso : null},
      ${action === "answered" ? nowIso : null},
      ${action === "skipped" ? nowIso : null},
      ${snoozedUntil}
    )
  `);

  await Promise.all([
    recordProductEvent({ userId: user.id, event, source, metadata }),
    captureAuroraServer(event, analyticsEmailId(user.email ?? `user:${user.id}`), metadata),
  ]);

  return NextResponse.json({ status: "ok" });
}
