"use client";

import { useEffect, useRef, useState } from "react";

const scenes = [
  { who: "acabou de ser mãe", q: "Como você está — além de cansada?" },
  { who: "está sem emprego", q: "O que teve de bom hoje, mesmo no meio disso?" },
  { who: "está mudando de carreira", q: "O que te puxa pro novo caminho?" },
  { who: "está abrindo uma empresa", q: "O que te empolgou e o que pesou hoje?" },
  { who: "só teve um dia comum", q: "O que de hoje você não quer esquecer?" },
];

export function AdaptiveDemo() {
  const [i, setI] = useState(0);
  const [visible, setVisible] = useState(true);
  const idx = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        idx.current = (idx.current + 1) % scenes.length;
        setI(idx.current);
        setVisible(true);
      }, 430);
    }, 3600);
    return () => clearInterval(id);
  }, []);

  const s = scenes[i];
  const fade = { transition: "opacity .43s ease", opacity: visible ? 1 : 0 } as const;

  return (
    <section style={{ position: "relative", zIndex: 4, background: "#070512", borderTop: "1px solid rgba(255,255,255,.06)" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "clamp(72px,10vw,110px) clamp(20px,5vw,32px)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ font: "600 12px var(--font-sans)", letterSpacing: "2.4px", textTransform: "uppercase", color: "#948FA8", display: "inline-flex", alignItems: "center", gap: 9 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent)" }} />
            Não é uma página em branco
          </div>
          <h2 className="font-serif" style={{ margin: "18px auto 0", fontSize: "clamp(2rem,5vw,42px)", fontWeight: 450, lineHeight: 1.1, letterSpacing: "-0.02em", color: "#F6F4FB", maxWidth: 680, textWrap: "balance" }}>
            Ela pergunta a coisa certa pra <span style={{ fontStyle: "italic", color: "var(--accent)" }}>você</span>, hoje.
          </h2>
          <p style={{ margin: "20px auto 0", font: "400 clamp(16px,2.4vw,18px)/1.62 var(--font-sans)", color: "#B3ADC4", maxWidth: 540, textWrap: "pretty" }}>
            A Aurora aprende o momento que você vive e propõe por onde começar. Sem tela vazia, sem saber o que escrever.
          </p>
        </div>
        <div style={{ marginTop: 56, display: "flex", gap: 44, alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", width: 200, height: 200, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", inset: "-24%", borderRadius: "50%" }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "var(--aurora)", filter: "blur(38px)", animation: "auroraGlow 5s ease-in-out infinite" }} />
            </div>
            <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", background: "var(--aurora)", boxShadow: "inset 0 7px 24px rgba(255,255,255,.28),inset 0 -18px 42px rgba(24,21,39,.3)", animation: "auroraBreathe 5s ease-in-out infinite" }} />
          </div>
          <div style={{ flex: 1, minWidth: 300, maxWidth: 560, background: "#11101E", border: "1px solid rgba(255,255,255,.09)", borderRadius: 22, padding: "34px 34px 30px", boxShadow: "0 30px 70px -36px rgba(0,0,0,.7)" }}>
            <div style={{ font: "600 12px var(--font-sans)", letterSpacing: "1.8px", textTransform: "uppercase", color: "#827C99" }}>
              Pra quem <span style={{ color: "var(--accent)", ...fade }}>{s.who}</span>
            </div>
            <div className="font-serif" style={{ marginTop: 14, fontSize: "clamp(22px,3.2vw,27px)", fontWeight: 450, lineHeight: 1.32, letterSpacing: "-0.01em", color: "#F0ECF7", textWrap: "pretty", minHeight: 72, ...fade }}>
              {s.q}
            </div>
            <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 9, color: "#6F6987", font: "500 12px var(--font-sans)", letterSpacing: ".3px" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
              a Aurora propõe · você fala o que quiser
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
