import type { Metadata } from "next";
import { DesignSystemShell, PrivateScreen, SectionHeader, getDesignSystemAccess, type DesignSystemSearchParams } from "../_shared";
import styles from "../DesignSystem.module.css";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Público-alvo e Posicionamento | Aurora Product System",
  robots: {
    index: false,
    follow: false,
  },
};

const essenceCards = [
  {
    title: "Definição",
    body: "Aurora é um diário por voz para organizar o que você sente, pensa e quer colocar em prática, percebendo padrões, ideias e próximos passos com mais clareza.",
  },
  {
    title: "USP",
    body: "Aurora transforma o que você sente, pensa e quer colocar em prática em clareza, padrões e próximos passos, a partir da sua própria voz.",
  },
  {
    title: "Público-alvo",
    body: "Adultos vivendo carga emocional, mental ou prática: crise, transição, crescimento, manutenção de um bom momento, procrastinação, excesso de ideias ou sensação de vida solta.",
  },
];

const isAndIsNot = [
  ["É", "Um diário por voz com inteligência orientadora"],
  ["Não é", "Um chat generalista"],
  ["É", "Um espaço para pensar em voz alta"],
  ["Não é", "Terapia, diagnóstico, tratamento ou emergência"],
  ["É", "Um jeito de organizar sentimentos, ideias, decisões e práticas"],
  ["Não é", "Lista de tarefas soltas ou conversa infinita"],
  ["É", "Um apoio para encontrar próximos passos possíveis"],
  ["Não é", "Alguém decidindo pela pessoa"],
];

const audienceMoments = [
  ["Cabeça cheia", "Quando tudo está misturado e a pessoa precisa falar antes de organizar."],
  ["Decisão difícil", "Quando emoção, desejo, medo, contexto e ação possível precisam ser separados."],
  ["Ideias soltas", "Quando há muita coisa começada e pouco fio entre sentimento, intenção e prática."],
  ["Fase boa", "Quando está dando certo, mas a pessoa precisa sustentar presença, energia e bons padrões."],
  ["Entre sessões", "Quando terapia, coaching ou práticas pessoais precisam de registro e continuidade entre encontros."],
  ["Cuidado dos outros", "Quando a pessoa escuta todo mundo e quase não para para escutar a si mesma."],
];

const messagingRules = [
  "Comece por uma situação concreta; não comece explicando tecnologia.",
  "Use linguagem cotidiana: muita coisa na cabeça, não sei por onde começar, isso vive voltando.",
  "Diga que Aurora ajuda a organizar, perceber padrões e encontrar próximos passos possíveis.",
  "Não use saúde mental como promessa de marketing, nem linguagem de cura, diagnóstico ou produtividade total.",
  "Não descreva o público como quebrado, disfuncional, frágil ou incapaz.",
  "Mantenha a decisão na pessoa: Aurora ajuda a se escutar, não manda na vida dela.",
];

const explanationExamples = [
  {
    title: "Curta",
    body: "Aurora é um diário por voz com IA para organizar o que você sente, pensa e quer colocar em prática.",
  },
  {
    title: "Média",
    body: "Você fala por alguns minutos. A Aurora organiza o registro, mostra padrões e ajuda a encontrar próximos passos possíveis sem transformar isso em chat infinito.",
  },
  {
    title: "Para agentes",
    body: "Toda tela, copy ou feature deve preservar a ideia de voz, continuidade, clareza e autonomia. O produto nunca promete terapia, diagnóstico, emergência ou decisão pela pessoa.",
  },
];

export default async function PositioningPage({ searchParams }: { searchParams: DesignSystemSearchParams }) {
  const access = await getDesignSystemAccess(searchParams);

  if (!access.allowed) {
    return <PrivateScreen configured={access.configured} />;
  }

  return (
    <DesignSystemShell token={access.token}>
      <section className={styles.hubHero}>
        <p className={styles.kicker}>Público-alvo e Posicionamento</p>
        <h1>A estratégia que mantém a Aurora fiel a si mesma.</h1>
        <p>
          Use esta página antes de escrever copy, desenhar onboarding, propor uma feature, gerar uma tela com IA ou explicar a Aurora para alguém novo.
        </p>
      </section>

      <section className={styles.section}>
        <SectionHeader
          kicker="Essência"
          title="A promessa é clareza a partir da própria voz."
          copy="Estas frases são fonte de verdade. Se uma tela ou campanha contradiz isto, ela não está pronta."
        />
        <div className={styles.positioningGrid}>
          {essenceCards.map((card) => (
            <article className={styles.positioningCard} key={card.title}>
              <span>{card.title}</span>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeader
          kicker="Limites"
          title="O que a Aurora é e o que ela não pode parecer."
          copy="Este bloco deve orientar IA, produto, design, vendas, marketing e atendimento."
        />
        <div className={styles.positioningMatrix}>
          {isAndIsNot.map(([mode, copy]) => (
            <article data-mode={mode} key={`${mode}-${copy}`}>
              <span>{mode}</span>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeader
          kicker="Para quem"
          title="A Aurora entra quando a pessoa precisa dar forma ao que está solto."
          copy="Use estes momentos para priorizar features, exemplos, onboarding e campanhas."
        />
        <div className={styles.positioningList}>
          {audienceMoments.map(([title, body]) => (
            <article key={title}>
              <h2>{title}</h2>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeader
          kicker="Comunicação"
          title="Como explicar sem virar terapia, chat ou produtividade."
          copy="A copy da Aurora deve ser simples, concreta e não clínica."
        />
        <div className={styles.ruleList}>
          {messagingRules.map((rule, index) => (
            <article key={rule}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{rule}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeader
          kicker="Explicações prontas"
          title="Use estas versões como baseline antes de inventar outra."
          copy="Agentes podem adaptar contexto e tamanho, mas não devem mudar a promessa central."
        />
        <div className={styles.positioningGrid}>
          {explanationExamples.map((example) => (
            <article className={styles.positioningCard} key={example.title}>
              <span>{example.title}</span>
              <p>{example.body}</p>
            </article>
          ))}
        </div>
      </section>
    </DesignSystemShell>
  );
}
