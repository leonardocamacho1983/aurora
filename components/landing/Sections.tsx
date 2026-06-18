import styles from "./Landing.module.css";
import { AuroraGlow } from "./Reveal";

const sectionPad = "clamp(56px,9vw,100px) clamp(20px,5vw,32px)";

/* ============ PRIVACIDADE ============ */
export function Privacidade() {
  const rows = [
    {
      title: "Criptografado",
      body: "Suas entradas são criptografadas. Só você consegue abrir.",
      icon: (
        <>
          <rect width="18" height="11" x="3" y="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </>
      ),
    },
    {
      title: "Nunca vendido",
      body: "Seus registros não são vendidos. O que você conta continua protegido.",
      icon: <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" />,
    },
    {
      title: "Você apaga",
      body: "Apague qualquer entrada, ou tudo de uma vez, quando quiser.",
      icon: (
        <>
          <path d="M3 6h18" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </>
      ),
    },
  ];
  return (
    <section id="privacidade" className={`${styles.sectionAnchor} ${styles.divineSection}`} style={{ background: "#0A0814", borderTop: "1px solid rgba(255,255,255,.06)" }}>
      <div className={styles.divineDivider} aria-hidden="true" />
      <div className={styles.sectionOrb} style={{ right: "6%", top: "18%" }} aria-hidden="true" />
      <div className={`${styles.twoCol} ${styles.sectionInner}`} style={{ maxWidth: 1080, margin: "0 auto", padding: sectionPad }}>
        <div>
          <div className={styles.sectionEyebrow}>
            Privacidade
          </div>
          <h2 className="font-serif" style={{ margin: "18px 0 0", fontSize: "clamp(2rem,5vw,40px)", fontWeight: 450, lineHeight: 1.12, letterSpacing: "-0.02em", color: "#F6F4FB", textWrap: "balance" }}>
            Seu diário é só <span style={{ fontStyle: "italic", color: "var(--accent)" }}>seu</span>.
          </h2>
          <p style={{ margin: "22px 0 0", font: "400 17px/1.62 var(--font-sans)", color: "#B3ADC4", maxWidth: 440, textWrap: "pretty" }}>
            O que você conta à Aurora continua sendo seu. Sem anúncios. Sem venda de dados. Sem truque escondido.
          </p>
        </div>
        <div className={styles.sanctuaryList} style={{ display: "flex", flexDirection: "column" }}>
          {rows.map((r, n) => (
            <div key={r.title} style={{ display: "flex", gap: 16, padding: "22px 0", borderTop: "1px solid rgba(255,255,255,.08)", borderBottom: n === rows.length - 1 ? "1px solid rgba(255,255,255,.08)" : undefined }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true">
                {r.icon}
              </svg>
              <div>
                <div style={{ font: "600 16px var(--font-sans)", color: "#F0ECF7" }}>{r.title}</div>
                <p style={{ margin: "5px 0 0", font: "400 15px/1.55 var(--font-sans)", color: "#948FA8", textWrap: "pretty" }}>{r.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============ COMO FUNCIONA ============ */
export function ComoFunciona() {
  const steps = [
    { n: "01", title: "Toque e fale", body: "A Aurora sugere um começo. Você toca no orb e fala do seu jeito, sem digitar e sem ter que organizar tudo antes." },
    { n: "02", title: "A Aurora reflete", body: "Ela organiza sua fala, percebe sinais importantes e devolve uma reflexão feita para o seu momento." },
    { n: "03", title: "Acompanhe", body: "Com o tempo, a Aurora revela padrões com leveza. Você entende melhor seus dias sem fazer força." },
  ];
  return (
    <section id="como-funciona" className={`${styles.sectionAnchor} ${styles.divineSection}`} style={{ background: "#0A0814", borderTop: "1px solid rgba(255,255,255,.06)" }}>
      <div className={styles.divineDivider} aria-hidden="true" />
      <div className={styles.sectionOrb} style={{ left: "-90px", top: "10%" }} aria-hidden="true" />
      <div className={styles.sectionInner} style={{ maxWidth: 1080, margin: "0 auto", padding: sectionPad }}>
        <div className={styles.sectionEyebrow}>
          Como funciona
        </div>
        <h2 className="font-serif" style={{ margin: "18px 0 0", fontSize: "clamp(2rem,5vw,40px)", fontWeight: 450, lineHeight: 1.12, letterSpacing: "-0.02em", color: "#F6F4FB", maxWidth: 620, textWrap: "balance" }}>
          Três minutos. Nenhuma tela em branco.
        </h2>
        <div className={styles.steps}>
          {steps.map((st, n) => (
            <div key={st.n} className={`${styles.step} ${n === steps.length - 1 ? styles.stepLast : ""}`}>
              <div className={styles.stepNumber}>{st.n}</div>
              <div>
                <div className={`font-serif ${styles.stepTitle}`}>{st.title}</div>
                <p className={styles.stepBody}>{st.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============ FEATURES ============ */
export function Features() {
  const cells = [
    { title: "Aprende a sua fase", body: "Percebe mudanças no seu momento e adapta os convites de reflexão.", stroke: "var(--accent)", icon: (<><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></>) },
    { title: "Tudo por voz", body: "Toque no orb e fale por alguns minutos, no seu ritmo.", stroke: "#C9C4D8", icon: (<><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></>) },
    { title: "Vira texto sozinho", body: "Sua fala vira um registro claro para reler quando quiser.", stroke: "#C9C4D8", icon: (<><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></>) },
    { title: "Clareza, não conselho", body: "A Aurora ajuda você a pensar e sentir com mais nitidez, sem respostas prontas.", stroke: "var(--accent)", icon: <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" /> },
    { title: "Sua linha do tempo", body: "Seus dias viram sinais. A Aurora costura padrões com cuidado, sem pesar a experiência.", stroke: "#C9C4D8", icon: (<><circle cx="12" cy="12" r="9" /><path d="M12 7.5V12l3 1.8" /></>) },
    { title: "Conforto a qualquer hora", body: "Uma interface que descansa seus olhos, feita para acolher qualquer momento do dia.", stroke: "#C9C4D8", icon: <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /> },
  ];
  return (
    <section id="features" className={`${styles.sectionAnchor} ${styles.divineSection}`} style={{ background: "#0A0814", borderTop: "1px solid rgba(255,255,255,.06)" }}>
      <div className={styles.divineDivider} aria-hidden="true" />
      <div className={styles.constellation} aria-hidden="true" />
      <AuroraGlow style={{ top: -160, right: -140, width: 560, height: 560 }} />
      <div className={styles.sectionInner} style={{ maxWidth: 1080, margin: "0 auto", padding: sectionPad }}>
        <div className={styles.sectionEyebrow}>
          O que o Aurora faz
        </div>
        <h2 className="font-serif" style={{ margin: "18px 0 0", fontSize: "clamp(2rem,5vw,40px)", fontWeight: 450, lineHeight: 1.12, letterSpacing: "-0.02em", color: "#F6F4FB", maxWidth: 660, textWrap: "balance" }}>
          Quieto por fora. <span style={{ fontStyle: "italic", color: "var(--accent)" }}>Atento</span> por dentro.
        </h2>
        <div className={styles.featGrid} style={{ marginTop: 54 }}>
          {cells.map((c) => (
            <div key={c.title} className={styles.cell} style={{ padding: "34px 30px", borderRight: "1px solid rgba(255,255,255,.08)", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c.stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {c.icon}
              </svg>
              <div style={{ marginTop: 18, font: "600 17px var(--font-sans)", color: "#F0ECF7" }}>{c.title}</div>
              <p style={{ margin: "8px 0 0", font: "400 15px/1.55 var(--font-sans)", color: "#948FA8", textWrap: "pretty" }}>{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============ PARA TERAPEUTAS ============ */
export function ParaTerapeutas() {
  return (
    <section id="terapeutas" className={`${styles.sectionAnchor} ${styles.divineSection}`} style={{ background: "#0A0814", borderTop: "1px solid rgba(255,255,255,.06)" }}>
      <div className={styles.divineDivider} aria-hidden="true" />
      <div className={styles.sectionOrb} style={{ right: "-120px", bottom: "8%" }} aria-hidden="true" />
      <div className={styles.sectionInner} style={{ maxWidth: 1080, margin: "0 auto", padding: "clamp(56px,9vw,96px) clamp(20px,5vw,32px)" }}>
        <div className={styles.sectionEyebrow}>
          Para terapeutas e psicólogos
        </div>
        <h2 className="font-serif" style={{ margin: "18px 0 0", fontSize: "clamp(1.9rem,4.6vw,36px)", fontWeight: 450, lineHeight: 1.14, letterSpacing: "-0.02em", color: "#F6F4FB", maxWidth: 700, textWrap: "balance" }}>
          Uma ferramenta entre as sessões e, no horizonte, dentro do seu <span style={{ fontStyle: "italic", color: "var(--accent)" }}>consultório</span>.
        </h2>
        <div className={styles.threeCards} style={{ marginTop: 40 }}>
          <div className={styles.card} style={{ padding: 26, border: "1px solid rgba(255,255,255,.09)", borderRadius: 16, background: "#0E0C1A" }}>
            <div style={{ font: "600 16px var(--font-sans)", color: "#F0ECF7" }}>Usar</div>
            <p style={{ margin: "8px 0 0", font: "400 15px/1.55 var(--font-sans)", color: "#948FA8", textWrap: "pretty" }}>Reflita você também, do seu jeito.</p>
          </div>
          <div className={styles.card} style={{ padding: 26, border: "1px solid rgba(255,255,255,.09)", borderRadius: 16, background: "#0E0C1A" }}>
            <div style={{ font: "600 16px var(--font-sans)", color: "#F0ECF7" }}>Recomendar</div>
            <p style={{ margin: "8px 0 0", font: "400 15px/1.55 var(--font-sans)", color: "#948FA8", textWrap: "pretty" }}>Uma prática gentil pros seus pacientes entre os encontros.</p>
          </div>
          <div className={styles.card} style={{ padding: 26, border: "1px solid rgba(255,255,255,.09)", borderRadius: 16, background: "#0E0C1A" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ font: "600 16px var(--font-sans)", color: "#F0ECF7" }}>Integrar</span>
              <span style={{ font: "600 10px var(--font-sans)", letterSpacing: ".8px", textTransform: "uppercase", color: "#1B1730", background: "var(--accent)", padding: "3px 8px", borderRadius: 999 }}>Em breve</span>
            </div>
            <p style={{ margin: "8px 0 0", font: "400 15px/1.55 var(--font-sans)", color: "#948FA8", textWrap: "pretty" }}>A Aurora dentro do seu consultório, no fluxo do acompanhamento.</p>
          </div>
        </div>
        <a href="#lista" className={styles.outlineBtn} style={{ marginTop: 32, height: 48, padding: "0 24px" }}>
          Entrar na lista profissional
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
        </a>
      </div>
    </section>
  );
}

/* ============ CONVIDE ============ */
export function Convide() {
  return (
    <section id="convide" className={`${styles.sectionAnchor} ${styles.divineSection} ${styles.inviteBand}`} style={{ background: "#070512", borderTop: "1px solid rgba(255,255,255,.06)" }}>
      <div className={styles.divineDivider} aria-hidden="true" />
      <AuroraGlow style={{ top: -140, left: "28%", width: 640, height: 640 }} />
      <div className={styles.sectionInner} style={{ maxWidth: 1080, margin: "0 auto", padding: "clamp(56px,9vw,96px) clamp(20px,5vw,32px)", textAlign: "center" }}>
        <div className={styles.sectionEyebrow}>
          Convide
        </div>
        <h2 className="font-serif" style={{ margin: "18px auto 0", fontSize: "clamp(1.9rem,4.8vw,38px)", fontWeight: 450, lineHeight: 1.12, letterSpacing: "-0.02em", color: "#F6F4FB", maxWidth: 600, textWrap: "balance" }}>
          Conhece alguém que merece um começo mais <span style={{ fontStyle: "italic", color: "var(--accent)" }}>leve</span>?
        </h2>
        <p style={{ margin: "18px auto 0", font: "400 17px/1.6 var(--font-sans)", color: "#B3ADC4", maxWidth: 520, textWrap: "pretty" }}>
          Convide alguém querido para conhecer a Aurora. Quando 5 pessoas confirmam pelo seu link, seu acesso amanhece antes.
        </p>
        <a href="#lista" className={styles.outlineBtn} style={{ marginTop: 30, height: 50, padding: "0 26px", font: "600 15px var(--font-sans)" }}>
          Criar meu convite
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
        </a>
        <div style={{ marginTop: 16, font: "400 13px var(--font-sans)", color: "#6F6987" }}>Você compartilha o link. A Aurora nunca manda convite sem sua ação.</div>
      </div>
    </section>
  );
}

/* ============ MANIFESTO ============ */
export function Manifesto() {
  return (
    <section id="manifesto" className={`${styles.sectionAnchor} ${styles.divineSection}`} style={{ background: "#0A0814", borderTop: "1px solid rgba(255,255,255,.06)" }}>
      <div className={styles.divineDivider} aria-hidden="true" />
      <AuroraGlow style={{ bottom: -180, left: -120, width: 600, height: 600 }} />
      <div className={`${styles.twoColManifesto} ${styles.sectionInner}`} style={{ maxWidth: 1080, margin: "0 auto", padding: "clamp(56px,9vw,96px) clamp(20px,5vw,32px)" }}>
        <div>
          <div className={styles.sectionEyebrow}>
            A ideia por trás
          </div>
          <h2 className="font-serif" style={{ margin: "18px 0 0", fontSize: "clamp(1.9rem,4.6vw,36px)", fontWeight: 450, lineHeight: 1.14, letterSpacing: "-0.02em", color: "#F6F4FB", maxWidth: 540, textWrap: "balance" }}>
            Por que falar em voz alta muda o que você <span style={{ fontStyle: "italic", color: "var(--accent)" }}>sente</span>.
          </h2>
          <p style={{ margin: "20px 0 0", font: "400 17px/1.62 var(--font-sans)", color: "#B3ADC4", maxWidth: 460, textWrap: "pretty" }}>
            O ensaio que deu origem à Aurora, com o método, a pesquisa e as escolhas que sustentam a experiência.
          </p>
          <a href="/manifesto" className={styles.outlineBtn} style={{ marginTop: 28, height: 48, padding: "0 24px" }}>
            Ler o manifesto
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
          </a>
        </div>
        <div className={styles.manifestoQuote} style={{ borderLeft: "2px solid rgba(236,182,210,.18)", padding: "6px 0 6px 28px" }}>
          <div className="font-serif" style={{ fontStyle: "italic", fontSize: "clamp(20px,3vw,24px)", fontWeight: 400, lineHeight: 1.45, color: "#E7E2F0", textWrap: "pretty" }}>
            &ldquo;O que a gente diz em voz alta deixa de morar só na cabeça e começa a fazer sentido.&rdquo;
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============ FOOTER ============ */
export function Footer() {
  const link = { font: "500 13px var(--font-sans)", color: "#6F6987", textDecoration: "none" };
  return (
    <footer style={{ borderTop: "1px solid rgba(255,255,255,.06)", background: "#070512" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "40px clamp(20px,5vw,32px)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--aurora)" }} />
          <span className="font-serif" style={{ fontSize: 18, fontWeight: 450, letterSpacing: "-0.02em", color: "#B3ADC4" }}>Aurora</span>
          <span style={{ font: "400 13px var(--font-sans)", color: "#56506B", marginLeft: 4 }}>· diário por voz</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 26, flexWrap: "wrap" }}>
          <a href="/manifesto" style={link}>Manifesto</a>
          <a href="/privacidade" style={link}>Privacidade</a>
          <a href="/termos" style={link}>Termos</a>
          <a href="mailto:hello@leonardocamacho.com" style={link}>Contato</a>
          <span style={{ font: "400 13px var(--font-sans)", color: "#56506B" }}>© 2026 Aurora</span>
        </div>
      </div>
    </footer>
  );
}
