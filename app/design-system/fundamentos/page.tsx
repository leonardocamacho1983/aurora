import type { Metadata } from "next";
import { DesignSystemShell, PrivateScreen, SectionHeader, getDesignSystemAccess, type DesignSystemSearchParams } from "../_shared";
import styles from "../DesignSystem.module.css";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fundamentos | Aurora Design System",
  robots: {
    index: false,
    follow: false,
  },
};

const colors = [
  ["bg/base", "--bg-base", "#08060F"],
  ["bg", "--bg", "#0D0C17"],
  ["surface", "--surface", "#181527"],
  ["raised", "--raised", "#221E33"],
  ["ink", "--ink", "#F8F6FC"],
  ["ink/soft", "--ink-soft", "#B3ADC4"],
  ["accent", "--accent", "#A99BD9"],
  ["warm", "--aurora-warm", "#F4B6A0"],
  ["pink", "--aurora-pink", "#C9A2D4"],
  ["blue", "--aurora-blue", "#8FA4D6"],
  ["mint", "--aurora-mint", "#7FD0C4"],
  ["amanhecer/bg", "--bg em dawn", "#F6F3FB"],
];

const typography = [
  ["Hero Display", "--type-hero", "56-64", "Landing, manifesto e DS"],
  ["Product ScreenTitle", "--type-screen-title", "28-32", "Produto, máximo 1 por tela"],
  ["Mobile ScreenTitle", "--type-mobile-title", "24-28", "Linha curta em 390px"],
  ["SectionTitle", "--type-section-title", "20-24", "Seções e padrões"],
  ["CardTitle", "--type-card-title", "16-18", "Cards, sheets e painéis"],
  ["Body", "--type-body", "15-16 / 24", "Leitura padrão"],
  ["Meta", "--type-meta", "11-13 / 16", "Status e labels"],
  ["Reflection", "--type-reflection", "18-22", "Diário e insight"],
  ["Reflection Feature", "--type-reflection-feature", "24-28", "Destaque reflexivo controlado"],
];

const rules = [
  "Não usar 40px+ em produto, timeline, fio, conta ou admin.",
  "Não usar clamp() com vw para texto funcional fora dos tokens globais.",
  "Títulos dentro de cards ficam em --type-card-title.",
  "Fraunces fica reservado para marca, prompt e reflexão.",
];

export default async function FundamentosPage({ searchParams }: { searchParams: DesignSystemSearchParams }) {
  const access = await getDesignSystemAccess(searchParams);

  if (!access.allowed) {
    return <PrivateScreen configured={access.configured} />;
  }

  return (
    <DesignSystemShell token={access.token}>
      <section className={styles.hubHero}>
        <p className={styles.kicker}>Fundamentos</p>
        <h1>Base visual antes de componente.</h1>
        <p>Tokens, escala tipográfica e regras de uso ficam aqui para não se misturarem com a biblioteca.</p>
      </section>

      <section className={styles.section} id="cores">
        <SectionHeader
          kicker="Cores"
          title="Crepúsculo como padrão. Amanhecer como abertura."
          copy="Estes tokens orientam código, Figma, assets e novas telas."
        />
        <div className={styles.colorGrid}>
          {colors.map(([label, tokenName, value]) => (
            <article className={styles.colorCard} key={tokenName}>
              <span className={styles.swatch} style={{ background: value }} />
              <strong>{label}</strong>
              <code>{tokenName}</code>
              <small>{value}</small>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} id="tipografia">
        <SectionHeader
          kicker="Tipografia"
          title="O tamanho serve o conteúdo."
          copy="Produto e admin não usam escala de hero. A escala abaixo é fechada para agentes e humanos."
        />
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Uso</th>
                <th>Token</th>
                <th>Escala</th>
                <th>Contexto</th>
              </tr>
            </thead>
            <tbody>
              {typography.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell) => <td key={cell}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          <p className={styles.tableNote}>
            Regra: produto, timeline, fio, conta e admin não usam escala de hero. 40px+ só entra em landing, manifesto, Design System ou exceção editorial justificada.
          </p>
        </div>
      </section>

      <section className={styles.section} id="regras">
        <SectionHeader
          kicker="Guardrail"
          title="O que a escala bloqueia."
          copy="Estas regras existem para impedir tela gritando por padrão."
        />
        <div className={styles.ruleList}>
          {rules.map((rule, index) => (
            <article key={rule}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{rule}</p>
            </article>
          ))}
        </div>
      </section>
    </DesignSystemShell>
  );
}
