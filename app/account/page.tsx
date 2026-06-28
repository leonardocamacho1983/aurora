import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProductNav } from "@/components/product/ProductNav";
import { getOnboardingContext } from "@/lib/onboarding/context";
import { signOut } from "../login/actions";
import styles from "./Account.module.css";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const onboarding = await getOnboardingContext(user.id, user.email ?? "");
  const signals = [
    onboarding.profile.name ? ["Nome", onboarding.profile.name] : null,
    onboarding.profile.presence ? ["Presença", onboarding.profile.presence] : null,
    onboarding.profile.moment ? ["Primeiro tema", onboarding.profile.moment] : null,
  ].filter(Boolean) as string[][];

  return (
    <main className={styles.stage}>
      <ProductNav active="account" context="Perfil" />
      <section className={styles.shell}>
        <div className={styles.copy}>
          <p className={styles.kicker}>Conta</p>
          <h1 className="font-serif">Seu acesso está ativo.</h1>
          <p className={styles.email}>{user.email}</p>
        </div>

        {signals.length > 0 && (
          <div className={styles.signals} aria-label="Sinais usados pela Aurora">
            {signals.map(([label, value]) => (
              <span key={label}>
                <small>{label}</small>
                {value}
              </span>
            ))}
          </div>
        )}

        <div className={styles.actions}>
          <Link href="/diario" className={styles.primary}>Voltar ao diário</Link>
          <Link href="/timeline" className={styles.secondary}>Linha do tempo</Link>
          <Link href="/fios" className={styles.secondary}>Fios</Link>
        </div>

        <form action={signOut}>
          <button className={styles.signOut} type="submit">
            Sair
          </button>
        </form>
      </section>
    </main>
  );
}
