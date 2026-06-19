import Link from "next/link";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { waitlist, waitlistProfile } from "@/lib/db/schema";
import { MILESTONES, progressFor } from "@/lib/referral/milestones";
import { countConfirmedReferrals } from "@/lib/referral/waitlist";
import { referralUrl } from "@/lib/referral/urls";
import { InviteNameCapture } from "@/components/landing/InviteNameCapture";
import { ReferralHomeLink } from "@/components/landing/ReferralHomeLink";
import { ShareInvite } from "@/components/landing/ShareInvite";
import { TrackPageView } from "@/components/analytics/TrackPageView";
import styles from "@/components/landing/Landing.module.css";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ token: string }>;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const GMAIL_SEARCH_URL = "https://mail.google.com/mail/u/0/#search/Aurora";
const OUTLOOK_INBOX_URL = "https://outlook.live.com/mail/0/inbox";

function pluralPessoa(count: number): string {
  return count === 1 ? "pessoa entrou" : "pessoas entraram";
}

function nextGestureText(remaining: number): string {
  if (remaining <= 1) return "Falta só uma confirmação para o próximo marco.";
  return `Faltam ${remaining} confirmações para o próximo marco.`;
}

function firstName(name?: string | null): string {
  return (name ?? "").trim().split(/\s+/)[0] ?? "";
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

function ConfirmEmailPanel() {
  return (
    <div className={styles.referralConfirmPanel}>
      <span>Próximo passo</span>
      <strong>Abra o email da Aurora e confirme sua presença.</strong>
      <p>
        Esse clique ativa sua sala de convite e faz suas indicações começarem a contar.
      </p>
      <p className={styles.referralConfirmHint}>
        Se não aparecer, procure por Aurora ou veja a aba Promoções ou Spam.
      </p>
      <div className={styles.waitlistInboxActions}>
        <a href={GMAIL_SEARCH_URL} target="_blank" rel="noreferrer">
          Abrir Gmail
        </a>
        <a href={OUTLOOK_INBOX_URL} target="_blank" rel="noreferrer">
          Abrir Outlook
        </a>
      </div>
    </div>
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
  const profileRows = await db
    .select({ name: waitlistProfile.name })
    .from(waitlistProfile)
    .where(eq(waitlistProfile.waitlistId, row.id))
    .limit(1);
  const profileName = firstName(profileRows[0]?.name);
  const progress = progressFor(confirmedCount);
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || `${proto}://${host}`;
  const inviteUrl = referralUrl(row.referralCode, baseUrl);
  const confirmed = Boolean(row.confirmedAt);
  const hasReferrals = confirmedCount > 0;
  const title = !confirmed
    ? "Confirme seu email para ativar sua sala."
    : "Convide pessoas queridas para conhecer a Aurora.";
  const body = !confirmed
    ? "O link de confirmação está na sua caixa de entrada. Ele guarda seu lugar e ativa seus convites."
    : hasReferrals
      ? `${profileName ? `${profileName}, s` : "S"}eu lugar está confirmado. ${confirmedCount} ${pluralPessoa(confirmedCount)} pela sua indicação.`
      : `${profileName ? `${profileName}, s` : "S"}eu lugar está confirmado. O próximo gesto é compartilhar seu convite.`;

  return (
    <main className={styles.referralPage}>
      <TrackPageView
        eventName="referral_room_viewed"
        page="waitlist_room"
        category="referral"
        properties={{
          confirmed,
          confirmed_count: confirmedCount,
          referral_code: row.referralCode,
        }}
      />
      <section className={`${styles.referralShell} ${confirmed ? styles.referralShellReady : ""}`}>
        <div className={styles.referralIntro}>
          <div className={styles.referralOrb} aria-hidden="true" />
          <p className={styles.referralKicker}>Sua sala Aurora</p>
          <h1 className="font-serif">{title}</h1>
          <p>{body}</p>
        </div>

        <div className={styles.referralActionPanel}>
          {!confirmed ? (
            <ConfirmEmailPanel />
          ) : (
            <>
              <div className={styles.referralSharePanel}>
                <div className={styles.referralActionHeader}>
                  <span>Gesto principal</span>
                  <strong>Envie seu convite agora</strong>
                  <p>
                    Escolha uma pessoa querida. Quando ela confirma o email, seu acesso fica mais perto.
                  </p>
                </div>
                <ShareInvite
                  referralCode={row.referralCode}
                  inviteUrl={inviteUrl}
                />
              </div>

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
                    <span>Primeiro marco</span>
                    <strong>5 confirmações aproximam seu acesso</strong>
                    <p>Um jeito leve de trazer gente boa para perto e ajudar a Aurora amanhecer.</p>
                  </div>
                )}
              </div>

              <InviteNameCapture
                confirmed={confirmed}
                confirmedCount={confirmedCount}
                referralCode={row.referralCode}
                statusToken={row.statusToken}
              />

              <ReferralHomeLink
                confirmed={confirmed}
                confirmedCount={confirmedCount}
                referralCode={row.referralCode}
                statusToken={row.statusToken}
              />
            </>
          )}
          {!confirmed ? (
            <ReferralHomeLink
              confirmed={confirmed}
              confirmedCount={confirmedCount}
              referralCode={row.referralCode}
              statusToken={row.statusToken}
            />
          ) : null}
        </div>
      </section>
    </main>
  );
}
