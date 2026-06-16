import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Validator } from "./Validator";

export const dynamic = "force-dynamic";

/**
 * Tela de validação (smoke test) — FERRAMENTA DE DEBUG, não é produto.
 * Tem botão de disparar crise, então NÃO pode aparecer em produção pública:
 *  - bloqueada quando VERCEL_ENV === "production" (404);
 *  - exige sessão Supabase.
 * Para remover depois: basta apagar a pasta app/validar/.
 */
export default async function ValidarPage() {
  if (process.env.VERCEL_ENV === "production") {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Diagnóstico: o servidor (onde as rotas rodam) enxerga estas variáveis?
  // Só presença (✅/❌) — nunca o valor.
  const env = {
    VERCEL_ENV: process.env.VERCEL_ENV ?? "(local)",
    ANTHROPIC_API_KEY: Boolean(process.env.ANTHROPIC_API_KEY),
    OPENAI_API_KEY: Boolean(process.env.OPENAI_API_KEY),
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    DIRECT_URL: Boolean(process.env.DIRECT_URL),
    POSTGRES_URL: Boolean(process.env.POSTGRES_URL),
    POSTGRES_URL_NON_POOLING: Boolean(process.env.POSTGRES_URL_NON_POOLING),
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  };

  return <Validator email={user.email ?? ""} env={env} />;
}
