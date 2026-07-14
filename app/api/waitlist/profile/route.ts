import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { waitlist, waitlistEvents, waitlistProfile } from "@/lib/db/schema";
import { createUniqueReferralCode } from "@/lib/referral/code";
import { siteUrl } from "@/lib/referral/urls";
import {
  profileFieldNames,
  profileValues,
  waitlistProfilePatchSchema,
} from "@/lib/referral/profile";
import { captureAuroraServer } from "@/lib/analytics/server";
import { sendRitualAlphaAccessEmail } from "@/lib/email/waitlist";
import { classifyRitualIntent } from "@/lib/email/ritual-intent";
import {
  lifecycleStateFromSignals,
  type AuroraLifecycleEventName,
  type LifecycleContactProperties,
} from "@/lib/email/lifecycle-contract";
import { recordAuroraLifecycleEvent } from "@/lib/email/lifecycle-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPEN_SPOTS_CAMPAIGN = "open_spots_20_free_2026_07_14";

type WaitlistIdentity = {
  id: string;
  email: string;
  referralCode: string;
  statusToken: string;
  confirmToken: string;
  confirmedAt: Date | null;
  unlockedAt: Date | null;
};

function isProfileComplete(profile: {
  name: string | null;
  moment: string | null;
  rhythm: string | null;
  presence: string | null;
  value: string | null;
}) {
  return Boolean(
    profile.name?.trim() &&
      profile.moment?.trim() &&
      profile.rhythm?.trim() &&
      profile.presence?.trim() &&
      profile.value?.trim(),
  );
}

async function findOrCreateWaitlistIdentity(input: {
  statusToken?: string;
  email?: string;
}): Promise<WaitlistIdentity | null> {
  if (input.statusToken) {
    const [row] = await db
      .select({
        id: waitlist.id,
        email: waitlist.email,
        referralCode: waitlist.referralCode,
        statusToken: waitlist.statusToken,
        confirmToken: waitlist.confirmToken,
        confirmedAt: waitlist.confirmedAt,
        unlockedAt: waitlist.unlockedAt,
      })
      .from(waitlist)
      .where(eq(waitlist.statusToken, input.statusToken))
      .limit(1);
    return row ?? null;
  }

  const email = input.email?.trim().toLowerCase();
  if (!email) return null;

  const [existing] = await db
    .select({
      id: waitlist.id,
      email: waitlist.email,
      referralCode: waitlist.referralCode,
      statusToken: waitlist.statusToken,
      confirmToken: waitlist.confirmToken,
      confirmedAt: waitlist.confirmedAt,
      unlockedAt: waitlist.unlockedAt,
    })
    .from(waitlist)
    .where(eq(waitlist.email, email))
    .limit(1);
  if (existing) return existing;

  const referralCode = await createUniqueReferralCode(db);
  const [created] = await db
    .insert(waitlist)
    .values({
      email,
      referralCode,
    })
    .returning({
      id: waitlist.id,
      email: waitlist.email,
      referralCode: waitlist.referralCode,
      statusToken: waitlist.statusToken,
      confirmToken: waitlist.confirmToken,
      confirmedAt: waitlist.confirmedAt,
      unlockedAt: waitlist.unlockedAt,
    });

  if (created) {
    await db.insert(waitlistEvents).values({
      waitlistId: created.id,
      eventName: "ritual_waitlist_created",
      source: "arrival_ritual",
      metadata: {
        campaign: OPEN_SPOTS_CAMPAIGN,
      },
    });
  }

  return created ?? null;
}

async function wasRitualAccessEmailSent(waitlistId: string) {
  const result = await db.execute(
    sql`
      select exists (
        select 1
        from waitlist_events
        where waitlist_id = ${waitlistId}
          and event_name in (
            'ritual_alpha_access_email_sent',
            'ritual_alpha_access_email_send_failed'
          )
          and metadata->>'campaign' = ${OPEN_SPOTS_CAMPAIGN}
      ) as "exists"
    `,
  );
  if (Array.isArray(result)) return Boolean((result[0] as { exists?: boolean } | undefined)?.exists);
  if (result && typeof result === "object" && "rows" in result) {
    return Boolean((result as { rows?: Array<{ exists?: boolean }> }).rows?.[0]?.exists);
  }
  return false;
}

async function lifecycleEventAlreadyRecorded(waitlistId: string, eventName: AuroraLifecycleEventName) {
  const storedEventName = eventName.replaceAll(".", "_");
  const result = await db.execute(
    sql`
      select exists (
        select 1
        from waitlist_events
        where waitlist_id = ${waitlistId}
          and event_name = ${storedEventName}
      ) as "exists"
    `,
  );
  if (Array.isArray(result)) return Boolean((result[0] as { exists?: boolean } | undefined)?.exists);
  if (result && typeof result === "object" && "rows" in result) {
    return Boolean((result as { rows?: Array<{ exists?: boolean }> }).rows?.[0]?.exists);
  }
  return false;
}

async function recordLifecycleEventOnce(input: {
  row: WaitlistIdentity;
  eventName: AuroraLifecycleEventName;
  source: string;
  contact: LifecycleContactProperties;
  metadata?: Record<string, unknown>;
}) {
  if (await lifecycleEventAlreadyRecorded(input.row.id, input.eventName)) return;
  await recordAuroraLifecycleEvent({
    waitlistId: input.row.id,
    eventName: input.eventName,
    source: input.source,
    contact: input.contact,
    metadata: input.metadata,
  });
}

