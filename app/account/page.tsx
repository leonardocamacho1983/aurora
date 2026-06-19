import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
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

  return (
    <main className={styles.stage}>
      <section className={styles.card}>
        <Link href="/diario" className={styles.brand}>
          <span className={styles.brandOrb} aria-hidden="true" />
          <span>Aurora</span>
        </Link>
        <p className={styles.kicker}>Conta</p>
        <h1 className="font-serif">Seu acesso está ativo.</h1>
        <p className={styles.email}>{user.email}</p>
        <div className={styles.actions}>
          <Link href="/diario" className={styles.primary}>Voltar ao diário</Link>
          <Link href="/timeline" className={styles.secondary}>Linha do tempo</Link>
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
