"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { selectedThreadMoments, threadMap, type Mood, type TimelinePiece } from "../../data";
import styles from "../../Magazine.module.css";

const moodVar: Record<Mood, string> = {
  leve: "var(--mood-leve)",
  calmo: "var(--mood-calmo)",
  pesado: "var(--mood-pesado)",
  sensivel: "var(--mood-sensivel)",
  ansioso: "var(--mood-ansioso)",
};

type OrbState = "idle" | "recording" | "reflecting" | "saved";

const orbCopy: Record<OrbState, { label: string; hint: string }> = {
  idle: { label: "Gravar novo momento", hint: "Pode falar no seu tempo." },
  recording: { label: "Ouvindo você…", hint: "Toque de novo quando terminar." },
  reflecting: { label: "Aurora está retomando o fio…", hint: "Ela está pensando no que você disse." },
  saved: { label: "Guardado neste fio.", hint: "Você pode continuar ou pausar aqui." },
};

function MoodPill({ mood, duration }: { mood?: Mood; duration?: string }) {
  if (!mood) return null;
  return (
    <span className={styles.mood}>
      <i style={{ background: moodVar[mood] }} aria-hidden="true" />
      {mood === "sensivel" ? "sensível" : mood}
      {duration ? ` · ${duration}` : null}
    </span>
  );
}

