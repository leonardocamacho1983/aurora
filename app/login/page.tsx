import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";
import styles from "./Login.module.css";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  // Já logado → vai direto pro diário.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect("/diario");
  }

  return (
    <main className={styles.stage}>
      <div className={styles.shell}>
        <div className={styles.brandLine}>
          <span className={styles.brandOrb} aria-hidden="true" />
          <span className={`font-serif ${styles.brandName}`}>Aurora</span>
        </div>

        <div className={styles.story}>
          <span className={styles.kicker}>Diário por voz com IA</span>
          <h1 className="font-serif">Entre com calma.</h1>
          <p>
            Use o mesmo email da lista para guardar seus registros, voltar ao seu diário e
            acompanhar o que a Aurora percebe com você.
          </p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.kicker}>Sua Aurora</span>
            <h2 className="font-serif">Acesse seu espaço.</h2>
            <p>Crie uma conta ou entre para continuar de onde parou.</p>
          </div>
          <LoginForm error={error} message={message} />
        </div>
      </div>
    </main>
  );
}
