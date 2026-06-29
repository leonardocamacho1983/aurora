import Link from "next/link";
import { ResetPasswordForm } from "./ResetPasswordForm";
import styles from "../Login.module.css";

export const dynamic = "force-dynamic";

export default function RedefinirSenhaPage() {
  return (
    <main className={styles.stage}>
      <div className={styles.shell}>
        <Link href="/" className={styles.brandLine}>
          <span className={styles.brandOrb} aria-hidden="true" />
          <span className={`font-serif ${styles.brandName}`}>Aurora</span>
        </Link>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.kicker}>Recuperar acesso</span>
            <h1 className="font-serif">Nova senha.</h1>
            <p>Crie uma senha para voltar ao seu diario.</p>
          </div>
          <ResetPasswordForm />
        </div>
      </div>
    </main>
  );
}
