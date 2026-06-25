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
  onboardingVariant: string | null;
  profile: OnboardingProfile;
  completedFields: number;
  totalFields: number;
  completion: "empty" | "partial" | "complete";
  nextField: keyof OnboardingProfile | null;
};

export const REQUIRED_ONBOARDING_VARIANT = "alpha";

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

type SavedOnboardingContext = Partial<Record<keyof OnboardingProfile, unknown>> & {
  onboarding_variant?: unknown;
};

export async function getOnboardingContext(userId: string, email: string): Promise<OnboardingContext> {
  const normalizedEmail = email.trim().toLowerCase();
  const [userRows, rows] = await Promise.all([
    db
      .select({
        onboardingCompletedAt: users.onboardingCompletedAt,
        onboardingContext: users.onboardingContext,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
    db
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
      .limit(1),
  ]);

  const userRow = userRows[0];
  const savedContext = (userRow?.onboardingContext ?? {}) as SavedOnboardingContext;
  const onboardingVariant =
    typeof savedContext.onboarding_variant === "string" ? savedContext.onboarding_variant : null;
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
    onboardingVariant,
    profile,
    completedFields,
    totalFields: PROFILE_FIELDS.length,
    completion,
    nextField: nextMissing(profile),
  };
}

export function needsOnboarding(context: Pick<OnboardingContext, "completedAt" | "onboardingVariant">) {
  return !context.completedAt || context.onboardingVariant !== REQUIRED_ONBOARDING_VARIANT;
}
