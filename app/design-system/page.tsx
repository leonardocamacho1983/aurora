import type { Metadata } from "next";
import { Orb } from "@/components/orb/Orb";
import { DesignSystemShell, PrivateScreen, SectionHeader, getDesignSystemAccess, withToken, type DesignSystemSearchParams } from "./_shared";
import styles from "./DesignSystem.module.css";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Aurora Product System",
  robots: {
    index: false,
    follow: false,
  },
};

const systemEntrances = [
  {
    title: "Design System",
    href: "/design-system/fundamentos",
    label: "Interface",
    body: "Use esta entrada para criar ou revisar telas, componentes, tokens, motion, responsividade e padrões de produto.",
    checks: ["Escolher tokens e escala", "Reutilizar componentes", "Validar patterns por ambiente"],
  },
  {
    title: "Público-alvo e Posicionamento",
    href: "/design-system/posicionamento",
    label: "Estratégia",
    body: "Use esta entrada antes de escrever copy, propor uma feature, desenhar onboarding ou explicar a Aurora para alguém novo.",
    checks: ["Confirmar o que Aurora é", "Evitar promessas proibidas", "Usar a USP aprovada"],
  },
];

const designSystemRoutes = [
  {
    title: "Fundamentos",
    href: "/design-system/fundamentos",
    body: "Tokens, tipografia, cor e escala. Comece aqui quando a pergunta for visual.",
  },
  {
    title: "Biblioteca de Componentes",
    href: "/design-system/biblioteca",
    body: "Peças reutilizáveis para montar telas sem recriar UI local.",
  },
  {
    title: "Patterns de Tela",
    href: "/design-system/patterns",
    body: "Telas inteiras em mobile, tablet e desktop, com cenário e tipografia por área.",
  },
  {
    title: "Referência Completa",
    href: "/design-system/referencia",
    body: "Auditoria longa com orb, exemplos, voz, marca, motion e guardrails completos.",
  },
  {
    title: "Roadmap",
    href: "/design-system/roadmap",
    body: "Sequência de componentização, QA e migração das rotas reais.",
  },
];

const operatingRules = [
  "Antes de criar uma tela, escolha um pattern existente ou documente por que ele não serve.",
  "Antes de escrever copy, confira posicionamento, promessa permitida e promessa proibida.",
  "Mobile, tablet e desktop são composições específicas, não resize automático.",
  "Se uma peça aparecer em duas superfícies, ela pertence à biblioteca.",
];

export default async function DesignSystemHubPage({ searchParams }: { searchParams: DesignSystemSearchParams }) {
  const access = await getDesignSystemAccess(searchParams);

  if (!access.allowed) {
    return <PrivateScreen configured={access.configured} />;
  }

  return (
    <DesignSystemShell token={access.token}>
      <section className={styles.portalHero}>
        <div className={styles.portalHeroCopy}>
          <h1>Aurora Product System</h1>
          <p>
            Tudo que agentes, designers, product managers e developers precisam consultar antes de criar uma tela,
            escrever uma copy ou propor uma feature da Aurora.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.primaryButton} href={withToken("/design-system/fundamentos", access.token)}>
              Entrar no Design System
            </a>
            <a className={styles.secondaryButton} href={withToken("/design-system/posicionamento", access.token)}>
              Ver posicionamento
            </a>
          </div>
        </div>
        <div className={styles.portalHeroOrb} aria-label="Orb canônico Aurora">
          <Orb state="reflecting" decorative />
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeader
          kicker="Duas fontes de decisão"
          title="Separe execução visual de estratégia de produto."
          copy="Use a entrada certa antes de pedir ajuda a uma IA, revisar uma tela ou orientar alguém novo no time."
        />
        <div className={styles.portalEntranceGrid}>
          {systemEntrances.map((entry) => (
            <a className={styles.portalEntranceCard} href={withToken(entry.href, access.token)} key={entry.title}>
              <span>{entry.label}</span>
              <h2>{entry.title}</h2>
              <p>{entry.body}</p>
              <ul>
                {entry.checks.map((check) => (
                  <li key={check}>{check}</li>
                ))}
              </ul>
            </a>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeader
          kicker="Design System"
          title="Use a camada certa para construir interface."
          copy="Tokens, componentes e patterns existem para impedir improviso visual e acelerar telas complexas sem perder a identidade."
        />
        <div className={styles.hubGrid}>
          {designSystemRoutes.map((card) => (
            <a className={styles.hubCard} href={withToken(card.href, access.token)} key={card.title}>
              <span>DS</span>
              <h2>{card.title}</h2>
              <p>{card.body}</p>
            </a>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeader
          kicker="Regras para agentes"
          title="A entrega precisa ser fiel à Aurora antes de ser bonita."
          copy="Estas regras servem para humanos e agentes de IA. Elas bloqueiam telas bonitas que traem o produto."
        />
        <div className={styles.ruleList}>
          {operatingRules.map((rule, index) => (
            <article key={rule}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{rule}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeader
          kicker="Próxima decisão"
          title="Migrar produto só depois de passar por estratégia e pattern."
          copy="Diário, Resultado, Timeline e Fios devem nascer da combinação entre posicionamento, componente certo e tela responsiva validada."
        />
        <div className={styles.nextStepPanel}>
          <div>
            <strong>Fase 4</strong>
            <p>
              Migrar as rotas reais usando os patterns do laboratório responsivo e o documento de posicionamento como guardrail de promessa, copy e experiência.
            </p>
          </div>
          <a className={styles.primaryButton} href={withToken("/design-system/patterns", access.token)}>
            Abrir patterns
          </a>
        </div>
      </section>
    </DesignSystemShell>
  );
}
