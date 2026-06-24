import type { Metadata } from "next";
import { DesignSystemShell, PrivateScreen, SectionHeader, getDesignSystemAccess, withToken, type DesignSystemSearchParams } from "./_shared";
import styles from "./DesignSystem.module.css";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Aurora Design System",
  robots: {
    index: false,
    follow: false,
  },
};

const hubCards = [
  {
    title: "Fundamentos",
    href: "/design-system/fundamentos",
    meta: "Tokens, tipografia e regras de escala",
    body: "A base que impede fonte gigante, cor solta e espaçamento inventado.",
  },
  {
    title: "Biblioteca de Componentes",
    href: "/design-system/biblioteca",
    meta: "UI, Product, Growth, Feedback e Trust",
    body: "A área focada só nas peças que serão usadas para montar telas reais.",
  },
  {
    title: "Patterns de Tela",
    href: "/design-system/patterns",
    meta: "Responsive Screen Lab",
    body: "A aba específica onde composições aparecem como telas inteiras em mobile, tablet e desktop.",
  },
  {
    title: "Referência Completa",
    href: "/design-system/referencia",
    meta: "Página longa preservada",
    body: "A versão integral do DS continua disponível para auditoria e comparação visual.",
  },
  {
    title: "Roadmap",
    href: "/design-system/roadmap",
    meta: "Próximas fases",
    body: "Onde encaixam componentização, patterns e migração das telas do produto.",
  },
];

const criticalRules = [
  "Produto, timeline, fio, conta e admin não usam escala de hero.",
  "Tela complexa não nasce artesanal direto em page.tsx.",
  "Componente recorrente entra em components/ui ou components/product.",
  "Patterns montam telas; pages coordenam dados e rota.",
];

export default async function DesignSystemHubPage({ searchParams }: { searchParams: DesignSystemSearchParams }) {
  const access = await getDesignSystemAccess(searchParams);

  if (!access.allowed) {
    return <PrivateScreen configured={access.configured} />;
  }

  return (
    <DesignSystemShell token={access.token}>
      <section className={styles.hubHero}>
        <p className={styles.kicker}>Design System Aurora</p>
        <h1>Um hub para criar telas sem perder a identidade.</h1>
        <p>
          A página principal fica curta. Fundamentos, biblioteca, referência completa e roadmap vivem em áreas próprias para evitar uma documentação infinita.
        </p>
      </section>

      <section className={styles.section}>
        <SectionHeader
          kicker="Áreas"
          title="Entre pelo que você precisa decidir."
          copy="Cada área tem uma função clara. O objetivo é reduzir busca, evitar duplicação e preparar a biblioteca real de componentes."
        />
        <div className={styles.hubGrid}>
          {hubCards.map((card) => (
            <a className={styles.hubCard} href={withToken(card.href, access.token)} key={card.title}>
              <span>{card.meta}</span>
              <h2>{card.title}</h2>
              <p>{card.body}</p>
            </a>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeader
          kicker="Regras críticas"
          title="O que continua inegociável."
          copy="Estas regras ficam no hub porque devem orientar qualquer próxima etapa, independentemente da área aberta."
        />
        <div className={styles.ruleList}>
          {criticalRules.map((rule, index) => (
            <article key={rule}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{rule}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeader
          kicker="Próximo encaixe"
          title="Migração vem depois dos patterns."
          copy="As fases 2B, 2B.1, 2C, 3 e 3.1 já criaram componentes, estados, receitas e laboratório responsivo. O próximo trabalho aplica isso nas rotas reais."
        />
        <div className={styles.nextStepPanel}>
          <div>
            <strong>Fase 4</strong>
            <p>Migrar /diario, /timeline e /fios usando os patterns e o laboratório responsivo, sem remontar telas artesanalmente.</p>
          </div>
          <a className={styles.primaryButton} href={withToken("/design-system/patterns", access.token)}>
            Ver patterns
          </a>
        </div>
      </section>
    </DesignSystemShell>
  );
}
