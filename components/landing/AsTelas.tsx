import type { ReactNode } from "react";

function StatusBar() {
  return (
    <div style={{ height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 26px", flexShrink: 0 }}>
      <span style={{ font: "600 14px var(--font-sans)", color: "#F0ECF7" }}>9:41</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#F0ECF7" }}>
        <svg width="17" height="11" viewBox="0 0 18 11" fill="currentColor" aria-hidden="true">
          <rect x="0" y="7" width="3" height="4" rx="1" />
          <rect x="5" y="4.5" width="3" height="6.5" rx="1" />
          <rect x="10" y="2" width="3" height="9" rx="1" />
          <rect x="15" y="0" width="3" height="11" rx="1" opacity=".35" />
        </svg>
        <svg width="24" height="12" viewBox="0 0 26 13" fill="none" aria-hidden="true">
          <rect x="1" y="1" width="21" height="11" rx="3" stroke="currentColor" strokeOpacity=".5" />
          <rect x="3" y="3" width="15" height="7" rx="1.5" fill="currentColor" />
          <rect x="23.5" y="4" width="1.5" height="5" rx=".75" fill="currentColor" fillOpacity=".6" />
        </svg>
      </div>
    </div>
  );
}

function Phone({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
      <div style={{ width: 340, maxWidth: "86vw", height: 716, background: "#181527", borderRadius: 42, border: "1px solid rgba(255,255,255,.07)", boxShadow: "0 36px 80px -34px rgba(0,0,0,.7)", overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}>
        <StatusBar />
        {children}
      </div>
      <div style={{ font: "500 13px var(--font-sans)", color: "#6F6987", letterSpacing: ".2px" }}>{label}</div>
    </div>
  );
}

const back = (
  <div style={{ width: 38, height: 38, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#B3ADC4", marginLeft: -6, flexShrink: 0 }}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
  </div>
);

const timeline = [
  { c: "#8FB89C", d: "14 jun", t: "Dez minutos de café em silêncio, só meus…" },
  { c: "#8FB89C", d: "13 jun", t: "Conversa boa com a Marina, me senti leve…" },
  { c: "#D9B36B", d: "11 jun", t: "Ansiedade antes da reunião, respirei e…" },
  { c: "#8C8AA6", d: "09 jun", t: "Comecei a planejar a mudança de área…" },
];

export function AsTelas() {
  return (
    <section style={{ borderTop: "1px solid rgba(255,255,255,.06)", background: "#070512" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "clamp(56px,9vw,100px) clamp(20px,5vw,32px)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ font: "600 12px var(--font-sans)", letterSpacing: "2.4px", textTransform: "uppercase", color: "#948FA8", display: "inline-flex", alignItems: "center", gap: 9 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent)" }} />
            As telas
          </div>
          <h2 className="font-serif" style={{ margin: "18px auto 0", fontSize: "clamp(2rem,5vw,40px)", fontWeight: 450, lineHeight: 1.12, letterSpacing: "-0.02em", color: "#F6F4FB", maxWidth: 600, textWrap: "balance" }}>
            Da fala à reflexão, em uma respirada.
          </h2>
        </div>
        <div style={{ marginTop: 64, display: "flex", flexWrap: "wrap", gap: 36, justifyContent: "center", alignItems: "flex-start" }}>
          {/* A · Início */}
          <Phone label="Início">
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "0 22px 24px" }}>
              <div style={{ height: 50, flexShrink: 0 }} />
              <div className="font-serif" style={{ fontSize: 26, fontWeight: 450, lineHeight: 1.3, letterSpacing: "-0.01em", color: "#F0ECF7", textAlign: "center", maxWidth: 250, textWrap: "balance" }}>
                O que ficou com você hoje?
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 26, width: "100%" }}>
                <div style={{ position: "relative", width: 176, height: 176, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ position: "absolute", inset: "-26%", borderRadius: "50%" }}>
                    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "var(--aurora)", filter: "blur(34px)", animation: "auroraGlow 5s ease-in-out infinite" }} />
                  </div>
                  <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", background: "var(--aurora)", boxShadow: "inset 0 6px 22px rgba(255,255,255,.28),inset 0 -16px 38px rgba(24,21,39,.3)", animation: "auroraBreathe 5s ease-in-out infinite" }} />
                </div>
                <div style={{ font: "600 13px var(--font-sans)", letterSpacing: ".4px", color: "#ECE8F4" }}>Toque para falar</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#6F6987", font: "500 12px var(--font-sans)", letterSpacing: ".4px", padding: 8 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7.5V12l3 1.8" /></svg>
                linha do tempo
              </div>
            </div>
          </Phone>

          {/* B · Reflexão */}
          <Phone label="Reflexão">
            <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "4px 22px 22px" }}>
              {back}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ font: "400 15px/1.55 var(--font-sans)", color: "#F0ECF7" }}>
                  Foi um dia corrido, mas teve um momento bom: parei dez minutos pra tomar café sozinha, em silêncio.
                </div>
                <div style={{ marginTop: 22, display: "flex", gap: 13, background: "#2A2540", borderRadius: 18, padding: 18, animation: "reflectIn .6s ease-out both" }}>
                  <div style={{ width: 17, height: 17, borderRadius: "50%", background: "var(--aurora)", flexShrink: 0, marginTop: 2, boxShadow: "0 0 12px rgba(201,162,212,.45)" }} />
                  <div className="font-serif" style={{ fontSize: 17, fontWeight: 400, lineHeight: 1.5, letterSpacing: "-0.005em", color: "#F0ECF7", textWrap: "pretty" }}>
                    Esses dez minutos parecem ter sido seus de verdade. O que eles te deram que o resto do dia não deu?
                  </div>
                </div>
                <div style={{ marginTop: 24, font: "500 12px var(--font-sans)", letterSpacing: ".3px", color: "#6F6987" }}>
                  Como você se sente? <span style={{ color: "#56506B" }}>(opcional)</span>
                </div>
                <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 7 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 31, padding: "0 12px 0 10px", borderRadius: 999, background: "rgba(140,138,166,.24)", color: "#F0ECF7", font: "500 12px var(--font-sans)", boxShadow: "inset 0 0 0 1px rgba(140,138,166,.6)" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F0ECF7" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>leve
                  </span>
                  {["grato", "cansado", "esperançoso"].map((m) => (
                    <span key={m} style={{ display: "inline-flex", alignItems: "center", height: 31, padding: "0 13px", borderRadius: 999, background: "#2A2540", color: "#B3ADC4", font: "500 12px var(--font-sans)" }}>{m}</span>
                  ))}
                </div>
                <div style={{ marginTop: 18, width: "100%", height: 50, borderRadius: 999, background: "var(--accent)", color: "#1B1730", font: "600 15px var(--font-sans)", letterSpacing: ".2px", display: "flex", alignItems: "center", justifyContent: "center" }}>Salvar</div>
              </div>
            </div>
          </Phone>

          {/* C · Linha do tempo */}
          <Phone label="Linha do tempo">
            <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "4px 22px 22px" }}>
              {back}
              <div style={{ marginTop: 10, marginBottom: 8, font: "600 21px var(--font-sans)", letterSpacing: "-0.01em", color: "#F0ECF7" }}>Sua linha do tempo</div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {timeline.map((row) => (
                  <div key={row.d} style={{ display: "flex", alignItems: "center", gap: 13, padding: "16px 2px", borderBottom: "1px solid #2E2944" }}>
                    <span style={{ width: 9, height: 9, borderRadius: "50%", background: row.c, flexShrink: 0 }} />
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, minWidth: 0 }}>
                      <span style={{ font: "500 12px var(--font-sans)", color: "#6F6987", flexShrink: 0 }}>{row.d}</span>
                      <span style={{ font: "400 14px var(--font-sans)", color: "#F0ECF7", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.t}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Phone>
        </div>
      </div>
    </section>
  );
}
