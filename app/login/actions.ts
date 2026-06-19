"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Mensagens de erro do Supabase → pt-BR amigável.
function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email ou senha incorretos.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Esse email já tem conta. Tente entrar.";
  if (m.includes("password should be at least"))
    return "A senha precisa de pelo menos 6 caracteres.";
  if (m.includes("unable to validate email") || m.includes("invalid email"))
    return "Email inválido.";
  return message;
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(friendly(error.message))}`);
  }
  redirect("/boas-vindas");
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

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

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
