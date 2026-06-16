import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Orb } from "@/components/orb/Orb";
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
        <div className={styles.sun}>
          <Orb state="idle" decorative />
        </div>
        <div className={styles.card}>
          <h1 className={`font-serif ${styles.brand}`}>Aurora</h1>
          <p className={styles.tagline}>Um diário falado que reflete com você.</p>
          <LoginForm error={error} message={message} />
        </div>
      </div>
    </main>
  );
}
