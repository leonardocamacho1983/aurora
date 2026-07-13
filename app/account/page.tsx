import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { TrackPageView } from "@/components/analytics/TrackPageView";
import { BottomNav } from "@/components/product/BottomNav";
import { ProductNav } from "@/components/product/ProductNav";
import { db } from "@/lib/db";
import { waitlist } from "@/lib/db/schema";
import { getProfileDashboard, profileSinceLine } from "@/lib/account/profile-dashboard";
import { accountProfileView, fieldLabel } from "@/lib/account/profile-state";
import { referralUrl } from "@/lib/referral/urls";
import { createClient } from "@/lib/supabase/server";
import { getOnboardingContext } from "@/lib/onboarding/context";
import { signOut } from "../login/actions";
import { ProfileInvitePrompt } from "./ProfileInvitePrompt";
import { ProfileMoodTabs } from "./ProfileMoodTabs";
import styles from "./Account.module.css";

export const dynamic = "force-dynamic";

function displayName(input: {
  accountName: string | null;
  onboardingName: string | null;
  email: string;
}) {
  const fromName = input.onboardingName?.trim() || input.accountName?.trim();
  if (fromName) return fromName;
  const prefix = input.email.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  return prefix || "Você";
}

function initials(name: string) {
  const clean = name.trim();
  if (!clean) return "A";
  const parts = clean.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "A";
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return `${first}${second}`.toUpperCase();
}

