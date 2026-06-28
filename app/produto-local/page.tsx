"use client";

import { useEffect, useMemo, useState } from "react";
import { Orb } from "@/components/orb/Orb";
import styles from "./ProdutoLocal.module.css";

type Screen = "diario" | "resultado" | "timeline" | "fios";
type DiaryState = "idle" | "recording" | "processing";

const entries = [
  {
    id: "1",
    day: "Hoje",
    time: "09:41",
    mood: "calmo",
    color: "var(--aurora-mint)",
    text: "Eu percebi que venho adiando a mesma conversa porque queria chegar com tudo resolvido.",
    reflection:
      "Aparece um padrao de esperar clareza total antes de agir. Talvez o proximo passo nao seja decidir tudo, mas abrir uma conversa menor, com menos performance.",
  },
  {
    id: "2",
    day: "Ontem",
    time: "22:16",
    mood: "sensivel",
    color: "var(--aurora-warm)",
    text: "Falei por alguns minutos sobre cansaco, mas no fundo parecia mais uma necessidade de espaco.",
    reflection:
      "O cansaco parece menos ligado a falta de energia e mais ao excesso de resposta para todo mundo.",
  },
  {
    id: "3",
    day: "Ter",
    time: "18:08",
    mood: "leve",
    color: "var(--aurora-blue)",
    text: "Quando parei de tentar explicar tudo, ficou mais facil notar o que eu queria fazer primeiro.",
    reflection:
      "Quando voce reduz a explicacao, o desejo pratico aparece mais rapido.",
  },
];

const threads = [
  {
    title: "Mudanca de trabalho",
    count: 4,
    mood: "var(--aurora-warm)",
    summary:
      "Voce volta a esse tema quando precisa escolher entre seguranca e espaco para criar.",
  },
  {
    title: "Limites com pessoas proximas",
    count: 3,
    mood: "var(--aurora-pink)",
    summary:
      "O fio aparece sempre que voce tenta responder rapido antes de entender o que sente.",
  },
  {
    title: "Ritmo da semana",
    count: 2,
    mood: "var(--aurora-mint)",
    summary:
      "Ha um padrao de clareza nos dias em que voce comeca mais devagar.",
  },
];

const audioLevels = [0.35, 0.62, 0.44, 0.8, 0.52, 0.94, 0.64, 0.42, 0.75, 0.5, 0.88, 0.46, 0.58];

