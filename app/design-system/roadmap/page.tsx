import type { Metadata } from "next";
import { DesignSystemShell, PrivateScreen, SectionHeader, getDesignSystemAccess, withToken, type DesignSystemSearchParams } from "../_shared";
import styles from "../DesignSystem.module.css";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Roadmap | Aurora Design System",
  robots: {
    index: false,
    follow: false,
  },
};

const phases = [
  {
    phase: "Fase 2A",
    status: "Agora",
    title: "Organizar o DS em hub navegável",
    body: "Separar fundamentos, biblioteca, referência completa e roadmap para parar a página infinita.",
    deliverables: "Hub, Fundamentos, Biblioteca, Roadmap e Referência completa.",
  },
  {
    phase: "Fase 2B",
    status: "Concluída",
    title: "Codificar a biblioteca mínima",
    body: "Componentes reais criados em components/ui e components/product, com vitrine na Biblioteca.",
    deliverables: "Button, IconButton, CardSurface, Panel, Chip, ReflectionCard, TimelineEntryCard, ThreadCard e ContinueThreadButton.",
  },
  {
    phase: "Fase 2B.1",
    status: "Concluída",
    title: "FlipCard como comportamento de card",
    body: "Adicionar frente, verso, expansão antes do flip, foco, teclado e reduced motion.",
    deliverables: "components/product/FlipCard.tsx demonstrado em /design-system/biblioteca.",
  },
  {
    phase: "Fase 2C",
    status: "Concluída",
    title: "Completar estados e interação",
    body: "Componentes de estado, navegação mobile e feedback de IA criados e demonstrados na biblioteca.",
    deliverables: "SegmentedTabs, StreamingText, BottomNav, EmptyState, FeedbackMicro e PrivacyChip.",
  },
  {
    phase: "Fase 3",
    status: "Concluída",
    title: "Criar patterns de tela",
    body: "Patterns criados em components/patterns e demonstrados na aba Patterns de Tela.",
    deliverables: "DiaryCapturePattern, ReflectionResultPattern, TimelineListPattern, OpenThreadPattern e EmptyThreadPattern.",
  },
  {
    phase: "Fase 3.1",
    status: "Concluída",
    title: "Responsive Screen Lab",
    body: "Patterns agora podem ser vistos como telas inteiras por mobile, tablet e desktop, com cenários controláveis.",
    deliverables: "ResponsivePatternLab, PatternControls, ResponsivePatternFrame e responsive-pattern-config.",
  },
  {
    phase: "Fase 4",
    status: "Próxima",
    title: "Migrar telas reais em ondas",
    body: "Recriar Diário, Timeline e Fio usando biblioteca, patterns e laboratório responsivo, com QA visual por viewport.",
    deliverables: "/diario, /timeline, /fios, /fios/[id], depois onboarding, conta e admin.",
  },
];

export default async function RoadmapPage({ searchParams }: { searchParams: DesignSystemSearchParams }) {
  const access = await getDesignSystemAccess(searchParams);

  if (!access.allowed) {
    return <PrivateScreen configured={access.configured} />;
  }

  return (
    <DesignSystemShell token={access.token}>
      <section className={styles.hubHero}>
        <p className={styles.kicker}>Roadmap</p>
        <h1>O encaixe dos próximos passos.</h1>
        <p>O DS fica organizado antes de crescer. Cada fase adiciona capacidade sem transformar a documentação em uma página infinita.</p>
      </section>

      <section className={styles.section}>
        <SectionHeader
          kicker="Sequência"
          title="Da organização à migração real."
          copy="A biblioteca vem antes dos patterns, os patterns vêm antes do lab responsivo, e o lab vem antes da migração das telas complexas."
        />
        <div className={styles.roadmapStack}>
          {phases.map((item) => (
            <article className={styles.roadmapCard} key={item.phase}>
              <div>
                <span>{item.phase}</span>
                <strong>{item.status}</strong>
              </div>
              <h2>{item.title}</h2>
              <p>{item.body}</p>
              <small>{item.deliverables}</small>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.nextStepPanel}>
          <div>
            <strong>Próxima ação recomendada</strong>
            <p>Começar a Fase 4: migrar Diário, Timeline e Fios usando os patterns e o Responsive Screen Lab, com QA por viewport.</p>
          </div>
          <a className={styles.primaryButton} href={withToken("/design-system/patterns", access.token)}>
            Abrir patterns
          </a>
        </div>
      </section>
    </DesignSystemShell>
  );
}
