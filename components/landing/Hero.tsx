"use client";

import { useEffect, useRef, useState } from "react";
import { HeroInviteNextStep } from "./HeroInviteNextStep";
import { WaitlistForm } from "./WaitlistForm";
import { drawHero, makeDawnField, HSET, smooth } from "@/lib/landing/dawn";
import styles from "./Landing.module.css";

// Tempo "base" do design (9.9s). S desacelera tudo p/ respirar.
const S = 1.35;
const BASE_END = 9.9;
const HEND = BASE_END * S; // ~13.4s, relogio mestre da intro
const beats = [
  { text: "Parar pra se ouvir é raro.", in: 0.7, out: 2.6 },
  { text: "E você está aqui.", in: 2.8, out: 4.5 },
  { text: "Algo novo está amanhecendo.", in: 4.8, out: 6.3 },
];
const LOGO_IN = 6.5;
const SETTLE_IN = 8.3;
const SETTLE_OUT = 9.7;
const FINAL_IN = 9.05;
const FINAL_OUT = 9.72;
const PHRASE_FADE = 0.6; // largura base do fade das frases (mais suave)
const LOGO_FADE = 0.9;

export function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const bridgeRef = useRef<HTMLDivElement>(null);
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
  const [inviteGreeting, setInviteGreeting] = useState<{
    name: string;
    confirmed: boolean;
    confirmedCount: number;
  } | null>(null);

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
    const revealBridge = (v: number) => {
      const b = bridgeRef.current;
      if (!b) return;
      b.style.setProperty("opacity", v.toFixed(3), "important");
    };
    const settleIntro = () => {
      if (introRef.current) introRef.current.style.opacity = "0";
      if (kineticRef.current) kineticRef.current.style.opacity = "0";
      if (logoWrapRef.current) {
        logoWrapRef.current.style.opacity = "0";
        logoWrapRef.current.style.filter = "blur(0px)";
      }
      revealHero(1);
      revealHeader(1);
      revealBridge(1);
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
      const finalReveal = smooth(FINAL_IN * S, FINAL_OUT * S, t);
      const introFade = 1 - smooth(SETTLE_IN * S, FINAL_IN * S, t);
      const introChildFade = 1 - smooth(SETTLE_IN * S, (SETTLE_IN + 0.62) * S, t);
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
        k.style.opacity = (bestO * introChildFade).toFixed(3);
        k.style.transform = `translate(-50%,-50%) translateY(${(12 * (1 - bestFin)).toFixed(1)}px)`;
      }

      const lr = smooth(LOGO_IN * S, (LOGO_IN + LOGO_FADE) * S, t);
      const lout = 1 - smooth(SETTLE_IN * S, (SETTLE_IN + 0.68) * S, t);
      const lw = logoWrapRef.current;
      if (lw) {
        lw.style.opacity = (lr * lout * introChildFade).toFixed(3);
        lw.style.transform = `translate(-50%,-50%) translateY(${(24 * (1 - lr)).toFixed(1)}px) scale(${(1.04 - 0.04 * lr).toFixed(3)})`;
        lw.style.filter = `blur(${(11 * (1 - lr)).toFixed(2)}px)`;
      }

      if (introRef.current) introRef.current.style.opacity = introFade.toFixed(3);
      revealHero(finalReveal);
      revealHeader(finalReveal);
      revealBridge(finalReveal);
    };

    const completeIntro = (remember = true) => {
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(revealTimer);
      clearTimeout(fallbackTimer);
      clearTimeout(veilTimer);
      playing = false;
      hlast = null;
      settleIntro();
      hideSkip();
      setShowVeil(false);
      setVeilFading(false);
      setIntroActive(false);
      setShowReplay(true);
      fadeOutAudio();
      if (remember) {
        try {
          sessionStorage.setItem("aurora_hero_seen", "1");
        } catch {
          /* ignore */
        }
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
          completeIntro();
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
      setShowVeil(false);
      setVeilFading(false);
      setIntroActive(true);
      setShowReplay(false);
      if (introRef.current) introRef.current.style.opacity = "1";
      if (kineticRef.current) {
        kineticRef.current.style.opacity = "0";
        kineticRef.current.style.filter = "";
      }
      if (logoWrapRef.current) {
        logoWrapRef.current.style.opacity = "0";
        logoWrapRef.current.style.filter = "blur(11px)";
      }
      revealHero(0);
      revealHeader(0);
      revealBridge(0);
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
      completeIntro();
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
      const url = new URL(window.location.href);
      if (url.searchParams.get("sala") === "convite") {
        sessionStorage.setItem("aurora_hero_seen", "1");
        const rawContext = localStorage.getItem("aurora_invite_context");
        if (rawContext) {
          const context = JSON.parse(rawContext) as {
            name?: string;
            confirmed?: boolean;
            confirmedCount?: number;
            savedAt?: number;
          };
          const fresh = !context.savedAt || Date.now() - context.savedAt < 7 * 24 * 60 * 60 * 1000;
          if (fresh) {
            setInviteGreeting({
              name: typeof context.name === "string" ? context.name.trim().slice(0, 40) : "",
              confirmed: Boolean(context.confirmed),
              confirmedCount: Number.isFinite(context.confirmedCount) ? Number(context.confirmedCount) : 0,
            });
          }
        }
      }
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
        heroT = HEND;
        playing = false;
        if (raf) cancelAnimationFrame(raf);
        paint();
        completeIntro();
      }
    }, 16000);

    if (reduce || seen) {
      heroT = HSET * S; // mostra o amanhecer plenamente nascido (drawHero recebe HSET)
      playing = false;
      paint();
      completeIntro(false);
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
        <div ref={bridgeRef} className={styles.heroToDemo} aria-hidden="true" />

        {/* ===== Veil de entrada "1 toque" ===== */}
        {showVeil && (
          <div
            onClick={() => startFnRef.current(true)}
            className={styles.veil}
            style={{ position: "absolute", inset: 0, zIndex: 7, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22, padding: 24, background: "rgba(8,6,15,.5)", cursor: "pointer", textAlign: "center", opacity: veilFading ? 0 : 1 }}
          >
            <div className={styles.veilInner} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
              <div className={styles.teaserSignature}>
                <span>diário por voz</span>
                <span aria-hidden="true" />
                <span>em breve</span>
              </div>
              <div className="font-serif" style={{ fontSize: "clamp(3rem,13vw,104px)", fontWeight: 450, letterSpacing: "-0.02em", lineHeight: 1, color: "#F8F6FC", textShadow: "0 0 90px rgba(236,182,210,.5),0 2px 40px rgba(0,0,0,.5)" }}>Aurora</div>
              <div className="font-serif" style={{ fontStyle: "italic", fontSize: "clamp(16px,3vw,21px)", fontWeight: 400, color: "#D8D3E6", textShadow: "0 1px 30px rgba(0,0,0,.6)" }}>Algo novo está amanhecendo.</div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); startFnRef.current(true); }}
                className={styles.auroraPlay}
                aria-label="Revelar o amanhecer"
              >
                <span className={`${styles.auroraPlayIcon} ${styles.playBreathe}`} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9.25 6.75c0-.86.94-1.39 1.68-.95l8.08 4.84c.72.43.72 1.47 0 1.9l-8.08 4.84c-.74.44-1.68-.09-1.68-.95V6.75Z" />
                  </svg>
                </span>
                <span className={styles.auroraPlayLabel}>Revelar o amanhecer</span>
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

        {(introActive && !showVeil) || showReplay ? (
          <div className={styles.ctrlStack}>
            {introActive && !showVeil && (
              <>
                <button
                  type="button"
                  onClick={() => toggleFnRef.current()}
                  aria-label={soundOn ? "Desligar som" : "Ligar som"}
                  className={styles.ctrl}
                >
                  {soundOn ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M15.2 8.8a4.5 4.5 0 0 1 0 6.4" />
                      <path d="M18.5 5.8a9 9 0 0 1 0 12.4" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <line x1="21" x2="16" y1="9" y2="14" />
                      <line x1="16" x2="21" y1="9" y2="14" />
                    </svg>
                  )}
                </button>
                <button
                  ref={skipRef}
                  type="button"
                  onClick={() => skipFnRef.current()}
                  aria-label="Pular intro"
                  className={styles.ctrl}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polygon points="6 5 14 12 6 19" />
                    <line x1="18" x2="18" y1="6" y2="18" />
                  </svg>
                </button>
              </>
            )}
            {showReplay && (
              <button
                type="button"
                onClick={() => replayFnRef.current()}
                aria-label="Rever a intro"
                className={styles.ctrl}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 12a8 8 0 1 0 2.7-6L4 8" />
                  <path d="M4 4v4h4" />
                </svg>
              </button>
            )}
          </div>
        ) : null}

        <div ref={introRef} aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: 4, pointerEvents: "none" }}>
          <div ref={kineticRef} className="font-serif" style={{ position: "absolute", left: "50%", top: "46%", transform: "translate(-50%,-50%)", width: "min(860px,86%)", fontSize: "clamp(2rem,6.5vw,54px)", fontWeight: 450, lineHeight: 1.12, letterSpacing: "-0.022em", color: "#F8F6FC", opacity: 0, textAlign: "center", textWrap: "balance", textShadow: "0 2px 60px rgba(0,0,0,.6)" }} />
          <div ref={logoWrapRef} style={{ position: "absolute", left: "50%", top: "46%", transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 18, opacity: 0 }}>
            <div className="font-serif" style={{ fontSize: "clamp(3.5rem,15vw,118px)", fontWeight: 450, letterSpacing: "-0.02em", lineHeight: 1, color: "#F8F6FC", textShadow: "0 0 80px rgba(236,182,210,.55),0 2px 40px rgba(0,0,0,.5)" }}>Aurora</div>
            <div className={styles.teaserSignature}>
              <span>diário por voz</span>
              <span aria-hidden="true" />
              <span>em breve</span>
            </div>
          </div>
        </div>

        <div ref={heroContentRef} style={{ position: "relative", zIndex: 3, width: "100%", maxWidth: 1120, margin: "0 auto", padding: "clamp(56px,12vw,84px) clamp(20px,5vw,32px) 40px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", opacity: 0, transform: "translateY(20px)" }}>
          {inviteGreeting ? (
            <div className={styles.heroInviteGreeting}>
              <span>{inviteGreeting.name ? `${inviteGreeting.name}, seu lugar na lista está confirmado.` : "Seu lugar na lista está confirmado."}</span>
              <strong>
                {inviteGreeting.confirmedCount > 0
                  ? inviteGreeting.confirmedCount === 1
                    ? "1 pessoa já entrou pela sua indicação."
                    : `${inviteGreeting.confirmedCount} pessoas já entraram pela sua indicação.`
                  : inviteGreeting.confirmed
                    ? "A Aurora vai avisar quando chegar sua vez."
                    : "Confirme seu email para ativar seus convites."}
              </strong>
            </div>
          ) : null}

          <div className={styles.heroEyebrow}>
            <span className={styles.eyebrowDot} aria-hidden="true" />
            <span className={styles.heroEyebrowText}>Diário por voz com IA · lista de espera aberta</span>
          </div>

          <h1 className="font-serif" style={{ margin: "clamp(16px,4vw,24px) 0 0", fontSize: "clamp(1.9rem,7vw,64px)", fontWeight: 450, lineHeight: 1.1, letterSpacing: "-0.028em", color: "#F8F6FC", maxWidth: 840, textWrap: "balance", textShadow: "0 2px 50px rgba(0,0,0,.65)" }}>
            Tem dias que pesam. Outros que <span style={{ fontStyle: "italic", color: "#ECB6D2" }}>brilham</span>.
          </h1>

          <p style={{ margin: "clamp(16px,4vw,26px) 0 0", font: "400 clamp(15px,2.4vw,18px)/1.6 var(--font-sans)", color: "#E8E4F2", maxWidth: 580, textWrap: "pretty", textShadow: "0 1px 24px rgba(0,0,0,.6)" }}>
            Fale por alguns minutos. A Aurora organiza o que você sentiu, percebe o seu momento e sugere por onde começar, sem pressão.
          </p>

          <div id="hero-lista" style={{ marginTop: "clamp(26px,6vw,40px)", width: "100%", maxWidth: 460 }}>
            {inviteGreeting ? (
              <HeroInviteNextStep initialName={inviteGreeting.name} />
            ) : (
              <WaitlistForm />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
