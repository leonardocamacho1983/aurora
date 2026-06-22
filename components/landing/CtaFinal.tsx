"use client";

import { WaitlistForm } from "./WaitlistForm";
import { useInviteContext } from "./useInviteContext";
import styles from "./Landing.module.css";

// CTA final: orb grande no rodape + waitlist reusado. orbGlow default 1.
export function CtaFinal({ orbGlow = 1 }: { orbGlow?: number }) {
  const inviteContext = useInviteContext();
  const inviteMode = Boolean(inviteContext?.statusToken);

  return (
    <section id="lista" className={`${styles.sectionAnchor} ${styles.divineSection}`} style={{ borderTop: "1px solid rgba(255,255,255,.06)", background: "radial-gradient(ellipse 100% 90% at 50% 120%, #1a1330 0%, #0A0814 62%)" }}>
      <div className={styles.divineDivider} aria-hidden="true" />
      <div className={styles.constellation} aria-hidden="true" />
      <div style={{ position: "absolute", left: "50%", bottom: -560, transform: "translateX(-50%)", width: 1500, height: 1500, maxWidth: "180vw", pointerEvents: "none" }} aria-hidden="true">
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "linear-gradient(98deg,#79AEDB,#9A8AD9 30%,#E0A6C8 52%,#F4B6A0 78%,#F8CC92)", filter: "blur(26px)", opacity: 0.85 * orbGlow }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "linear-gradient(98deg,#93B9E0,#B49BE2 30%,#ECB4D2 52%,#F8C2A6 78%,#FBD79C)" }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle at 50% 60%,#1b1633 0%,#0e0a1e 50%,#0A0814 78%)", transform: "translateY(-9px)" }} />
      </div>
      <div className={styles.sectionInner} style={{ zIndex: 2, maxWidth: 1080, margin: "0 auto", padding: "clamp(56px,9vw,110px) clamp(20px,5vw,32px) clamp(88px,14vw,200px)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <h2 className="font-serif" style={{ margin: 0, fontSize: "clamp(2.1rem,5.4vw,46px)", fontWeight: 450, lineHeight: 1.1, letterSpacing: "-0.025em", color: "#F8F6FC", maxWidth: 640, textWrap: "balance", textShadow: "0 2px 40px rgba(0,0,0,.5)" }}>
          {inviteMode ? (
            <>Se lembrar de alguém querido, a <span style={{ fontStyle: "italic", color: "#ECB6D2" }}>Aurora</span> recebe com cuidado.</>
          ) : (
            <>Peça seu <span style={{ fontStyle: "italic", color: "#ECB6D2" }}>convite</span> para chegar com calma.</>
          )}
        </h2>
        <p style={{ margin: "20px 0 0", font: "400 17px/1.6 var(--font-sans)", color: "#C3BED4", maxWidth: 480, textWrap: "pretty" }}>
          {inviteMode
            ? "Seu convite é só uma porta discreta. A pessoa decide se quer chegar, no tempo dela, e a Aurora cuida para que a comunicação seja leve."
            : "A Aurora será aberta em ondas. Quem confirma o email recebe os próximos passos e pode convidar pessoas queridas quando fizer sentido."}
        </p>
        {inviteMode ? (
          <div className={styles.ctaInviteReturn}>
            <a href="/?sala=convite">Ver meu convite</a>
            <a href="/privacidade/email#convites-com-cuidado">Conhecer nosso compromisso</a>
          </div>
        ) : (
          <div style={{ marginTop: 34, width: "100%", maxWidth: 460 }}>
            <WaitlistForm source="landing_final_cta" />
            <a className={styles.trustMicroLink} href="/privacidade/email">
              Sem spam, sem pressão. Conheça nosso compromisso.
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
