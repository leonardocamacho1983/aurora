"use client";

import { useEffect, useRef, useState } from "react";
import { WaitlistForm } from "./WaitlistForm";
import { drawHero, makeDawnField, HSET, smooth } from "@/lib/landing/dawn";
import styles from "./Landing.module.css";

// Tempo "base" do design (9.9s). S desacelera tudo p/ respirar.
const S = 1.35;
const BASE_END = 9.9;
const HEND = BASE_END * S; // ~13.4s — relógio mestre da intro
const beats = [
  { text: "Parar pra se ouvir é raro.", in: 0.7, out: 2.6 },
  { text: "E você está aqui.", in: 2.8, out: 4.5 },
  { text: "Algo novo está amanhecendo.", in: 4.8, out: 6.3 },
];
const LOGO_IN = 6.5;
const SETTLE_IN = 8.3;
const SETTLE_OUT = 9.7;
const PHRASE_FADE = 0.6; // largura base do fade das frases (mais suave)
const LOGO_FADE = 0.9;

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
  const replayFnRef = useRef<() => void>(() => {});
  const soundOnRef = useRef(true);

  const [showVeil, setShowVeil] = useState(false);
  const [veilFading, setVeilFading] = useState(false);
  const [introActive, setIntroActive] = useState(true);
  const [showReplay, setShowReplay] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  useEffect(() => {
    const cv = canvasRef.current;
    const ctx = cv?.getContext("2d") ?? null;
    const audio = audioRef.current;
    const { stars, particles } = makeDawnField();
    let heroT = 0;
    let playing = false;
    let started = false;
    let raf = 0;
    let hlast: number | null = null;
    let revealTimer = 0;
    let fallbackTimer = 0;
    let veilTimer = 0;
    let curBeat = "";
    let ro: ResizeObserver | null = null;

    // Canvas responsivo: backing store = tamanho exibido × DPR → pixels quadrados
    // (sem esticar o círculo do horizonte = sem "ovo").
    const sizeCanvas = () => {
      if (!cv) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = cv.clientWidth || window.innerWidth;
      const h = cv.clientHeight || window.innerHeight;
      cv.width = Math.max(1, Math.round(w * dpr));
      cv.height = Math.max(1, Math.round(h * dpr));
    };
    const paint = () => {
      if (ctx && cv) drawHero(ctx, heroT / S, stars, particles, cv.width, cv.height);
    };
    sizeCanvas();
    if (cv && "ResizeObserver" in window) {
      ro = new ResizeObserver(() => {
        sizeCanvas();
        paint();
      });
      ro.observe(cv);
    }

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
    const showSkip = () => {
      const s = skipRef.current;
      if (s) {
        s.style.opacity = "";
        s.style.pointerEvents = "";
      }
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
          audio.volume = Math.max(0, audio.volume - 0.1);
          window.setTimeout(step, 40);
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
          const fin = smooth(b.in * S, (b.in + PHRASE_FADE) * S, t);
          const fout = 1 - smooth(b.out * S, (b.out + PHRASE_FADE) * S, t);
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
        k.style.transform = `translate(-50%,-50%) translateY(${(12 * (1 - bestFin)).toFixed(1)}px)`;
      }

      const lr = smooth(LOGO_IN * S, (LOGO_IN + LOGO_FADE) * S, t);
      const lout = 1 - smooth(SETTLE_IN * S, (SETTLE_IN + 1.0) * S, t);
      const lw = logoWrapRef.current;
      if (lw) {
        lw.style.opacity = (lr * lout).toFixed(3);
        lw.style.transform = `translate(-50%,-50%) translateY(${(24 * (1 - lr)).toFixed(1)}px) scale(${(1.04 - 0.04 * lr).toFixed(3)})`;
        lw.style.filter = `blur(${(11 * (1 - lr)).toFixed(2)}px)`;
      }

      const settle = smooth(SETTLE_IN * S, SETTLE_OUT * S, t);
      if (introRef.current) introRef.current.style.opacity = (1 - settle).toFixed(3);
      revealHero(settle);
      revealHeader(settle);
    };

    const finishIntro = () => {
      if (raf) cancelAnimationFrame(raf);
      settleIntro();
      hideSkip();
      setIntroActive(false);
      setShowReplay(true);
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
          paint();
          finishIntro();
          return;
        }
      }
      paint();
      updateHero(heroT);
      raf = requestAnimationFrame(tick);
    };

    const begin = (withSound: boolean) => {
      heroT = 0;
      playing = true;
      hlast = null;
      setIntroActive(true);
      setShowReplay(false);
      showSkip();
      if (withSound && soundOnRef.current && audio) {
        audio.muted = false;
        audio.volume = 1;
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
      raf = requestAnimationFrame(tick);
    };

    startFnRef.current = (withSound: boolean) => {
      if (started) return;
      started = true;
      clearTimeout(fallbackTimer);
      // dissolve do veil; o amanhecer surge por baixo
      setVeilFading(true);
      veilTimer = window.setTimeout(() => setShowVeil(false), 1150);
      begin(withSound);
    };

    skipFnRef.current = () => {
      heroT = HEND;
      playing = false;
      paint();
      updateHero(heroT);
      finishIntro();
    };

    replayFnRef.current = () => {
      if (raf) cancelAnimationFrame(raf);
      begin(true);
    };

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

    revealTimer = window.setTimeout(() => {
      const el = heroContentRef.current;
      if (el && parseFloat(getComputedStyle(el).opacity) < 0.95) {
        playing = false;
        if (raf) cancelAnimationFrame(raf);
        settleIntro();
        hideSkip();
        setIntroActive(false);
      }
    }, 16000);

    if (reduce || seen) {
      heroT = HSET * S; // mostra o amanhecer plenamente nascido (drawHero recebe HSET)
      playing = false;
      paint();
      settleIntro();
      hideSkip();
      setIntroActive(false);
    } else {
      heroT = 0;
      paint(); // céu inicial atrás do veil
      setShowVeil(true);
      fallbackTimer = window.setTimeout(() => {
        if (!started) {
          started = true;
          setVeilFading(true);
          veilTimer = window.setTimeout(() => setShowVeil(false), 1150);
          begin(false);
        }
      }, 4000);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(revealTimer);
      clearTimeout(fallbackTimer);
      clearTimeout(veilTimer);
      ro?.disconnect();
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
            <div className={styles.navText} style={{ display: "flex", alignItems: "center", gap: "clamp(14px,3vw,30px)" }}>
              <a href="#manifesto" className={styles.navLink}>Manifesto</a>
              <a href="#privacidade" className={styles.navLink}>Privacidade</a>
            </div>
            <a href="#lista" className={styles.pill}>Entrar na lista</a>
          </div>
        </div>
      </div>

      {/* ===== Hero · O Amanhecer ===== */}
      <div style={{ position: "relative", overflow: "hidden", background: "#08060f", height: "100vh", minHeight: 720, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <canvas ref={canvasRef} width={1920} height={1080} aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", pointerEvents: "none" }} />

        {/* Scrim de leitura (só atrás do texto) */}
        <div className={styles.heroScrim} aria-hidden="true" />

        {/* ===== Veil de entrada "1 toque" ===== */}
        {showVeil && (
          <div
            onClick={() => startFnRef.current(true)}
            className={styles.veil}
            style={{ position: "absolute", inset: 0, zIndex: 7, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22, padding: 24, background: "rgba(8,6,15,.5)", cursor: "pointer", textAlign: "center", opacity: veilFading ? 0 : 1 }}
          >
            <div className={styles.veilInner} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
              <div style={{ font: "600 clamp(11px,2.4vw,13px) var(--font-sans)", letterSpacing: 6, textTransform: "uppercase", color: "#A7A2BE" }}>diário por voz · em breve</div>
              <div className="font-serif" style={{ fontSize: "clamp(3rem,13vw,104px)", fontWeight: 450, letterSpacing: "-0.02em", lineHeight: 1, color: "#F8F6FC", textShadow: "0 0 90px rgba(236,182,210,.5),0 2px 40px rgba(0,0,0,.5)" }}>Aurora</div>
              <div className="font-serif" style={{ fontStyle: "italic", fontSize: "clamp(16px,3vw,21px)", fontWeight: 400, color: "#D8D3E6", textShadow: "0 1px 30px rgba(0,0,0,.6)" }}>Algo novo está amanhecendo.</div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); startFnRef.current(true); }}
                className={`${styles.veilBtn} ${styles.veilBreathe}`}
                style={{ marginTop: 10 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
                Revelar o amanhecer
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); skipFnRef.current(); }}
                className={styles.veilSkip}
              >
                entrar sem a intro
              </button>
            </div>
          </div>
        )}

        {/* ===== Botão de som (durante a intro) ===== */}
        {introActive && !showVeil && (
          <button
            type="button"
            onClick={() => toggleFnRef.current()}
            aria-label={soundOn ? "Desligar som" : "Ligar som"}
            className={styles.ctrl}
            style={{ right: 24, bottom: 74 }}
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

        {/* ===== Pular intro (durante a intro) ===== */}
        {introActive && !showVeil && (
          <button
            ref={skipRef}
            type="button"
            onClick={() => skipFnRef.current()}
            aria-label="Pular intro"
            className={styles.ctrl}
            style={{ right: 24, bottom: 24 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="5 4 15 12 5 20" />
              <line x1="19" x2="19" y1="5" y2="19" />
            </svg>
          </button>
        )}

        {/* ===== Rever (após a intro) ===== */}
        {showReplay && (
          <button
            type="button"
            onClick={() => replayFnRef.current()}
            aria-label="Rever a intro"
            className={styles.ctrl}
            style={{ right: 24, bottom: 24 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
        )}

        <div ref={introRef} aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: 4, pointerEvents: "none" }}>
          <div ref={kineticRef} className="font-serif" style={{ position: "absolute", left: "50%", top: "46%", transform: "translate(-50%,-50%)", width: "min(860px,86%)", fontSize: "clamp(2rem,6.5vw,54px)", fontWeight: 450, lineHeight: 1.12, letterSpacing: "-0.022em", color: "#F8F6FC", opacity: 0, textAlign: "center", textWrap: "balance", textShadow: "0 2px 60px rgba(0,0,0,.6)" }} />
          <div ref={logoWrapRef} style={{ position: "absolute", left: "50%", top: "46%", transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 18, opacity: 0 }}>
            <div className="font-serif" style={{ fontSize: "clamp(3.5rem,15vw,118px)", fontWeight: 450, letterSpacing: "-0.02em", lineHeight: 1, color: "#F8F6FC", textShadow: "0 0 80px rgba(236,182,210,.55),0 2px 40px rgba(0,0,0,.5)" }}>Aurora</div>
            <div style={{ font: "600 clamp(12px,2.6vw,15px) var(--font-sans)", letterSpacing: 7, textTransform: "uppercase", color: "#C9C4D8" }}>diário por voz · em breve</div>
          </div>
        </div>

        <div ref={heroContentRef} style={{ position: "relative", zIndex: 3, width: "100%", maxWidth: 1120, margin: "0 auto", padding: "clamp(56px,12vw,84px) clamp(20px,5vw,32px) 40px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", opacity: 0, transform: "translateY(20px)" }}>
          <div style={{ font: "600 clamp(11px,2.6vw,12px) var(--font-sans)", letterSpacing: "2px", textTransform: "uppercase", color: "#B8B3CC", display: "flex", alignItems: "center", gap: 9, textShadow: "0 1px 16px rgba(0,0,0,.6)" }}>
            <span className={styles.eyebrowDot} style={{ width: 5, height: 5, borderRadius: "50%", background: "#EBB7D2", boxShadow: "0 0 8px rgba(235,183,210,.9)", flexShrink: 0 }} />
            Diário por voz com IA · lista de espera aberta
          </div>

          <h1 className="font-serif" style={{ margin: "clamp(16px,4vw,24px) 0 0", fontSize: "clamp(1.9rem,7vw,64px)", fontWeight: 450, lineHeight: 1.1, letterSpacing: "-0.028em", color: "#F8F6FC", maxWidth: 840, textWrap: "balance", textShadow: "0 2px 50px rgba(0,0,0,.65)" }}>
            Tem dias que pesam. Outros que <span style={{ fontStyle: "italic", color: "#ECB6D2" }}>brilham</span>.
          </h1>

          <p style={{ margin: "clamp(16px,4vw,26px) 0 0", font: "400 clamp(15px,2.4vw,18px)/1.6 var(--font-sans)", color: "#E8E4F2", maxWidth: 580, textWrap: "pretty", textShadow: "0 1px 24px rgba(0,0,0,.6)" }}>
            A Aurora te encontra em qualquer um deles — um diário por voz que aprende a sua fase e te pergunta a coisa certa pra hoje. Você fala; ela escuta, reflete e te ajuda a enxergar.
          </p>

          <div id="lista" style={{ marginTop: "clamp(26px,6vw,40px)", width: "100%", maxWidth: 460 }}>
            <WaitlistForm />
          </div>
        </div>
      </div>
    </>
  );
}
