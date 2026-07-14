"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { absoluteUrl } from "@/lib/seo/site";
import { createClient } from "@/lib/supabase/server";
import { hasAuroraAccess } from "@/lib/waitlist/open-spots-campaign";

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
