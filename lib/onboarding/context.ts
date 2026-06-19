import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, waitlist, waitlistProfile } from "@/lib/db/schema";

export type OnboardingProfile = {
  name: string | null;
  moment: string | null;
  rhythm: string | null;
  presence: string | null;
  value: string | null;
};

export type OnboardingContext = {
  userId: string;
  email: string;
  completedAt: Date | null;
  profile: OnboardingProfile;
  completedFields: number;
  totalFields: number;
  completion: "empty" | "partial" | "complete";
  nextField: keyof OnboardingProfile | null;
};

const PROFILE_FIELDS: Array<keyof OnboardingProfile> = [
  "name",
  "presence",
  "moment",
  "rhythm",
  "value",
];

function clean(value: string | null | undefined) {
  const next = value?.trim() ?? "";
  return next ? next : null;
}

function nextMissing(profile: OnboardingProfile) {
  return PROFILE_FIELDS.find((field) => !profile[field]) ?? null;
}

export async function getOnboardingContext(userId: string, email: string): Promise<OnboardingContext> {
  const normalizedEmail = email.trim().toLowerCase();
  const [userRow] = await db
    .select({
      onboardingCompletedAt: users.onboardingCompletedAt,
      onboardingContext: users.onboardingContext,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const rows = await db
    .select({
      name: waitlistProfile.name,
      moment: waitlistProfile.moment,
      rhythm: waitlistProfile.rhythm,
      presence: waitlistProfile.presence,
      value: waitlistProfile.value,
    })
    .from(waitlist)
    .leftJoin(waitlistProfile, eq(waitlistProfile.waitlistId, waitlist.id))
    .where(eq(waitlist.email, normalizedEmail))
    .limit(1);

  const savedContext = (userRow?.onboardingContext ?? {}) as Partial<Record<keyof OnboardingProfile, unknown>>;
  const profile: OnboardingProfile = {
    name: clean(rows[0]?.name),
    moment: clean(rows[0]?.moment),
    rhythm: clean(rows[0]?.rhythm),
    presence: clean(rows[0]?.presence),
    value: clean(rows[0]?.value),
  };
  for (const field of PROFILE_FIELDS) {
    if (!profile[field] && typeof savedContext[field] === "string") {
      profile[field] = clean(savedContext[field]);
    }
  }
  const completedFields = PROFILE_FIELDS.filter((field) => Boolean(profile[field])).length;
  const completion =
    completedFields === 0
      ? "empty"
      : completedFields === PROFILE_FIELDS.length
        ? "complete"
        : "partial";

  return {
    userId,
    email: normalizedEmail,
    completedAt: userRow?.onboardingCompletedAt ?? null,
    profile,
    completedFields,
    totalFields: PROFILE_FIELDS.length,
    completion,
    nextField: nextMissing(profile),
  };
}

export function needsOnboarding(context: Pick<OnboardingContext, "completedAt">) {
  return !context.completedAt;
}