function FioFlipPiece({
  piece,
  selected,
  onSelect,
}: {
  piece: TimelinePiece;
  selected: boolean;
  onSelect: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const innerRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    function size() {
      const front = frontRef.current?.offsetHeight ?? 0;
      const back = backRef.current?.offsetHeight ?? 0;
      if (innerRef.current) innerRef.current.style.height = `${Math.max(front, back)}px`;
    }
    size();
    document.fonts?.ready.then(size);
    window.addEventListener("resize", size);
    return () => window.removeEventListener("resize", size);
  }, []);

  if (piece.kind === "pull") {
    return (
      <aside className={`${styles.piece} ${styles.pull}`}>
        <q>{piece.said}</q>
        <span>Aurora · sobre este fio</span>
      </aside>
    );
  }

  if (piece.kind === "recorte") {
    return (
      <aside
        className={`${styles.piece} ${styles.recorte} ${selected ? styles.selected : ""}`}
        onClick={onSelect}
        style={{ "--fio": threadMap.limites.color } as React.CSSProperties}
      >
        <p>{piece.said}</p>
        <span className={styles.pieceMeta}>ponto · onde o fio começou · {piece.duration}</span>
      </aside>
    );
  }

  const feature = piece.kind === "feature";
  return (
    <article
      className={[
        styles.piece,
        styles.flip,
        feature ? styles.feature : styles.note,
        selected ? styles.selected : "",
        flipped ? styles.flipped : "",
      ].join(" ")}
      tabIndex={0}
      aria-current={selected ? "true" : undefined}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("button,a")) return;
        onSelect();
      }}
      onFocus={onSelect}
      style={{ "--fio": threadMap.limites.color } as React.CSSProperties}
    >
      <div className={styles.card}>
        <div className={styles.flipInner} ref={innerRef}>
          <div className={`${styles.face} ${styles.front}`} ref={frontRef} aria-hidden={flipped}>
            {selected ? <span className={styles.selTag}>onde o fio está agora</span> : null}
            <p className={styles.meta}>{piece.day} · {piece.time}</p>
            {feature ? (
              <p className={styles.said}>{piece.said}</p>
            ) : (
              <>
                <h3 className={styles.noteTitle}>{piece.title}</h3>
                <p className={styles.excerpt}>{piece.excerpt}</p>
              </>
            )}
            <div className={styles.chipRow}>
              <MoodPill mood={piece.mood} duration={piece.duration} />
            </div>
            <button
              className={styles.flipBtn}
              type="button"
              aria-expanded={flipped}
              onClick={(event) => {
                event.stopPropagation();
                setFlipped(true);
              }}
            >
              Ver Aurora <span aria-hidden="true">✦</span>
            </button>
          </div>
          <div className={`${styles.face} ${styles.backFace}`} ref={backRef} aria-hidden={!flipped}>
            <span className={styles.label}>✦ a leitura da Aurora</span>
            {piece.reading?.head ? <h3 className={styles.head}>{piece.reading.head}</h3> : null}
            <p className={feature ? styles.body : styles.readingText}>{piece.reading?.body}</p>
            <button
              className={styles.flipBtn}
              type="button"
              aria-expanded={flipped}
              onClick={(event) => {
                event.stopPropagation();
                setFlipped(false);
              }}
            >
              Voltar ao registro <span aria-hidden="true">↩</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function FioMagazineClient() {
  const [selectedId, setSelectedId] = useState(selectedThreadMoments[0].id);
  const [stageOpen, setStageOpen] = useState(false);
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [showResult, setShowResult] = useState(false);
  const thread = threadMap.limites;

  function advanceOrb() {
    if (orbState === "idle" || orbState === "saved") {
      setShowResult(false);
      setOrbState("recording");
      return;
    }
    if (orbState === "recording") {
      setOrbState("reflecting");
      window.setTimeout(() => {
        setShowResult(true);
        setOrbState("idle");
      }, 2200);
    }
  }

  return (
    <main className={styles.stage} style={{ "--fio": thread.color } as React.CSSProperties}>
      <Link className={styles.floatBack} href="/timeline-volume-preview">
        <span aria-hidden="true">←</span>
        Timeline
      </Link>

      <div className={styles.mag}>
        <section className={styles.cover}>
          <div className={styles.folioLine}>
            <span>Aurora Fios</span>
            <span>7 momentos · 16 dias</span>
          </div>
          <div className={styles.coverMeta}>
            <span>● Um fio que ainda está vivo</span>
          </div>
          <h1 className={styles.fioTitle}>{thread.title}</h1>
          <p>Momentos que voltaram com formas diferentes.</p>
        </section>

        <section className={styles.pergunta}>
          <span className={styles.label}>✦ Pergunta viva</span>
          <q>{thread.question}</q>
          <p>Você não precisa responder agora. A pergunta fica aqui, do lado dos momentos, enquanto o fio segue.</p>
        </section>

        <section className={styles.threadGrid} aria-label="Momentos deste fio">
          <aside className={styles.threadId}>
            <h2>{thread.title}</h2>
            <p>{thread.desc}</p>
            <span>voltou 7 vezes</span>
          </aside>
          <div className={styles.stream}>
            {selectedThreadMoments.map((piece) => (
              <FioFlipPiece
                key={piece.id}
                piece={piece}
                selected={piece.id === selectedId}
                onSelect={() => setSelectedId(piece.id)}
              />
            ))}
          </div>
        </section>

        <section className={styles.continue} id="continuar">
          <div className={styles.continueIntro}>
            <span className={styles.label}>✦ Continuar a partir daqui</span>
            <h2>Você não precisa repetir tudo.</h2>
            <p>A Aurora retoma este fio com você. É só falar de onde você está agora.</p>
          </div>

          {!stageOpen ? (
            <button
              className={styles.cBtn}
              type="button"
              aria-expanded={stageOpen}
              onClick={() => {
                setStageOpen(true);
                setOrbState("idle");
              }}
            >
              Continuar fio <span aria-hidden="true">→</span>
            </button>
          ) : (
            <div className={styles.orbStage} data-state={orbState}>
              <button className={styles.largeOrb} type="button" aria-label="Gravar novo momento" onClick={advanceOrb} />
              <div className={styles.orbLabel}>{orbCopy[orbState].label}</div>
              <div className={styles.orbHint}>{orbCopy[orbState].hint}</div>
              {showResult ? (
                <article className={styles.result} aria-live="polite">
                  <span className={styles.resultLabel}>✦ Aurora retomou o fio</span>
                  <p>
                    Você voltou a este fio falando mais baixo, mas falando. Da última vez a frase ficou entalada;
                    desta vez ela encontrou um caminho. O limite não chegou pronto — ele está sendo dito, aos poucos,
                    na sua voz.
                  </p>
                  <button
                    className={styles.saveBtn}
                    type="button"
                    onClick={() => {
                      setShowResult(false);
                      setOrbState("saved");
                    }}
                  >
                    Guardar no fio
                  </button>
                </article>
              ) : null}
            </div>
          )}
        </section>

        <footer className={styles.colophon}>
          <Link className={styles.back} href="/timeline-volume-preview">← Voltar à Timeline</Link>
          <span>privado · só seu</span>
        </footer>
      </div>
    </main>
  );
}
