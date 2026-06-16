"use client";

import { useEffect, useRef, useState } from "react";
import { WaitlistForm } from "./WaitlistForm";
import { drawHero, makeDawnField, HSET, HEND, smooth } from "@/lib/landing/dawn";
import styles from "./Landing.module.css";

const beats = [
  { text: "Parar pra se ouvir é raro.", in: 0.7, out: 2.6 },
  { text: "E você está aqui.", in: 2.8, out: 4.5 },
  { text: "Algo novo está amanhecendo.", in: 4.8, out: 6.3 },
];
const LOGO_IN = 6.5;
const SETTLE_IN = 8.3;
const SETTLE_OUT = 9.7;

export function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const kineticRef = useRef<HTMLDivElement>(null);
  const logoWrapRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const startFnRef = useRef<(withSound: boolean) => void>(() => {});
  const skipFnRef = useRef<() => void>(() => {});
  const toggleFnRef = useRef<() => void>(() => {});
  const soundOnRef = useRef(true);

  const [showVeil, setShowVeil] = useState(false);
  const [introActive, setIntroActive] = useState(true);
  const [soundOn, setSoundOn] = useState(true);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d") ?? null;
    const audio = audioRef.current;
    const { stars, particles } = makeDawnField();
    let heroT = 0;
    let playing = false;
    let started = false;
    let raf = 0;
    let hlast: number | null = null;
    let revealTimer = 0;
    let fallbackTimer = 0;
    let curBeat = "";

    const revealHero = (v: number) => {
      const el = heroContentRef.current;
      if (!el) return;
      el.style.setProperty("opacity", v.toFixed(3), "important");
      el.style.setProperty("transform", `translateY(${(20 * (1 - v)).toFixed(1)}px)`, "important");
    };
    const revealHeader = (v: number) => {
      const h = headerRef.current;
      if (!h) return;
      h.style.setProperty("opacity", v.toFixed(3), "important");
      h.style.setProperty("transform", `translateY(${(-8 * (1 - v)).toFixed(1)}px)`, "important");
      h.style.setProperty("pointer-events", v > 0.5 ? "auto" : "none", "important");
    };
    const settleIntro = () => {
      if (introRef.current) introRef.current.style.opacity = "0";
      if (kineticRef.current) kineticRef.current.style.opacity = "0";
      if (logoWrapRef.current) logoWrapRef.current.style.opacity = "0";
      revealHero(1);
      revealHeader(1);
    };
    const hideSkip = () => {
      const s = skipRef.current;
      if (s) {
        s.style.opacity = "0";
        s.style.pointerEvents = "none";
      }
    };

    const fadeOutAudio = () => {
      if (!audio) return;
      const step = () => {
        if (audio.volume > 0.06) {
          audio.volume = Math.max(0, audio.volume - 0.12);
          window.setTimeout(step, 35);
        } else {
          audio.pause();
          audio.volume = 1;
        }
      };
      step();
    };

    const updateHero = (t: number) => {
      const k = kineticRef.current;
      if (k) {
        let best: (typeof beats)[number] | null = null;
        let bestO = 0;
        let bestFin = 0;
        for (const b of beats) {
          const fin = smooth(b.in, b.in + 0.4, t);
          const fout = 1 - smooth(b.out, b.out + 0.35, t);
          const o = fin * fout;
          if (o > bestO) {
            bestO = o;
            best = b;
            bestFin = fin;
          }
        }
        if (best && curBeat !== best.text) {
          k.textContent = best.text;
          curBeat = best.text;
        }
        k.style.opacity = bestO.toFixed(3);
        k.style.transform = `translate(-50%,-50%) translateY(${(10 * (1 - bestFin)).toFixed(1)}px)`;
      }

      const lr = smooth(LOGO_IN, LOGO_IN + 0.7, t);
      const lout = 1 - smooth(SETTLE_IN, SETTLE_IN + 0.9, t);
      const lw = logoWrapRef.current;
      if (lw) {
        lw.style.opacity = (lr * lout).toFixed(3);
        lw.style.transform = `translate(-50%,-50%) translateY(${(24 * (1 - lr)).toFixed(1)}px) scale(${(1.04 - 0.04 * lr).toFixed(3)})`;
        lw.style.filter = `blur(${(11 * (1 - lr)).toFixed(2)}px)`;
      }

      const settle = smooth(SETTLE_IN, SETTLE_OUT, t);
      if (introRef.current) introRef.current.style.opacity = (1 - settle).toFixed(3);
      revealHero(settle);
      revealHeader(settle);
    };

    const finishIntro = () => {
      if (raf) cancelAnimationFrame(raf);
      settleIntro();
      hideSkip();
      setIntroActive(false);
      fadeOutAudio();
      try {
        sessionStorage.setItem("aurora_hero_seen", "1");
      } catch {
        /* ignore */
      }
    };

    const tick = (ts: number) => {
      if (hlast == null) hlast = ts;
      const dt = Math.min(0.05, (ts - hlast) / 1000);
      hlast = ts;
      if (playing) {
        heroT += dt;
        if (heroT >= HEND) {
          heroT = HEND;
          playing = false;
          if (ctx) drawHero(ctx, heroT, stars, particles);
          finishIntro();
          return;
        }
      }
      if (ctx) drawHero(ctx, heroT, stars, particles);
      updateHero(heroT);
      raf = requestAnimationFrame(tick);
    };

    startFnRef.current = (withSound: boolean) => {
      if (started) return;
      started = true;
      clearTimeout(fallbackTimer);
      setShowVeil(false);
      heroT = 0;
      playing = true;
      hlast = null;
      if (withSound && soundOnRef.current && audio) {
        audio.muted = false;
        audio.volume = 1;
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
      raf = requestAnimationFrame(tick);
    };

    skipFnRef.current = () => {
      heroT = HEND;
      playing = false;
      if (ctx) drawHero(ctx, heroT, stars, particles);
      updateHero(heroT);
      finishIntro();
    };

    // Liga/desliga o som; durante a intro sincroniza o áudio com o relógio (sem reiniciar).
    toggleFnRef.current = () => {
      const next = !soundOnRef.current;
      soundOnRef.current = next;
      setSoundOn(next);
      try {
        localStorage.setItem("aurora_sound", next ? "1" : "0");
      } catch {
        /* ignore */
      }
      if (!audio) return;
      if (next && playing) {
        audio.muted = false;
        audio.volume = 1;
        audio.currentTime = Math.min(heroT, audio.duration || HEND);
        audio.play().catch(() => {});
      } else if (!next) {
        audio.pause();
      }
    };

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let seen = false;
    try {
      seen = sessionStorage.getItem("aurora_hero_seen") === "1";
    } catch {
      /* ignore */
    }
    try {
      if (localStorage.getItem("aurora_sound") === "0") {
        soundOnRef.current = false;
        setSoundOn(false);
      }
    } catch {
      /* ignore */
    }

    // Failsafe: se o motor nunca avançar, força o estado final.
    revealTimer = window.setTimeout(() => {
      const el = heroContentRef.current;
      if (el && parseFloat(getComputedStyle(el).opacity) < 0.95) {
        playing = false;
        if (raf) cancelAnimationFrame(raf);
        settleIntro();
        hideSkip();
        setIntroActive(false);
      }
    }, 14000);

    if (reduce || seen) {
      heroT = HSET;
      playing = false;
      if (ctx) drawHero(ctx, heroT, stars, particles);
      settleIntro();
      hideSkip();
      setIntroActive(false);
    } else {
      // Desenha o céu inicial atrás do veil; espera o toque (ou auto-toca mudo em 3s).
      if (ctx) drawHero(ctx, 0, stars, particles);
      setShowVeil(true);
      fallbackTimer = window.setTimeout(() => startFnRef.current(false), 3000);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(revealTimer);
      clearTimeout(fallbackTimer);
      if (audio) audio.pause();
    };
  }, []);

  return (
    <>
      <audio ref={audioRef} src="/audio/aurora-intro.mp3" preload="auto" playsInline />

      {/* ===== Nav (escondida durante a intro; aparece no settle) ===== */}
      <div
        ref={headerRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          background: "rgba(10,8,20,.66)",
          borderBottom: "1px solid rgba(255,255,255,.06)",
          opacity: 0,
          transform: "translateY(-8px)",
          pointerEvents: "none",
        }}
      >
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 clamp(20px,5vw,32px)", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--aurora)", boxShadow: "0 0 14px rgba(201,162,212,.5)" }} />
            <span className="font-serif" style={{ fontSize: 23, fontWeight: 450, letterSpacing: "-0.02em", color: "#F0ECF7" }}>Aurora</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "clamp(14px,3vw,30px)" }}>
            <a href="#manifesto" className={styles.navLink}>Manifesto</a>
            <a href="#privacidade" className={styles.navLink}>Privacidade</a>
            <a href="#lista" className={styles.pill}>Entrar na lista</a>
          </div>
        </div>
      </div>

      {/* ===== Hero · O Amanhecer ===== */}
      <div style={{ position: "relative", overflow: "hidden", background: "#08060f", height: "100vh", minHeight: 720, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <canvas ref={canvasRef} width={1920} height={1080} aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", pointerEvents: "none" }} />

        {/* ===== Veil de entrada "1 toque" ===== */}
        {showVeil && (
          <div
            onClick={() => startFnRef.current(true)}
            style={{ position: "absolute", inset: 0, zIndex: 7, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 26, padding: 24, background: "rgba(8,6,15,.42)", cursor: "pointer", textAlign: "center" }}
          >
            <div className="font-serif" style={{ fontSize: "clamp(3rem,13vw,96px)", fontWeight: 450, letterSpacing: "-0.02em", lineHeight: 1, color: "#F8F6FC", textShadow: "0 0 80px rgba(236,182,210,.5),0 2px 40px rgba(0,0,0,.5)" }}>Aurora</div>
            <div style={{ font: "600 clamp(11px,2.4vw,14px) var(--font-sans)", letterSpacing: 6, textTransform: "uppercase", color: "#C9C4D8" }}>diário por voz · em breve</div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); startFnRef.current(true); }}
              className={styles.veilBtn}
              style={{ marginTop: 8 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
              Toque para começar
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); skipFnRef.current(); }}
              className={styles.veilSkip}
            >
              entrar direto, sem a intro
            </button>
          </div>
        )}

        {/* ===== Botão de som (durante a intro) ===== */}
        {introActive && !showVeil && (
          <button
            type="button"
            onClick={() => toggleFnRef.current()}
            aria-label={soundOn ? "Desligar som" : "Ligar som"}
            className={styles.skip}
            style={{ position: "absolute", right: 24, bottom: 70, zIndex: 6, display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 999, background: "rgba(10,8,20,.4)", border: "1px solid rgba(255,255,255,.14)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", color: "#C3BED4", cursor: "pointer" }}
          >
            {soundOn ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="22" x2="16" y1="9" y2="15" />
                <line x1="16" x2="22" y1="9" y2="15" />
              </svg>
            )}
          </button>
        )}

        <button
          ref={skipRef}
          type="button"
          onClick={() => skipFnRef.current()}
          className={styles.skip}
          style={{ position: "absolute", right: 24, bottom: 22, zIndex: 6, display: "inline-flex", alignItems: "center", gap: 7, height: 40, padding: "0 15px", borderRadius: 999, background: "rgba(10,8,20,.4)", border: "1px solid rgba(255,255,255,.14)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", color: "#C3BED4", font: "600 12px var(--font-sans)", letterSpacing: ".4px", cursor: "pointer" }}
        >
          Pular intro
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polygon points="5 4 15 12 5 20" />
            <line x1="19" x2="19" y1="5" y2="19" />
          </svg>
        </button>

        <div ref={introRef} aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: 4, pointerEvents: "none" }}>
          <div ref={kineticRef} className="font-serif" style={{ position: "absolute", left: "50%", top: "46%", transform: "translate(-50%,-50%)", width: "min(860px,86%)", fontSize: "clamp(2rem,6.5vw,54px)", fontWeight: 450, lineHeight: 1.12, letterSpacing: "-0.022em", color: "#F8F6FC", opacity: 0, textAlign: "center", textWrap: "balance", textShadow: "0 2px 60px rgba(0,0,0,.6)" }} />
          <div ref={logoWrapRef} style={{ position: "absolute", left: "50%", top: "46%", transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 18, opacity: 0 }}>
            <div className="font-serif" style={{ fontSize: "clamp(3.5rem,15vw,118px)", fontWeight: 450, letterSpacing: "-0.02em", lineHeight: 1, color: "#F8F6FC", textShadow: "0 0 80px rgba(236,182,210,.55),0 2px 40px rgba(0,0,0,.5)" }}>Aurora</div>
            <div style={{ font: "600 clamp(12px,2.6vw,15px) var(--font-sans)", letterSpacing: 7, textTransform: "uppercase", color: "#C9C4D8" }}>diário por voz · em breve</div>
          </div>
        </div>

        <div ref={heroContentRef} style={{ position: "relative", zIndex: 3, width: "100%", maxWidth: 1120, margin: "0 auto", padding: "84px clamp(20px,5vw,32px) 40px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", opacity: 0, transform: "translateY(20px)" }}>
          <div style={{ font: "600 12px var(--font-sans)", letterSpacing: "2.6px", textTransform: "uppercase", color: "#A7A2BE", display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#EBB7D2", boxShadow: "0 0 8px rgba(235,183,210,.9)" }} />
            Diário por voz com IA · lista de espera aberta
          </div>

          <h1 className="font-serif" style={{ margin: "24px 0 0", fontSize: "clamp(2.4rem,7vw,64px)", fontWeight: 450, lineHeight: 1.06, letterSpacing: "-0.028em", color: "#F8F6FC", maxWidth: 840, textWrap: "balance", textShadow: "0 2px 50px rgba(0,0,0,.5)" }}>
            Tem dias que pesam. Outros que <span style={{ fontStyle: "italic", color: "#ECB6D2" }}>brilham</span>.
          </h1>

          <p style={{ margin: "26px 0 0", font: "400 clamp(16px,2.4vw,18px)/1.62 var(--font-sans)", color: "#C3BED4", maxWidth: 580, textWrap: "pretty" }}>
            A Aurora te encontra em qualquer um deles — um diário por voz que aprende a sua fase e te pergunta a coisa certa pra hoje. Você fala; ela escuta, reflete e te ajuda a enxergar.
          </p>

          <div id="lista" style={{ marginTop: 40, width: "100%", maxWidth: 460 }}>
            <WaitlistForm />
          </div>
        </div>
      </div>
    </>
  );
}
