import Link from "next/link";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { waitlist } from "@/lib/db/schema";
import { MILESTONES, progressFor } from "@/lib/referral/milestones";
import { countConfirmedReferrals } from "@/lib/referral/waitlist";
import { referralUrl } from "@/lib/referral/urls";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { InviteNameCapture } from "@/components/landing/InviteNameCapture";
import { ReferralHomeLink } from "@/components/landing/ReferralHomeLink";
import { ShareInvite } from "@/components/landing/ShareInvite";
import styles from "@/components/landing/Landing.module.css";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ token: string }>;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function pluralPessoa(count: number): string {
  return count === 1 ? "pessoa entrou" : "pessoas entraram";
}

function nextGestureText(remaining: number): string {
  if (remaining <= 1) return "Falta só uma confirmação para o próximo marco.";
  return `Faltam ${remaining} confirmações para o próximo marco.`;
}

const referralJourneyLinks = [
  { href: "/metodo", label: "Método", note: "como a Aurora escolhe o começo" },
  { href: "/diario-por-voz", label: "Diário por voz", note: "por que falar ajuda" },
  { href: "/manifesto", label: "Manifesto", note: "a luz por trás do produto" },
];

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
  const hasReferrals = confirmedCount > 0;
  const title = !confirmed
    ? "Confirme seu email para guardar seu lugar."
    : hasReferrals
      ? "Seu convite já começou a amanhecer."
      : "Seu acesso está confirmado.";
  const body = !confirmed
    ? "Enviamos um email de confirmação. Depois disso, seu convite passa a contar."
    : hasReferrals
      ? `${confirmedCount} ${pluralPessoa(confirmedCount)} pela sua indicação. Continue trazendo pessoas queridas para conhecer a Aurora.`
      : "A Aurora vai avisar quando chegar sua vez. Você também pode trazer pessoas queridas para conhecer a Aurora e desbloquear acesso antecipado e cortesias.";

  return (
    <main className={styles.referralPage}>
      <section className={styles.referralShell}>
        <div className={styles.referralIntro}>
          <div className={styles.referralOrb} aria-hidden="true" />
          <p className={styles.referralKicker}>Sua sala Aurora</p>
          <h1 className="font-serif">{title}</h1>
          <p>{body}</p>
        </div>

        <div className={styles.referralActionPanel}>
          <InviteNameCapture
            confirmed={confirmed}
            confirmedCount={confirmedCount}
            statusToken={row.statusToken}
          />

          <div className={styles.referralDashboard}>
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
              <p className={styles.referralProgressHint}>
                {progress.next
                  ? nextGestureText(progress.remaining)
                  : "Todos os marcos desta fase foram liberados."}
              </p>
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
                <span>{confirmed ? "Próximo gesto" : "Depois de confirmar"}</span>
                <strong>Leve a Aurora para 5 pessoas queridas</strong>
                <p>Quando 5 convites forem confirmados, seu acesso amanhece antes.</p>
              </div>
            )}
          </div>

          <div className={styles.referralSharePanel}>
            <div className={styles.referralJourneyStrip} aria-label="Explore a Aurora">
              {referralJourneyLinks.map((link) => (
                <TrackedLink
                  key={link.href}
                  href={link.href}
                  className={styles.referralJourneyCard}
                  eventProperties={{ source: "referral_room_journey", label: link.label }}
                >
                  <span>{link.label}</span>
                  <small>{link.note}</small>
                </TrackedLink>
              ))}
            </div>

            <details className={styles.referralJourneyDisclosure}>
              <summary>Explorar a Aurora</summary>
              <div>
                {referralJourneyLinks.map((link) => (
                  <TrackedLink
                    key={link.href}
                    href={link.href}
                    className={styles.referralJourneyCard}
                    eventProperties={{ source: "referral_room_journey_mobile", label: link.label }}
                  >
                    <span>{link.label}</span>
                    <small>{link.note}</small>
                  </TrackedLink>
                ))}
              </div>
            </details>

            <ShareInvite
              referralCode={row.referralCode}
              inviteUrl={inviteUrl}
              label="Seu convite para pessoas queridas"
            />
            <ReferralHomeLink
              confirmed={confirmed}
              confirmedCount={confirmedCount}
              statusToken={row.statusToken}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
