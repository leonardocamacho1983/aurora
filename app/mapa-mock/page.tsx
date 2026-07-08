import Link from "next/link";
import styles from "./MapaMock.module.css";

export const metadata = {
  title: "Mapa | Aurora",
  description: "Mock de alta fidelidade para a camada de padrões pessoais da Aurora.",
};

const focuses = [
  {
    title: "Carreira e direção",
    description: "Você pede clareza prática quando fala de trabalho, clientes e próximos passos.",
    count: "5 entradas",
    width: "82%",
    color: "var(--aurora-warm)",
    chips: ["2 fios", "hoje", "prática"],
  },
  {
    title: "Sono e descanso",
    description: "Aparece perto de cansaço mental, ansiedade e vontade de desligar.",
    count: "4 entradas",
    width: "62%",
    color: "var(--aurora-mint)",
    chips: ["1 fio", "noite", "gentil"],
  },
  {
    title: "Foco e organização",
    description: "Surge quando você tenta transformar uma ideia aberta em gesto concreto.",
    count: "3 entradas",
    width: "48%",
    color: "var(--aurora-blue)",
    chips: ["timeline", "direta"],
  },
];

const linkedEntries = [
  {
    time: "Hoje · 09:42",
    quote: "Quero organizar o que está travando meu próximo passo no trabalho.",
    focus: "Carreira e direção",
    thread: "Fio · clientes",
    color: "var(--aurora-warm)",
  },
  {
    time: "Ontem · 23:18",
    quote: "Estou cansada de pensar em tudo antes de dormir.",
    focus: "Sono e descanso",
    thread: "Quando pesar",
    color: "var(--aurora-mint)",
  },
];

const gestures = [
  {
    title: "Continuar carreira e direção",
    body: "Falar sem recomeçar do zero. A nova entrada fica na Timeline e ligada ao foco.",
  },
  {
    title: "Fechar o dia com menos ruído",
    body: "Uma fala curta para separar o que é fato, cobrança e próximo gesto possível.",
  },
];

export default function MapaMockPage() {
  return (
    <main className={styles.stage}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/diario">
          <i aria-hidden="true" />
          Aurora
        </Link>
        <time>sábado, 04 julho</time>
      </header>

      <div className={styles.shell}>
        <section className={styles.hero}>
          <div>
            <span className={styles.kicker}>Mapa</span>
            <h1>O que volta a aparecer</h1>
          </div>
          <div>
            <p>Nas últimas entradas, trabalho, foco e descanso aparecem como temas próximos.</p>
            <div className={styles.heroAside} aria-label="Resumo do mapa">
              <span className={styles.chip}>
                <i style={{ background: "var(--aurora-warm)" }} aria-hidden="true" />
                3 focos vivos
              </span>
              <span className={styles.chip}>
                <i style={{ background: "var(--aurora-mint)" }} aria-hidden="true" />
                1 padrão novo
              </span>
            </div>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="focos-vivos">
          <div className={styles.sectionTitle}>
            <h2 id="focos-vivos">Focos vivos</h2>
            <span>últimos 30 dias</span>
          </div>

          <div className={styles.focusGrid}>
            {focuses.map((focus) => (
              <article className={styles.focusCard} key={focus.title}>
                <div className={styles.focusHead}>
                  <h3 className={styles.focusTitle}>{focus.title}</h3>
                  <span className={styles.meta}>{focus.count}</span>
                </div>
                <p>{focus.description}</p>
                <div className={styles.focusBar} aria-hidden="true">
                  <span style={{ width: focus.width }} />
                </div>
                <div className={styles.chips}>
                  {focus.chips.map((chip) => (
                    <span className={styles.chip} key={chip}>
                      <i style={{ background: focus.color }} aria-hidden="true" />
                      {chip}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="padroes">
          <div className={styles.sectionTitle}>
            <h2 id="padroes">Padrões percebidos</h2>
            <span>com evidências</span>
          </div>

          <article className={styles.patternCard}>
            <span className={styles.label}>
              <span className={styles.orbMark} aria-hidden="true" />
              Leitura da Aurora
            </span>
            <h3 className={styles.patternText}>
              Quando trabalho aparece, foco e descanso costumam vir junto.
            </h3>
            <p>
              Visto em 4 momentos. A Aurora guarda esse sinal como contexto para próximas falas, sem transformar isso em diagnóstico.
            </p>
            <div className={styles.actions}>
              <Link className={styles.button} href="/timeline">
                Ver entradas
              </Link>
              <Link className={`${styles.button} ${styles.buttonPrimary}`} href="/diario">
                Falar sobre isso
              </Link>
            </div>
          </article>
        </section>

        <section className={styles.section} aria-labelledby="momentos-relacionados">
          <div className={styles.sectionTitle}>
            <h2 id="momentos-relacionados">Momentos relacionados</h2>
            <span>também na Timeline</span>
          </div>

          <div className={styles.entryList}>
            {linkedEntries.map((entry) => (
              <article className={styles.entryCard} key={entry.quote}>
                <div className={styles.entryTop}>
                  <span className={styles.meta}>{entry.time}</span>
                  <span className={styles.chip}>
                    <i style={{ background: entry.color }} aria-hidden="true" />
                    foco
                  </span>
                </div>
                <p className={styles.entryQuote}>“{entry.quote}”</p>
                <div className={styles.chips}>
                  <span className={styles.chip}>
                    <i style={{ background: entry.color }} aria-hidden="true" />
                    {entry.focus}
                  </span>
                  <span className={styles.chip}>
                    <i style={{ background: "var(--aurora-blue)" }} aria-hidden="true" />
                    {entry.thread}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="proximos-gestos">
          <div className={styles.sectionTitle}>
            <h2 id="proximos-gestos">Próximos gestos</h2>
            <span>opcionais</span>
          </div>

          <div className={styles.gestureGrid}>
            {gestures.map((gesture) => (
              <article className={styles.gestureCard} key={gesture.title}>
                <h3 className={styles.gestureTitle}>{gesture.title}</h3>
                <p>{gesture.body}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <nav className={styles.bottomNav} aria-label="Navegação principal">
        <Link href="/diario">Diário</Link>
        <Link href="/timeline">Timeline</Link>
        <Link href="/mapa-mock" aria-current="page">
          Mapa
        </Link>
        <Link href="/account">Perfil</Link>
      </nav>
    </main>
  );
}
