import { redirect } from "next/navigation";
import { analyticsEmailId } from "@/lib/analytics/server";
import { createClient } from "@/lib/supabase/server";
import { getOnboardingContext, needsOnboarding } from "@/lib/onboarding/context";
import { Diario } from "./Diario";

export const dynamic = "force-dynamic";

export default async function DiarioPage({
  searchParams,
}: {
  searchParams: Promise<{ continueEntryId?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const onboarding = await getOnboardingContext(user.id, user.email ?? "");
  if (needsOnboarding(onboarding)) {
    redirect("/boas-vindas");
  }

  return (
    <Diario
      userEmail={user.email ?? ""}
      onboarding={onboarding.profile}
      initialContinueEntryId={params.continueEntryId}
      analyticsId={analyticsEmailId(user.email ?? `user:${user.id}`)}
    />
  );
}