async function grantAccessAfterRitual(input: {
  row: WaitlistIdentity;
  name: string | null;
  source: string;
  baseUrl: string;
}) {
  const wasUnlocked = Boolean(input.row.unlockedAt);
  const now = new Date();

  await db
    .update(waitlist)
    .set({
      confirmedAt: input.row.confirmedAt ?? now,
      unlockedAt: input.row.unlockedAt ?? now,
    })
    .where(eq(waitlist.id, input.row.id));

  const alreadySent = await wasRitualAccessEmailSent(input.row.id);
  const shouldSend = !wasUnlocked && !alreadySent;
  const sent = shouldSend
    ? await sendRitualAlphaAccessEmail(
        {
          email: input.row.email,
          referralCode: input.row.referralCode,
          statusToken: input.row.statusToken,
          confirmToken: input.row.confirmToken,
          name: input.name,
        },
        input.baseUrl,
      )
    : false;

  if (!wasUnlocked) {
    await db.insert(waitlistEvents).values({
      waitlistId: input.row.id,
      eventName: "open_spots_access_claimed",
      source: "arrival_ritual",
      metadata: {
        campaign: OPEN_SPOTS_CAMPAIGN,
        claim_source: "arrival_ritual_completed",
        segment: "ritual_complete",
      },
    });
    await db.insert(waitlistEvents).values({
      waitlistId: input.row.id,
      eventName: "ritual_alpha_access_granted",
      source: "arrival_ritual",
      metadata: {
        campaign: OPEN_SPOTS_CAMPAIGN,
        source: input.source,
      },
    });
  }

  if (shouldSend) {
    await db.insert(waitlistEvents).values({
      waitlistId: input.row.id,
      eventName: sent ? "ritual_alpha_access_email_sent" : "ritual_alpha_access_email_send_failed",
      source: "arrival_ritual",
      metadata: {
        provider: "resend",
        campaign: OPEN_SPOTS_CAMPAIGN,
        email_type: "ritual_alpha_access",
        success: sent,
      },
    });
  }

  return { accessGranted: !wasUnlocked, accessEmailSent: sent };
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = waitlistProfilePatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid profile" }, { status: 400 });
  }

  const values = profileValues(parsed.data);
  const fields = profileFieldNames(values);
  if (fields.length === 0) {
    return NextResponse.json({ error: "empty profile" }, { status: 400 });
  }

  const row = await findOrCreateWaitlistIdentity({
    statusToken: parsed.data.statusToken,
    email: parsed.data.email,
  });
  if (!row) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const now = new Date();
  await db
    .insert(waitlistProfile)
    .values({
      waitlistId: row.id,
      ...values,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: waitlistProfile.waitlistId,
      set: {
        ...values,
        updatedAt: now,
      },
    });

  await db.insert(waitlistEvents).values({
    waitlistId: row.id,
    eventName: "profile_updated",
    source: parsed.data.source ?? "unknown",
    metadata: { fields },
  });
  await captureAuroraServer("waitlist_profile_updated", `ref_${row.referralCode}`, {
    source: parsed.data.source ?? "unknown",
    referral_code: row.referralCode,
    fields: fields.join(","),
    field_count: fields.length,
  });

  const [profile] = await db
    .select({
      name: waitlistProfile.name,
      moment: waitlistProfile.moment,
      rhythm: waitlistProfile.rhythm,
      presence: waitlistProfile.presence,
      value: waitlistProfile.value,
    })
    .from(waitlistProfile)
    .where(eq(waitlistProfile.waitlistId, row.id))
    .limit(1);
  const complete = profile ? isProfileComplete(profile) : false;
  const ritualIntent = classifyRitualIntent(profile ?? values);
  const accessStatus = row.unlockedAt ? "active" : "no_access";
  const contact: LifecycleContactProperties = {
    waitlistId: row.id,
    email: row.email,
    firstName: profile?.name ?? values.name ?? null,
    ritualStatus: complete ? "completed" : "started",
    ritualIntent,
    accessStatus,
    lifecycleState: lifecycleStateFromSignals({
      ritualStatus: complete ? "completed" : "started",
      accessStatus,
    }),
    testerStatus: row.unlockedAt ? "tester" : "candidate",
  };

  await recordLifecycleEventOnce({
    row,
    eventName: complete ? "aurora.ritual.completed" : "aurora.ritual.started",
    source: "arrival_ritual",
    contact,
    metadata: {
      source: parsed.data.source ?? "unknown",
      field_count: fields.length,
      campaign: OPEN_SPOTS_CAMPAIGN,
    },
  });

  const access = complete
    ? await grantAccessAfterRitual({
        row,
        name: profile.name,
        source: parsed.data.source ?? "unknown",
        baseUrl: siteUrl(request.url),
      })
    : { accessGranted: false, accessEmailSent: false };

  if (access.accessGranted) {
    await recordLifecycleEventOnce({
      row,
      eventName: "aurora.access.granted",
      source: "arrival_ritual",
      contact: {
        ...contact,
        accessStatus: "active",
        lifecycleState: lifecycleStateFromSignals({
          ritualStatus: "completed",
          accessStatus: "active",
          hasAccount: false,
        }),
        testerStatus: "tester",
      },
      metadata: {
        campaign: OPEN_SPOTS_CAMPAIGN,
        access_email_sent: access.accessEmailSent,
      },
    });
  }

  return NextResponse.json({
    status: "ok",
    fields,
    complete,
    accessGranted: access.accessGranted,
    accessEmailSent: access.accessEmailSent,
    statusToken: row.statusToken,
    referralCode: row.referralCode,
  });
}
