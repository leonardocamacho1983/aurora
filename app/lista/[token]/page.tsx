import Link from "next/link";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { waitlist } from "@/lib/db/schema";
import { MILESTONES, progressFor } from "@/lib/referral/milestones";
import { countConfirmedReferrals } from "@/lib/referral/waitlist";
import { referralUrl } from "@/lib/referral/urls";
import { ShareInvite } from "@/components/landing/ShareInvite";
import styles from "@/components/landing/Landing.module.css";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ token: string }>;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function pluralPessoa(count: number): string {
  return count === 1 ? "pessoa confirmou" : "pessoas confirmaram";
}

function InvalidState() {
  return (
    <main className={styles.referralPage}>
      <section className={styles.referralShell}>
        <div className={styles.referralOrb} aria-hidden="true" />
        <p className={styles.referralKicker}>Aurora</p>
        <h1 className="font-serif">Não encontramos esse link.</h1>
        <p>
          Entre na lista novamente para receber seu acesso pessoal por email.
        </p>
        <Link href="/#lista" className={styles.referralPrimary}>
          Entrar na lista
        </Link>
      </section>
    </main>
  );
}

export default async function WaitlistStatusPage({ params }: Props) {
  const { token } = await params;
  if (!UUID.test(token)) return <InvalidState />;

  const rows = await db
    .select()
    .from(waitlist)
    .where(eq(waitlist.statusToken, token))
    .limit(1);

  const row = rows[0];
  if (!row) return <InvalidState />;

  const confirmedCount = await countConfirmedReferrals(db, row.referralCode);
  const progress = progressFor(confirmedCount);
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || `${proto}://${host}`;
  const inviteUrl = referralUrl(row.referralCode, baseUrl);
  const confirmed = Boolean(row.confirmedAt);

  return (
    <main className={styles.referralPage}>
      <section className={styles.referralShell}>
        <div className={styles.referralOrb} aria-hidden="true" />
        <p className={styles.referralKicker}>Sua sala Aurora</p>
        <h1 className="font-serif">
          {confirmed
            ? "Seu convite já está vivo."
            : "Confirme seu email para ativar seu convite."}
        </h1>
        <p>
          {confirmed
            ? `${confirmedCount} ${pluralPessoa(confirmedCount)} pelo seu link. Continue chamando pessoas que também precisam se ouvir.`
            : "Enviamos um email de confirmação. Depois disso, seus convites passam a contar."}
        </p>

        <div className={styles.referralProgressCard}>
          <div className={styles.referralProgressTop}>
            <span>{confirmedCount} confirmados</span>
            <span>
              {progress.next
                ? `faltam ${progress.remaining} para ${progress.next.shortTitle}`
                : "todos os marcos desbloqueados"}
            </span>
          </div>
          <div className={styles.referralTrack} aria-hidden="true">
            <span style={{ width: `${Math.max(4, progress.ratio * 100)}%` }} />
          </div>
          <div className={styles.referralMilestones}>
            {MILESTONES.map((m) => (
              <div
                key={m.count}
                className={`${styles.referralMilestone} ${confirmedCount >= m.count ? styles.referralMilestoneDone : ""}`}
              >
                <span>{m.count}</span>
                <strong>{m.shortTitle}</strong>
              </div>
            ))}
          </div>
        </div>

        {progress.current ? (
          <div className={styles.referralCelebration}>
            <span>Marco desbloqueado</span>
            <strong>{progress.current.title}</strong>
            <p>{progress.current.description}</p>
          </div>
        ) : (
          <div className={styles.referralCelebration}>
            <span>Próximo gesto</span>
            <strong>Indique 5 pessoas confirmadas</strong>
            <p>Esse primeiro marco libera seu acesso antes da fila comum.</p>
          </div>
        )}

        <ShareInvite referralCode={row.referralCode} inviteUrl={inviteUrl} />

        <Link href="/#lista" className={styles.referralSecondary}>
          Voltar para a landing
        </Link>
      </section>
    </main>
  );
}
