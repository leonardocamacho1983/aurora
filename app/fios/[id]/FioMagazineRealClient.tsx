"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import styles from "../../timeline-volume-preview/Magazine.module.css";

export type FioMoment = {
  id: string;
  day: string;
  time: string;
  title: string;
  said: string;
  reading: string;
  readingHead: string;
  mood?: string;
  moodColor: string;
  duration: string;
  color: string;
  position: number;
};

function moodLabel(mood?: string) {
  if (!mood) return "registro";
  return mood === "sensivel" ? "sensível" : mood;
}

function MoodPill({ moment }: { moment: FioMoment }) {
  return (
    <span className={styles.mood}>
      <i style={{ background: moment.moodColor }} aria-hidden="true" />
      {moodLabel(moment.mood)} · {moment.duration}
    </span>
  );
}

function FioFlipPiece({
  moment,
  selected,
  onSelect,
}: {
  moment: FioMoment;
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

  return (
    <article
      className={[
        styles.piece,
        styles.flip,
        moment.position === 1 ? styles.feature : styles.note,
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
      style={{ "--fio": moment.color } as React.CSSProperties}
    >
      <div className={styles.card}>
        <div className={styles.flipInner} ref={innerRef}>
          <div className={`${styles.face} ${styles.front}`} ref={frontRef} aria-hidden={flipped}>
            {selected ? <span className={styles.selTag}>onde o fio está agora</span> : null}
            <p className={styles.meta}>{moment.day} · {moment.time}</p>
            {moment.position === 1 ? (
              <p className={styles.said}>{moment.said}</p>
            ) : (
              <>
                <h3 className={styles.noteTitle}>{moment.title}</h3>
                <p className={styles.excerpt}>{moment.said}</p>
              </>
            )}
            <div className={styles.chipRow}>
              <MoodPill moment={moment} />
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
            <h3 className={styles.head}>{moment.readingHead}</h3>
            <p className={moment.position === 1 ? styles.body : styles.readingText}>{moment.reading}</p>
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

export default function FioMagazineRealClient({
  title,
  summary,
  question,
  color,
  moments,
  continueHref,
}: {
  title: string;
  summary: string;
  question: string;
  color: string;
  moments: FioMoment[];
  continueHref: string;
}) {
  const [selectedId, setSelectedId] = useState(moments[moments.length - 1]?.id ?? moments[0]?.id);

  return (
    <main className={styles.stage} style={{ "--fio": color } as React.CSSProperties}>
      <Link className={styles.floatBack} href="/timeline">
        <span aria-hidden="true">←</span>
        Timeline
      </Link>

      <div className={styles.mag}>
        <section className={styles.cover}>
          <div className={styles.folioLine}>
            <span>Aurora Fios</span>
            <span>{moments.length} {moments.length === 1 ? "momento" : "momentos"}</span>
          </div>
          <div className={styles.coverMeta}>
            <span>● Um fio que ainda está vivo</span>
          </div>
          <h1 className={styles.fioTitle}>{title}</h1>
          <p>{summary}</p>
        </section>

        <section className={styles.pergunta}>
          <span className={styles.label}>✦ Pergunta viva</span>
          <q>{question}</q>
          <p>Você não precisa responder agora. A pergunta fica aqui, do lado dos momentos, enquanto o fio segue.</p>
        </section>

        <section className={styles.threadGrid} aria-label="Momentos deste fio">
          <aside className={styles.threadId}>
            <h2>{title}</h2>
            <p>{summary}</p>
            <span>voltou {moments.length} {moments.length === 1 ? "vez" : "vezes"}</span>
          </aside>
          <div className={styles.stream}>
            {moments.map((moment) => (
              <FioFlipPiece
                key={moment.id}
                moment={moment}
                selected={moment.id === selectedId}
                onSelect={() => setSelectedId(moment.id)}
              />
            ))}
          </div>
        </section>

        <section className={styles.continue} id="continuar">
          <div className={styles.continueIntro}>
            <span className={styles.label}>✦ Continuar a partir daqui</span>
            <h2>Você não precisa repetir tudo.</h2>
            <p>A Aurora retoma este fio com você. A próxima fala entra na mesma sequência.</p>
          </div>

          <Link className={styles.cBtn} href={continueHref}>
            Continuar fio <span aria-hidden="true">→</span>
          </Link>
        </section>

        <footer className={styles.colophon}>
          <Link className={styles.back} href="/timeline">← Voltar à Timeline</Link>
          <span>privado · só seu</span>
        </footer>
      </div>
    </main>
  );
}
