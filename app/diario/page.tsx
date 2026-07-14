import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { entries } from "@/lib/db/schema";
import { getOnboardingContext, needsOnboarding } from "@/lib/onboarding/context";
import { hasAuroraAccess } from "@/lib/waitlist/open-spots-campaign";
import { Diario } from "./Diario";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type DiarioSearchParams = {
  continueEntryId?: string;
};

export default async function DiarioPage({
  searchParams,
}: {
  searchParams: Promise<DiarioSearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.email || !(await hasAuroraAccess(user.email))) {
    await supabase.auth.signOut();
    redirect("/login?message=limited-access");
  }

  const onboarding = await getOnboardingContext(user.id, user.email ?? "");
  if (needsOnboarding(onboarding)) {
    redirect("/boas-vindas");
  }

  let continueEntryId: string | undefined;
  const requestedEntryId = params.continueEntryId;
  if (requestedEntryId && UUID_RE.test(requestedEntryId)) {
    const [entry] = await db
      .select({ id: entries.id })
      .from(entries)
      .where(and(eq(entries.id, requestedEntryId), eq(entries.userId, user.id)))
      .limit(1);
    continueEntryId = entry?.id;
  }

  return (
    <Diario
      userEmail={user.email ?? ""}
      onboarding={onboarding.profile}
      initialEntryId={continueEntryId}
      initialEntryMode={continueEntryId ? "continue" : "new"}
    />
  );
}
