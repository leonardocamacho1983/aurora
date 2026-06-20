import Link from "next/link";
import type { ReactNode } from "react";
import { TrackPageView } from "@/components/analytics/TrackPageView";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import styles from "./Launch.module.css";

type LaunchPageProps = {
  page: string;
  eyebrow: string;
  title: ReactNode;
  lead: string;
  children: ReactNode;
};

type SectionProps = {
  eyebrow?: string;
  title: ReactNode;
  lead?: string;
  center?: boolean;
  alt?: boolean;
  children?: ReactNode;
};

export function LaunchPage({
  page,
  eyebrow,
  title,
  lead,
  children,
}: LaunchPageProps) {
  return (
    <div className={styles.page}>
      <TrackPageView page={page} />
      <LaunchHeader page={page} />
      <main>
        <section className={styles.hero}>
          <div className={styles.stars} aria-hidden="true" />
          <div className={styles.heroInner}>
            <p className={styles.kicker}>{eyebrow}</p>
            <h1 className={styles.heroTitle}>{title}</h1>
            <p className={styles.heroLead}>{lead}</p>
          </div>
        </section>
        {children}
        <LaunchNextStep page={page} />
      </main>
      <LaunchFooter />
    </div>
  );
}

export function LaunchHeader({ page }: { page: string }) {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandOrb} aria-hidden="true" />
          Aurora
        </Link>
        <nav className={styles.nav} aria-label="Navegação principal">
          <Link href="/manifesto">Manifesto</Link>
          <Link href="/metodo">Método</Link>
          <Link href="/diario-por-voz">Diário por voz</Link>
          <Link href="/privacidade">Privacidade</Link>
          <Link href="/para-terapeutas">Profissionais</Link>
          <TrackedLink
            href="/#lista"
            className={styles.pill}
            eventProperties={{ page, source: "launch_header", label: "Receber acesso antecipado" }}
          >
            Receber acesso antecipado
          </TrackedLink>
        </nav>
      </div>
    </header>
  );
}

export function LaunchFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandOrb} aria-hidden="true" />
          Aurora
        </Link>
        <nav className={styles.footerLinks} aria-label="Rodapé">
          <Link href="/">Home</Link>
          <Link href="/privacidade">Privacidade</Link>
          <Link href="/termos">Termos</Link>
          <Link href="/seguranca">Segurança</Link>
          <Link href="/faq">FAQ</Link>
          <a href="mailto:hello@leonardocamacho.com">Contato</a>
        </nav>
        <span>© 2026 Aurora</span>
      </div>
    </footer>
  );
}

const launchPaths = {
  manifesto: { href: "/manifesto", label: "Manifesto", note: "a luz, o oráculo e a voz" },
  metodo: { href: "/metodo", label: "Método", note: "como a Aurora escolhe o começo" },
  "diario-por-voz": { href: "/diario-por-voz", label: "Diário por voz", note: "por que falar ajuda" },
  "ia-para-reflexao": { href: "/ia-para-reflexao", label: "IA para reflexão", note: "clareza sem conselho pronto" },
  privacidade: { href: "/privacidade", label: "Privacidade", note: "dados íntimos tratados com clareza" },
  seguranca: { href: "/seguranca", label: "Segurança", note: "cuidado técnico sem linguagem opaca" },
  faq: { href: "/faq", label: "FAQ", note: "respostas para chegar com calma" },
  termos: { href: "/termos", label: "Termos", note: "o acordo simples da experiência" },
  "para-terapeutas": { href: "/para-terapeutas", label: "Profissionais", note: "uso entre encontros, com limites" },
  "aurora-org": { href: "/aurora-org", label: "Aurora.org", note: "o próximo passo regenerativo" },
} satisfies Record<string, { href: string; label: string; note: string }>;

const journeyByPage: Record<string, Array<keyof typeof launchPaths>> = {
  manifesto: ["metodo", "diario-por-voz", "aurora-org"],
  metodo: ["diario-por-voz", "ia-para-reflexao", "privacidade"],
  "diario-por-voz": ["metodo", "ia-para-reflexao", "privacidade"],
  "ia-para-reflexao": ["metodo", "seguranca", "privacidade"],
  privacidade: ["seguranca", "termos", "faq"],
  seguranca: ["privacidade", "faq", "para-terapeutas"],
  faq: ["privacidade", "seguranca", "termos"],
  termos: ["privacidade", "seguranca", "faq"],
  "para-terapeutas": ["metodo", "diario-por-voz", "privacidade"],
  "aurora-org": ["manifesto", "metodo", "privacidade"],
};

