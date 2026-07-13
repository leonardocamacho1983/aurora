import Link from "next/link";
import { redirect } from "next/navigation";
import { TrackPageView } from "@/components/analytics/TrackPageView";
import { BottomNav } from "@/components/product/BottomNav";
import { createClient } from "@/lib/supabase/server";
import { getOnboardingContext } from "@/lib/onboarding/context";
import { saveAccountContext } from "../actions";
import { MomentReviewFlow } from "./MomentReviewFlow";
import styles from "./Momento.module.css";

export const dynamic = "force-dynamic";

export default async function AccountMomentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const context = await getOnboardingContext(user.id, user.email);

  return (
    <main className={styles.stage}>
      <TrackPageView
        eventName="account_moment_viewed"
        page="account_moment"
        category="account"
        properties={{
          surface: "account",
          completion: context.completion,
          completed_fields: context.completedFields,
        }}
      />
      <section className={styles.shell}>
        <Link href="/account" className={styles.brand}>
          <span className={styles.brandOrb} aria-hidden="true" />
          <span>Aurora</span>
        </Link>

        <MomentReviewFlow
          action={saveAccountContext}
          initialProfile={context.profile}
          completion={context.completion}
        />
      </section>
      <BottomNav active="perfil" />
    </main>
  );
}
