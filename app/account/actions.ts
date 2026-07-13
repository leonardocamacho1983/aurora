"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, waitlist, waitlistProfile } from "@/lib/db/schema";
import { recordProductEvent } from "@/lib/analytics/product-events";
import { createClient } from "@/lib/supabase/server";
import { getOnboardingContext, type OnboardingProfile } from "@/lib/onboarding/context";

const LIMITS: Record<keyof OnboardingProfile, number> = {
  name: 40,
  moment: 160,
  rhythm: 80,
  presence: 40,
  value: 160,
};

function clean(value: FormDataEntryValue | null, max: number) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, max);
}

function readContextPatch(formData: FormData) {
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
    .select({ id: waitlist.id })
    .from(waitlist)
    .where(eq(waitlist.email, email.trim().toLowerCase()))
    .limit(1);
  if (!row || Object.keys(patch).length === 0) return;

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
}

export async function saveAccountContext(formData: FormData) {
  const user = await currentUser();
  if (!user?.email) redirect("/login");

  const patch = readContextPatch(formData);
  if (Object.keys(patch).length === 0) {
    redirect("/account");
  }

  const email = user.email.trim().toLowerCase();
  const source = formData.get("source") === "account_moment" ? "account_moment" : "account_profile";
  const context = await getOnboardingContext(user.id, email);
  const nextContext = {
    ...context.profile,
    ...patch,
    updated_from: source,
    updated_at: new Date().toISOString(),
  };
  const completedFields = Object.keys(patch).join(",");

  await Promise.all([
    db
      .update(users)
      .set({
        onboardingContext: nextContext,
      })
      .where(eq(users.id, user.id)),
    syncWaitlistProfile(email, patch),
    recordProductEvent({
      userId: user.id,
      eventName: source === "account_moment" ? "account_moment_saved" : "account_context_saved",
      source,
      distinctId: `user_${user.id}`,
      capturePostHog: true,
      metadata: {
        surface: "account",
        completed_fields: completedFields,
        field_count: Object.keys(patch).length,
        has_name: Boolean(patch.name),
        has_moment: Boolean(patch.moment),
        has_presence: Boolean(patch.presence),
        has_rhythm: Boolean(patch.rhythm),
        has_value: Boolean(patch.value),
      },
    }),
  ]);

  revalidatePath("/account");
  revalidatePath("/account/momento");
  redirect("/account");
}
