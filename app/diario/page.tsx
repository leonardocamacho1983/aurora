import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOnboardingContext, needsOnboarding } from "@/lib/onboarding/context";
import { Diario } from "./Diario";

export const dynamic = "force-dynamic";

export default async function DiarioPage() {
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

  return <Diario userEmail={user.email ?? ""} onboarding={onboarding.profile} />;
}
