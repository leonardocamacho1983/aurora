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

  return <Validator email={user.email ?? ""} />;
}
