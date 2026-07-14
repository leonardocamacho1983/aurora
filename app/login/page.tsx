import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";
import styles from "./Login.module.css";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; mode?: string }>;
}) {
  const { error, message, mode } = await searchParams;

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

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.kicker}>Diário por voz com IA</span>
            <h1 className="font-serif">Entre na Aurora.</h1>
            <p>Retome seu diário e continue de onde parou.</p>
          </div>
          <LoginForm error={error} message={message} initialMode={mode === "signup" ? "signup" : "signin"} />
        </div>
      </div>
    </main>
  );
}