async function getReferralState(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return null;

  const [row] = await db
    .select({
      referralCode: waitlist.referralCode,
    })
    .from(waitlist)
    .where(eq(waitlist.email, normalizedEmail))
    .limit(1);

  if (!row) return null;

  return {
    referralCode: row.referralCode,
    inviteUrl: referralUrl(row.referralCode),
  };
}

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userEmail = user.email ?? "";
  const [dashboard, onboarding, referral] = await Promise.all([
    getProfileDashboard(user.id),
    getOnboardingContext(user.id, userEmail),
    getReferralState(userEmail),
  ]);
  const name = displayName({
    accountName: dashboard.account.name,
    onboardingName: onboarding.profile.name,
    email: userEmail,
  });
  const sinceLine = profileSinceLine({
    createdAt: dashboard.account.createdAt,
    firstEntryAt: dashboard.firstEntryAt,
    entryCount: dashboard.entryCount,
  });
  const profileView = accountProfileView(onboarding, {
    entryCount: dashboard.entryCount,
    lastEntryAt: dashboard.lastEntryAt,
  });
  const momentUpdatedLabel =
    profileView.updatedLabel === "Ainda não revisado"
      ? "ainda em aberto"
      : `revisto em ${profileView.updatedLabel}`;
  const spokenDaysLabel =
    dashboard.activeDays30 === 1
      ? "1 dia com a Aurora este mês"
      : `${dashboard.activeDays30} dias com a Aurora este mês`;
  const presenceLead =
    dashboard.entryCount > 0
      ? "Alguns dias você falou, outros não. Cada um no seu tempo — nada aqui é para completar."
      : "Quando você fizer seu primeiro registro, seus dias de fala aparecem aqui com calma.";

  return (
    <main className={styles.stage}>
      <TrackPageView
        eventName="account_viewed"
        page="account"
        category="account"
        properties={{
          surface: "account",
          has_referral: Boolean(referral),
          entry_count: dashboard.entryCount,
          continued_conversation_count: dashboard.latestContinuedConversation?.totalContinuedConversations ?? 0,
        }}
      />

      <ProductNav active="perfil" />

      <header className={styles.mobileTop}>
        <Link className={styles.brand} href="/diario" aria-label="Aurora, ir para o Diário">
          <span className={styles.brandMark} aria-hidden="true" />
          <span className={styles.brandName}>Aurora</span>
        </Link>
      </header>

      <div className={styles.shell}>
        <div className={styles.pageHead}>
          <h1>Perfil</h1>
          <p>Seu espaço, do seu jeito. Aqui você se vê ao longo do tempo.</p>
        </div>

        <section className={styles.card} aria-label="Identidade">
          <div className={styles.identity}>
            <div className={styles.avatar} aria-hidden="true">{initials(name)}</div>
            <div className={styles.identityCopy}>
              <div className={styles.identityName}>{name}</div>
              <div className={styles.identitySince}>{sinceLine}</div>
            </div>
          </div>
        </section>

        <section className={`${styles.card} ${styles.block} ${styles.momentCard}`} aria-labelledby="profile-moment-title">
          <div className={styles.blockHead}>
            <div>
              <span className={styles.momentEyebrow}>{profileView.completionLabel}</span>
              <h2 className={styles.blockTitle} id="profile-moment-title">Meu momento</h2>
            </div>
            <span className={styles.blockNote}>{momentUpdatedLabel}</span>
          </div>
          <h3 className={styles.momentTitle}>{profileView.title}</h3>
          <p className={styles.momentBody}>{profileView.body}</p>

          <div className={styles.contextGrid} aria-label="Contexto salvo no perfil">
            {profileView.filledFields.length > 0 ? (
              <div>
                <span className={styles.contextLabel}>Já salvo</span>
                <div className={styles.contextChips}>
                  {profileView.filledFields.map((field) => (
                    <span className={styles.contextChip} key={field}>{fieldLabel(field)}</span>
                  ))}
                </div>
              </div>
            ) : null}
            {profileView.missingFields.length > 0 ? (
              <div>
                <span className={styles.contextLabel}>Pode ajustar depois</span>
                <div className={styles.contextChips}>
                  {profileView.missingFields.map((field) => (
                    <span className={`${styles.contextChip} ${styles.contextChipQuiet}`} key={field}>{fieldLabel(field)}</span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className={styles.buttonRow}>
            <Link className={`${styles.btn} ${styles.btnPrimary}`} href="/account/momento">
              {profileView.ctaLabel}
            </Link>
          </div>
        </section>

        <section className={`${styles.card} ${styles.block}`} aria-label="Presença">
          <div className={styles.blockHead}>
            <h2 className={styles.blockTitle}>Sua presença</h2>
            <span className={styles.blockNote}>Últimos 30 dias</span>
          </div>
          <p className={styles.presenceLead}>{presenceLead}</p>
          <div
            className={styles.presenceGrid}
            role="img"
            aria-label={`${dashboard.activeDays30} dos últimos 30 dias tiveram uma conversa com a Aurora`}
          >
            {dashboard.presenceDays.map((day) => (
              <span
                className={`${styles.day} ${day.spoke ? styles.spoke : ""} ${day.today ? styles.today : ""}`}
                key={day.key}
                title={day.label}
              />
            ))}
          </div>
          <div className={styles.presenceFoot}>
            <span className={styles.legendDay}><i className={styles.spokeLegend} /> dia em que você falou</span>
            <span className={styles.legendDay}><i className={styles.silentLegend} /> dia em silêncio</span>
            <span>{spokenDaysLabel}</span>
          </div>
        </section>

        <section className={`${styles.card} ${styles.block}`} aria-label="Humores ao longo do tempo">
          <div className={styles.blockHead}>
            <h2 className={styles.blockTitle}>Humores ao longo do tempo</h2>
            <ProfileMoodTabs periods={dashboard.moodPeriods} />
          </div>
        </section>

        <section className={`${styles.card} ${styles.block}`} aria-label="Última conversa retomada">
          <div className={styles.blockHead}>
            <h2 className={styles.blockTitle}>Última conversa retomada</h2>
            <span className={styles.blockNote}>mais recente</span>
          </div>
          <p className={styles.sectionLead}>Aparece aqui quando você volta a um assunto em mais de um momento.</p>

          {dashboard.latestContinuedConversation ? (
            <article className={styles.thread}>
              <div className={styles.threadTop}>
                <h3 className={styles.threadTitle}>{dashboard.latestContinuedConversation.title}</h3>
                <span className={styles.threadMeta}>{dashboard.latestContinuedConversation.meta}</span>
              </div>
              <p className={styles.threadReflect}>{dashboard.latestContinuedConversation.quote}</p>
              <Link className={styles.continue} href={dashboard.latestContinuedConversation.continueHref}>
                Continuar essa conversa <span aria-hidden="true">→</span>
              </Link>
              {dashboard.latestContinuedConversation.totalContinuedConversations > 1 ? (
                <p className={styles.threadHint}>
                  Outras conversas retomadas ficam na <Link className={styles.inlineLink} href="/timeline">Timeline</Link>.
                </p>
              ) : null}
            </article>
          ) : (
            <p className={styles.emptyState}>Quando uma conversa voltar, ela aparece aqui para você continuar sem recontar tudo.</p>
          )}
        </section>

        {referral ? (
          <ProfileInvitePrompt referralCode={referral.referralCode} inviteUrl={referral.inviteUrl} />
        ) : null}

        <div className={styles.zoneSep}>
          <span className={styles.zoneLabel}>Conta e dados</span>
        </div>

        <section className={`${styles.card} ${styles.block}`} aria-label="Privacidade e dados">
          <div className={styles.blockHead}>
            <h2 className={styles.blockTitle}>Privacidade e dados</h2>
          </div>
          <div className={styles.chipRow}>
            <span className={styles.chip}><span className={styles.dot} /> Privado</span>
            <span className={styles.chip}><span className={styles.blueDot} /> Guardado na sua conta</span>
          </div>
          <p className={styles.rowLead}>Suas conversas são suas. Você pode exportar suas reflexões quando quiser. A exclusão completa vai entrar com confirmação segura antes de apagar qualquer coisa.</p>
          <div className={styles.buttonRow}>
            <a className={`${styles.btn} ${styles.btnGhost}`} href="/api/account/export">
              Exportar minhas reflexões
            </a>
          </div>
        </section>

        <section className={`${styles.card} ${styles.block}`} aria-label="Conta">
          <div className={styles.blockHead}>
            <h2 className={styles.blockTitle}>Conta</h2>
          </div>
          <div className={styles.dataRow}>
            <span className={styles.k}>E-mail</span>
            <span className={`${styles.v} ${styles.mono}`}>{userEmail}</span>
          </div>
          <div className={styles.dataRow}>
            <span className={styles.k}>Sessão</span>
            <form action={signOut}>
              <button className={`${styles.btn} ${styles.btnGhost} ${styles.sessionButton}`} type="submit">
                Sair
              </button>
            </form>
          </div>
        </section>
      </div>

      <BottomNav active="perfil" />
    </main>
  );
}
