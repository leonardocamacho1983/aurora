"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { absoluteUrl } from "@/lib/seo/site";
import { createClient } from "@/lib/supabase/server";
import { hasAuroraAccess } from "@/lib/waitlist/open-spots-campaign";
import { db } from "@/lib/db";
import { waitlist, waitlistProfile } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { classifyRitualIntent } from "@/lib/email/ritual-intent";
import { lifecycleStateFromSignals } from "@/lib/email/lifecycle-contract";
import { recordAuroraLifecycleEvent } from "@/lib/email/lifecycle-events";

// Mensagens de erro do Supabase → pt-BR amigável.
function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email ou senha incorretos.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Esse email já tem conta. Tente entrar.";
  if (m.includes("password should be at least"))
    return "A senha precisa de pelo menos 6 caracteres.";
  if (m.includes("rate limit") || m.includes("over email send rate limit"))
    return "Voce pediu ha pouco. Espere alguns minutos e tente de novo.";
  if (m.includes("unable to validate email") || m.includes("invalid email"))
    return "Email inválido.";
  return message;
}

async function currentOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  if (!host) return null;

  const proto = headerStore.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

async function recoveryRedirectTo() {
  const origin = await currentOrigin();
  const url = new URL(origin ? "/auth/callback" : absoluteUrl("/auth/callback"), origin ?? undefined);
  url.searchParams.set("next", "/login/redefinir-senha");
  return url.toString();
}

function profileComplete(profile: {
  moment: string | null;
  rhythm: string | null;
  presence: string | null;
  value: string | null;
} | null) {
  return Boolean(
    profile?.moment?.trim() &&
      profile.rhythm?.trim() &&
      profile.presence?.trim() &&
      profile.value?.trim(),
  );
}

async function recordAccountCreated(email: string) {
  const [row] = await db
    .select({
      id: waitlist.id,
      email: waitlist.email,
      unlockedAt: waitlist.unlockedAt,
      name: waitlistProfile.name,
      moment: waitlistProfile.moment,
      rhythm: waitlistProfile.rhythm,
      presence: waitlistProfile.presence,
      value: waitlistProfile.value,
    })
    .from(waitlist)
    .leftJoin(waitlistProfile, eq(waitlistProfile.waitlistId, waitlist.id))
    .where(eq(waitlist.email, email))
    .limit(1);

  if (!row) return;

  const ritualStatus = profileComplete(row) ? "completed" : row.moment || row.rhythm || row.presence || row.value ? "started" : "not_started";
  const accessStatus = row.unlockedAt ? "active" : "no_access";

  await recordAuroraLifecycleEvent({
    waitlistId: row.id,
    eventName: "aurora.account.created",
    source: "login_signup",
    contact: {
      waitlistId: row.id,
      email: row.email,
      firstName: row.name,
      ritualStatus,
      ritualIntent: classifyRitualIntent(row),
      accessStatus,
      lifecycleState: lifecycleStateFromSignals({
        ritualStatus,
        accessStatus,
        hasAccount: true,
        hasEntry: false,
      }),
      testerStatus: accessStatus === "active" ? "tester" : "candidate",
    },
  });
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(friendly(error.message))}`);
  }
  redirect("/boas-vindas");
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!(await hasAuroraAccess(email))) {
    redirect("/login?message=limited-access");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(friendly(error.message))}`);
  }
  await recordAccountCreated(email);
  // Confirmação de email desativada → já vem com sessão → entra direto.
  if (data.session) {
    redirect("/boas-vindas");
  }
  redirect("/login?message=check-email");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    redirect(`/login?error=${encodeURIComponent("Informe seu email para recuperar o acesso.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: await recoveryRedirectTo(),
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(friendly(error.message))}`);
  }

  redirect("/login?message=reset-email-sent");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
