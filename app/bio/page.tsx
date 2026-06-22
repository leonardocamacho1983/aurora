import type { Metadata } from "next";
import { TrackPageView } from "@/components/analytics/TrackPageView";
import { BioLink } from "./BioLink";
import styles from "./BioPage.module.css";

const auroraAccessUrl =
  "https://www.faleaurora.com/?utm_source=instagram&utm_medium=bio&utm_campaign=launch_waitlist&utm_content=perfil";

export const metadata: Metadata = {
  title: "Aurora e Leonardo Camacho",
  description:
    "Link de bio de Leonardo Camacho com acesso antecipado para a Aurora, site pessoal e Amplify.",
  alternates: {
    canonical: null,
  },
  keywords: [],
  openGraph: {
    title: "Aurora e Leonardo Camacho",
    description:
      "Acesso antecipado para a Aurora, site pessoal de Leonardo Camacho e Amplify.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Aurora e Leonardo Camacho",
    description:
      "Acesso antecipado para a Aurora, site pessoal de Leonardo Camacho e Amplify.",
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function BioPage() {
  return (
    <main className={styles.page}>
      <TrackPageView page="instagram-bio" category="bio" />
      <div className={styles.shell}>
        <div className={styles.brand} aria-label="Aurora">
          <img src="/brand/aurora-logo-horizontal.svg" alt="Aurora" width="276" height="96" />
        </div>

        <section className={styles.hero} aria-labelledby="bio-title">
          <h1 id="bio-title">
            Aurora: um diário por voz para organizar o que você sente, pensa e quer colocar em prática.
          </h1>
          <p>
            Uma forma simples de pensar em voz alta, perceber padrões e encontrar próximos passos com mais clareza.
          </p>
        </section>

        <nav className={styles.actions} aria-label="Links principais">
          <BioLink className={styles.primary} href={auroraAccessUrl} rel="nofollow" label="Participar do Acesso Antecipado">
            Participar do Acesso Antecipado
          </BioLink>
          <p className={styles.microcopy}>Abertura em ondas, com confirmação por email. Sem spam.</p>
          <BioLink
            className={styles.secondary}
            href="https://leonardocamacho.com"
            target="_blank"
            rel="noopener noreferrer nofollow"
            label="Conhecer meu site pessoal"
          >
            Conhecer meu site pessoal
          </BioLink>
          <BioLink
            className={styles.secondary}
            href="https://amplify.ia.br"
            target="_blank"
            rel="noopener noreferrer nofollow"
            label="Conhecer a Amplify"
          >
            Conhecer a Amplify
          </BioLink>
        </nav>

        <section className={styles.section} aria-labelledby="bio-aurora-title">
          <h2 id="bio-aurora-title">O que é a Aurora</h2>
          <p>
            A Aurora não é terapia, não é chat genérico e não é uma lista de tarefas. É um espaço
            para falar, se escutar melhor e transformar sentimentos, ideias e decisões em clareza.
          </p>
        </section>

        <section className={`${styles.section} ${styles.about}`} aria-labelledby="bio-about-title">
          <h2 id="bio-about-title">Quem está construindo</h2>
          <p>
            Eu sou <strong>Leonardo Camacho</strong>, criador da Aurora, AI Educator e Head de
            Soluções e Inteligência Artificial na Amplify. Ajudo líderes executivos a destravar o
            potencial de aplicação da IA e a implantar soluções em negócios de alto crescimento.
          </p>
        </section>

        <section className={styles.section} aria-label="Fechamento">
          <p className={styles.note}>
            No meu site pessoal, compartilho insights das minhas pesquisas de doutorado e conteúdos
            sobre estratégia, gestão e inteligência artificial.
          </p>
        </section>
      </div>
    </main>
  );
}
