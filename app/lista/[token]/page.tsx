import Link from "next/link";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { waitlist, waitlistProfile } from "@/lib/db/schema";
import { progressFor } from "@/lib/referral/milestones";
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
  return count === 1 ? "pessoa confirmada" : "pessoas confirmadas";
}

function nextGestureText(remaining: number, nextTitle?: string): string {
  const next = nextTitle ? ` para ${nextTitle.toLowerCase()}` : "";
  if (remaining <= 1) return `Falta só uma confirmação${next}.`;
  return `Faltam ${remaining} confirmações${next}.`;
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
          Cadastre seu email novamente para receber seu acesso antecipado por email.
        </p>
        <Link href="/#lista" className={styles.referralPrimary}>
          Receber acesso antecipado
        </Link>
      </section>
    </main>
  );
}

function ConfirmEmailPanel() {
  return (
    <div className={styles.referralConfirmPanel}>
      <span>Próximo passo</span>
      <strong>Confirme seu email para registrar seu acesso antecipado.</strong>
      <p>
        Depois da confirmação, você recebe seu link pessoal e acompanha os próximos passos da Aurora.
      </p>
      <p className={styles.referralConfirmHint}>
        As próximas liberações chegam por email. Deixe a Aurora na sua caixa principal para acompanhar tudo com calma.
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
    ? "Confirme seu email para registrar seu acesso antecipado."
    : "Seu acesso antecipado está registrado.";
  const body = !confirmed
    ? "O link de confirmação está na sua caixa de entrada. Depois desse clique, você acompanha os próximos passos e recebe as novidades da abertura por email."
    : hasReferrals
      ? `${profileName ? `${profileName}, s` : "S"}eu acesso antecipado está registrado. ${confirmedCount} ${pluralPessoa(confirmedCount)} chegaram pela sua indicação.`
      : `${profileName ? `${profileName}, s` : "S"}eu acesso antecipado está registrado. Agora você pode convidar pessoas queridas enquanto a Aurora prepara novas entradas.`;

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
          {!confirmed ? <div className={styles.referralOrb} aria-hidden="true" /> : null}
          <p className={styles.referralKicker}>{confirmed ? "Acesso antecipado" : "Confirmação por email"}</p>
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
                  <strong>Convidar pessoas queridas</strong>
                  <p>
                    Envie para uma pessoa querida. Quando ela confirma o email, a indicação entra no seu contador. As próximas liberações chegam por email.
                  </p>
                </div>
                <ShareInvite
                  referralCode={row.referralCode}
                  inviteUrl={inviteUrl}
                />
              </div>

              <div className={styles.referralProgressPanel}>
                <div className={styles.referralProgressCount}>
                  <strong>{confirmedCount}</strong>
                  <span>{pluralPessoa(confirmedCount)}</span>
                </div>
                <div className={styles.referralProgressCopy}>
                  <span>{progress.current ? "Marco atual" : "Primeiro marco"}</span>
                  <p>
                    {progress.current
                      ? progress.current.description
                      : "Com 5 confirmações, seu acesso antecipado fica mais perto."}
                  </p>
                  <div className={styles.referralTrack} aria-hidden="true">
                    <span style={{ width: `${Math.max(4, progress.ratio * 100)}%` }} />
                  </div>
                  <em>
                    {progress.next
                      ? nextGestureText(progress.remaining, progress.next.shortTitle)
                      : "Todos os marcos desta fase foram liberados."}
                  </em>
                </div>
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
