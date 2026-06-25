import { after } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { captureAuroraServer } from "@/lib/analytics/server";
import { getOnboardingContext, needsOnboarding } from "@/lib/onboarding/context";
import { OnboardingAlphaSlides } from "./OnboardingAlphaSlides";
import { completeOnboarding } from "./actions";
import styles from "./BoasVindas.module.css";

export const dynamic = "force-dynamic";

const ALPHA_PREPARATION_STEPS = "voice_diary,privacy,first_entry,first_reflection";
const ALPHA_SLIDE_KEYS = ["voice", "not_chat", "privacy", "reflection"] as const;
const LOCAL_PREVIEW_ENABLED = process.env.NODE_ENV !== "production";

function stepFromParam(step?: string) {
  const parsed = Number.parseInt(step ?? "1", 10);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(Math.max(parsed, 1), ALPHA_SLIDE_KEYS.length) - 1;
}

export default async function BoasVindasPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string; step?: string }>;
}) {
  const params = await searchParams;
  const activeStep = stepFromParam(params.step);
  const isLocalPreview = LOCAL_PREVIEW_ENABLED && params.preview === "1";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    redirect("/login");
  }

  const context = await getOnboardingContext(user.id, user.email);
  if (!isLocalPreview && !needsOnboarding(context)) {
    redirect("/diario");
  }

  const firstName = context.profile.name?.split(" ")[0] ?? "";
  const hasRitualSignal = Boolean(context.profile.name || context.profile.presence || context.profile.moment);
  const analyticsId = `user_${user.id}`;

  if (!isLocalPreview) {
    after(async () => {
      await Promise.all([
        captureAuroraServer("product_onboarding_viewed", analyticsId, {
          source: "product_onboarding_alpha",
          variant: "alpha",
          first_value_goal: "first_reflection",
          preparation_steps: ALPHA_PREPARATION_STEPS,
          completion: context.completion,
          completed_fields: context.completedFields,
          alpha_ready: hasRitualSignal,
        }),
        captureAuroraServer("product_onboarding_step_viewed", analyticsId, {
          source: "product_onboarding_alpha",
          variant: "alpha",
          first_value_goal: "first_reflection",
          step: ALPHA_SLIDE_KEYS[activeStep],
          has_onboarding_moment: Boolean(context.profile.moment),
        }),
      ]);
    });
  }

  return (
    <main className={styles.stage}>
      <section className={styles.shell}>
        <a className={styles.brand} href="/">
          <span aria-hidden="true" />
          Aurora
        </a>

        <OnboardingAlphaSlides
          active={activeStep}
          analyticsId={analyticsId}
          firstName={firstName}
          finalPrimaryAction={
            <form action={completeOnboarding} className={styles.finalActionForm}>
              <button className={styles.primary} name="intent" type="submit" value="complete">
                Começar a experiência Aurora
              </button>
            </form>
          }
          hasRitualSignal={hasRitualSignal}
          hasOnboardingMoment={Boolean(context.profile.moment)}
          previewMode={isLocalPreview}
          ritualMoment={context.profile.moment}
        />
      </section>
    </main>
  );
}