export default function ProdutoLocalPage() {
  const [screen, setScreen] = useState<Screen>("diario");
  const [diaryState, setDiaryState] = useState<DiaryState>("idle");
  const [expanded, setExpanded] = useState(false);
  const [activeThread, setActiveThread] = useState(0);

  useEffect(() => {
    if (diaryState !== "processing") return;
    const timeout = window.setTimeout(() => {
      setScreen("resultado");
      setDiaryState("idle");
    }, 1400);
    return () => window.clearTimeout(timeout);
  }, [diaryState]);

  const activeThreadData = threads[activeThread];
  const visibleEntries = useMemo(() => entries.slice(0, activeThread + 1 || 1), [activeThread]);

  function startDiary() {
    if (diaryState === "idle") {
      setDiaryState("recording");
      return;
    }
    if (diaryState === "recording") {
      setDiaryState("processing");
    }
  }

  function openScreen(next: Screen) {
    setScreen(next);
    setDiaryState("idle");
  }

  return (
    <main className={styles.stage}>
      <header className={styles.topbar}>
        <button className={styles.brand} type="button" onClick={() => openScreen("diario")}>
          <span className={styles.brandOrb} aria-hidden="true" />
          <span>Aurora</span>
        </button>
        <nav className={styles.desktopNav} aria-label="Produto">
          <button type="button" data-active={screen === "diario"} onClick={() => openScreen("diario")}>
            Diario
          </button>
          <button type="button" data-active={screen === "timeline"} onClick={() => openScreen("timeline")}>
            Timeline
          </button>
          <button type="button" data-active={screen === "fios"} onClick={() => openScreen("fios")}>
            Fios
          </button>
        </nav>
        <span className={styles.contextLabel}>Esta semana · 4 registros</span>
      </header>

      {screen === "diario" && (
        <section className={styles.diaryView} aria-labelledby="diary-title">
          <div className={styles.orbColumn}>
            <div className={styles.heroOrb}>
              <Orb
                state={diaryState === "processing" ? "reflecting" : diaryState === "recording" ? "recording" : "idle"}
                onClick={startDiary}
                audioLevels={diaryState === "recording" ? audioLevels : undefined}
                ariaLabel={diaryState === "recording" ? "Encerrar pelo orb" : "Comecar pelo orb"}
              />
            </div>
          </div>
          <div className={styles.diaryCopy}>
            <p className={styles.kicker}>
              {diaryState === "recording"
                ? "Gravando"
                : diaryState === "processing"
                  ? "Organizando"
                  : "Diario"}
            </p>
            <h1 id="diary-title" className="font-serif">
              {diaryState === "recording"
                ? "Pode falar no seu tempo."
                : diaryState === "processing"
                  ? "Aproveite para respirar."
                  : "O que esta vivo em voce agora?"}
            </h1>
            <p>
              {diaryState === "recording"
                ? "A Aurora so precisa da sua voz. Sem transcricao ao vivo."
                : diaryState === "processing"
                  ? "Ela esta separando sinais, padroes e proximos passos."
                  : "Nao precisa organizar antes. Toque no orb e comece pelo que apareceu."}
            </p>
            <div className={styles.diaryActions}>
              <button type="button" onClick={startDiary}>
                {diaryState === "recording" ? "Encerrar e refletir" : "Comecar a falar"}
              </button>
              <button type="button" onClick={() => openScreen("timeline")}>
                Linha do tempo
              </button>
            </div>
          </div>
        </section>
      )}

      {screen === "resultado" && (
        <section className={styles.resultView} aria-labelledby="result-title">
          <div className={styles.resultOrb}>
            <Orb state="idle" decorative />
          </div>
          <article className={styles.resultCard}>
            <span className={styles.sparkle} aria-hidden="true">✦</span>
            <h1 id="result-title" className="font-serif">
              {expanded
                ? entries[0].reflection
                : "Aparece um padrao de esperar clareza total antes de agir. Talvez o proximo passo seja menor."}
            </h1>
            <button className={styles.textButton} type="button" onClick={() => setExpanded((value) => !value)}>
              {expanded ? "Recolher devolutiva" : "Ler devolutiva inteira"}
            </button>
            <div className={styles.resultDivider} />
            <div className={styles.resultActions}>
              <button type="button" onClick={() => openScreen("diario")}>
                Continuar este registro
              </button>
              <button type="button" onClick={() => openScreen("diario")}>
                Novo momento
              </button>
              <button type="button" onClick={() => openScreen("timeline")}>
                Linha do tempo
              </button>
            </div>
          </article>
        </section>
      )}

      {screen === "timeline" && (
        <section className={styles.timelineView} aria-labelledby="timeline-title">
          <aside className={styles.timelineAside}>
            <span className={styles.miniOrb} aria-hidden="true" />
            <h1 id="timeline-title">Linha do tempo</h1>
            <div className={styles.segmented} aria-label="Periodo">
              <button type="button" data-active>Semana</button>
              <button type="button">Mes</button>
              <button type="button">Tudo</button>
            </div>
            <button className={styles.primaryPill} type="button" onClick={() => openScreen("diario")}>
              Novo registro
            </button>
          </aside>
          <div className={styles.timelineList}>
            {entries.map((entry) => (
              <button className={styles.timelineCard} type="button" key={entry.id} onClick={() => openScreen("fios")}>
                <span className={styles.cardMeta}>
                  <span style={{ background: entry.color }} />
                  {entry.day} · {entry.time}
                </span>
                <strong className="font-serif">{entry.text}</strong>
                <span>{entry.reflection}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {screen === "fios" && (
        <section className={styles.threadView} aria-labelledby="thread-title">
          <aside className={styles.threadRail}>
            <h1 id="thread-title">Fios</h1>
            <p>Linhas de pensamento em andamento.</p>
            <div className={styles.threadTabs}>
              {threads.map((thread, index) => (
                <button
                  type="button"
                  key={thread.title}
                  data-active={activeThread === index}
                  onClick={() => setActiveThread(index)}
                >
                  <span style={{ background: thread.mood }} />
                  {thread.title}
                </button>
              ))}
            </div>
          </aside>
          <article className={styles.threadReader}>
            <div className={styles.threadHeader}>
              <span>{activeThreadData.count} momentos</span>
              <button type="button" onClick={() => openScreen("diario")}>Adicionar momento</button>
            </div>
            <h2>{activeThreadData.title}</h2>
            <section className={styles.threadPattern}>
              <p>Padrao do fio</p>
              <strong>{activeThreadData.summary}</strong>
            </section>
            <div className={styles.momentStack}>
              {visibleEntries.map((entry, index) => (
                <section className={styles.momentCard} key={entry.id}>
                  <span>Momento {index + 1} · {entry.day}</span>
                  <p className="font-serif">{entry.text}</p>
                  <small>{entry.reflection}</small>
                </section>
              ))}
            </div>
          </article>
        </section>
      )}

      <nav className={styles.bottomNav} aria-label="Navegacao principal">
        <button type="button" data-active={screen === "diario"} onClick={() => openScreen("diario")}>Diario</button>
        <button type="button" data-active={screen === "timeline"} onClick={() => openScreen("timeline")}>Timeline</button>
        <button type="button" data-active={screen === "fios"} onClick={() => openScreen("fios")}>Fios</button>
      </nav>
    </main>
  );
}
