"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, waitlist, waitlistProfile } from "@/lib/db/schema";
import { captureAuroraServer } from "@/lib/analytics/server";
import { createClient } from "@/lib/supabase/server";
import { getOnboardingContext, type OnboardingProfile } from "@/lib/onboarding/context";

const LIMITS: Record<keyof OnboardingProfile, number> = {
  name: 40,
  moment: 140,
  rhythm: 40,
  presence: 40,
  value: 160,
};

function clean(value: FormDataEntryValue | null, max: number) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, max);
}

function readPatch(formData: FormData) {
  const patch: Partial<OnboardingProfile> = {};
  (Object.keys(LIMITS) as Array<keyof OnboardingProfile>).forEach((field) => {
    const value = clean(formData.get(field), LIMITS[field]);
    if (value) patch[field] = value;
  });
  return patch;
}

async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

async function syncWaitlistProfile(email: string, patch: Partial<OnboardingProfile>) {
  const [row] = await db
    .select({ id: waitlist.id, referralCode: waitlist.referralCode })
    .from(waitlist)
    .where(eq(waitlist.email, email.trim().toLowerCase()))
    .limit(1);
  if (!row || Object.keys(patch).length === 0) return null;

  const now = new Date();
  await db
    .insert(waitlistProfile)
    .values({
      waitlistId: row.id,
      ...patch,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: waitlistProfile.waitlistId,
      set: {
        ...patch,
        updatedAt: now,
      },
    });

  return row.referralCode;
}

export async function completeOnboarding(formData: FormData) {
  const user = await currentUser();
  if (!user?.email) redirect("/login");

  const email = user.email.trim().toLowerCase();
  const intent = String(formData.get("intent") ?? "complete");
  const patch = readPatch(formData);
  const context = await getOnboardingContext(user.id, email);
  const nextContext = {
    ...context.profile,
    ...patch,
    skipped: intent === "skip",
    completed_from: "product_onboarding",
    completed_at: new Date().toISOString(),
  };

  const referralCode = intent === "skip" ? null : await syncWaitlistProfile(email, patch);
  const now = new Date();
  await db
    .update(users)
    .set({
      onboardingCompletedAt: now,
      onboardingContext: nextContext,
    })
    .where(eq(users.id, user.id));

  const distinctId = referralCode ? `ref_${referralCode}` : `user_${user.id}`;
  if (Object.keys(patch).length > 0) {
    await captureAuroraServer("product_onboarding_answered", distinctId, {
      source: "product_onboarding",
      fields: Object.keys(patch).join(","),
      field_count: Object.keys(patch).length,
    });
  }
  await captureAuroraServer(
    intent === "skip" ? "product_onboarding_skipped" : "product_onboarding_completed",
    distinctId,
    {
      source: "product_onboarding",
      completion: context.completion,
      completed_fields: context.completedFields,
    },
  );

  redirect("/diario");
}
