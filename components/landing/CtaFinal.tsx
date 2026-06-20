"use client";

import { useEffect, useState } from "react";
import { WaitlistForm } from "./WaitlistForm";
import styles from "./Landing.module.css";

// CTA final: orb grande no rodape + waitlist reusado. orbGlow default 1.
export function CtaFinal({ orbGlow = 1 }: { orbGlow?: number }) {
  const [inviteMode, setInviteMode] = useState(false);

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const raw = localStorage.getItem("aurora_invite_context");
      setInviteMode(url.searchParams.get("sala") === "convite" && Boolean(raw));
    } catch {
      setInviteMode(false);
    }
  }, []);

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
            <>Continue preparando sua <span style={{ fontStyle: "italic", color: "#ECB6D2" }}>Aurora</span>.</>
          ) : (
            <>Receba acesso <span style={{ fontStyle: "italic", color: "#ECB6D2" }}>antecipado</span> à Aurora.</>
          )}
        </h2>
        <p style={{ margin: "20px 0 0", font: "400 17px/1.6 var(--font-sans)", color: "#C3BED4", maxWidth: 480, textWrap: "pretty" }}>
          {inviteMode
            ? "Seu acesso antecipado está registrado. Algumas respostas leves ajudam a Aurora a te receber melhor quando novas entradas forem abertas."
            : "A Aurora está abrindo em etapas. Quem entra agora recebe os próximos passos por email antes da abertura geral."}
        </p>
        {inviteMode ? (
          <div className={styles.ctaInviteReturn}>
            <a href="/chegada">Continuar meu Ritual de Chegada</a>
            <a href="/?sala=convite">Voltar ao topo da Aurora</a>
          </div>
        ) : (
          <div style={{ marginTop: 34, width: "100%", maxWidth: 460 }}>
            <WaitlistForm />
          </div>
        )}
      </div>
    </section>
  );
}