const conversionCopy: Record<string, { eyebrow: string; title: string; body: string; label: string }> = {
  manifesto: {
    eyebrow: "Próximo gesto",
    title: "Se a ideia fez sentido, chegue antes da abertura.",
    body: "A Aurora está abrindo em etapas. O acesso antecipado aproxima você dos primeiros passos da experiência.",
    label: "Quero entrar antes da abertura",
  },
  metodo: {
    eyebrow: "Acesso antecipado",
    title: "Acompanhe a Aurora enquanto o método ganha forma.",
    body: "Você recebe os próximos passos por email antes da abertura geral e pode convidar pessoas queridas para chegar junto.",
    label: "Quero entrar antes da abertura",
  },
  "diario-por-voz": {
    eyebrow: "Experimente primeiro",
    title: "Quando a Aurora abrir, você pode começar pela voz.",
    body: "Receba acesso antecipado e prepare sua chegada com calma.",
    label: "Quero entrar antes da abertura",
  },
  "ia-para-reflexao": {
    eyebrow: "Tecnologia com limite",
    title: "Quer acompanhar essa forma de usar IA?",
    body: "Receba acesso antecipado para acompanhar uma IA pensada para clareza, não para dependência.",
    label: "Quero entrar antes da abertura",
  },
  "para-terapeutas": {
    eyebrow: "Profissionais",
    title: "Quer acompanhar a Aurora pelo olhar clínico?",
    body: "Receba novidades sobre uso responsável, limites e possíveis integrações para profissionais.",
    label: "Conhecer a Aurora para profissionais",
  },
  "aurora-org": {
    eyebrow: "Próximo passo",
    title: "Acompanhe a Aurora.org desde o início.",
    body: "O acesso antecipado também aproxima você do compromisso regenerativo que vai crescer junto com a Aurora.",
    label: "Quero entrar antes da abertura",
  },
};

function LaunchNextStep({ page }: { page: string }) {
  const conversion = conversionCopy[page];
  const journeyItems = (journeyByPage[page] ?? ["manifesto", "metodo", "diario-por-voz"])
    .filter((key) => key !== page)
    .slice(0, 3)
    .map((key) => launchPaths[key]);

  return (
    <section className={styles.nextStep} aria-label="Continue pela Aurora">
      <div className={styles.nextStepInner}>
        {conversion ? (
          <div className={styles.conversionCard}>
            <p>{conversion.eyebrow}</p>
            <h2>{conversion.title}</h2>
            <span>{conversion.body}</span>
            <TrackedLink
              href="/#lista"
              className={styles.primary}
              eventProperties={{ page, source: "launch_contextual_cta", label: conversion.label }}
            >
              {conversion.label}
            </TrackedLink>
          </div>
        ) : null}

        <div className={styles.journeyBlock}>
          <p className={styles.eyebrow}>Continue pela Aurora</p>
          <div className={styles.journeyGrid}>
            {journeyItems.map((item) => (
              <TrackedLink
                key={item.href}
                href={item.href}
                className={styles.journeyCard}
                eventProperties={{ page, source: "launch_continue_journey", label: item.label }}
              >
                <span>{item.label}</span>
                <small>{item.note}</small>
              </TrackedLink>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function LaunchSection({ eyebrow, title, lead, center = false, alt = false, children }: SectionProps) {
  return (
    <section className={`${styles.section} ${alt ? styles.sectionAlt : ""}`}>
      <div className={styles.sectionInner}>
        <div className={`${styles.sectionIntro} ${center ? styles.center : ""}`}>
          {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
          <h2 className={styles.sectionTitle}>{title}</h2>
          {lead ? <p className={styles.sectionLead}>{lead}</p> : null}
        </div>
        {children}
      </div>
    </section>
  );
}

export function Grid({ columns = 3, children }: { columns?: 2 | 3; children: ReactNode }) {
  return (
    <div className={`${styles.grid} ${columns === 2 ? styles.gridTwo : styles.gridThree}`}>
      {children}
    </div>
  );
}

export function Card({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <article className={styles.card}>
      <h3>{title}</h3>
      {children}
    </article>
  );
}

export function WideCard({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <article className={styles.wideCard}>
      <h3>{title}</h3>
      {children}
    </article>
  );
}

export function FineList({ items }: { items: Array<{ title: string; body: string }> }) {
  return (
    <div className={styles.fineList}>
      {items.map((item) => (
        <div className={styles.fineItem} key={item.title}>
          <strong>{item.title}</strong>
          <span>{item.body}</span>
        </div>
      ))}
    </div>
  );
}

export function Quote({ children }: { children: ReactNode }) {
  return <blockquote className={styles.quote}>{children}</blockquote>;
}

export function ManifestoPremiere() {
  return (
    <article className={styles.premiere} aria-label="Prévia do mini-documentário Manifesto Aurora">
      <div className={styles.premiereFrame}>
        <div className={styles.premiereSky} aria-hidden="true" />
        <div className={styles.premiereHorizon} aria-hidden="true" />
        <div className={styles.premiereContent}>
          <span className={styles.premiereBadge}>Em produção</span>
          <span className={styles.premierePlay} role="img" aria-label="Mini-documentário em produção">
            <span aria-hidden="true" />
          </span>
          <h3>Manifesto Aurora: a história da luz</h3>
          <p>Um mini-documentário sobre voz, travessia e o instante em que algo dentro da gente começa a ganhar contorno.</p>
        </div>
      </div>
      <div className={styles.premiereNote}>
        <strong>Aguarde a estreia.</strong>
        <span>A música completa, a imagem do amanhecer e a origem da Aurora vão se encontrar em uma pequena travessia visual.</span>
      </div>
    </article>
  );
}

export function SmallOrb() {
  return <span className={styles.smallOrb} aria-hidden="true" />;
}
