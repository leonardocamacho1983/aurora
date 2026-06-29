"use client";

import Link from "next/link";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { buildTimelineGroups, threadMap, type Mood, type TimelinePiece } from "./data";
import styles from "./Magazine.module.css";

const moodLabel: Record<Mood, string> = {
  leve: "leve",
  calmo: "calmo",
  pesado: "pesado",
  sensivel: "sensível",
  ansioso: "ansioso",
};

const moodVar: Record<Mood, string> = {
  leve: "var(--mood-leve)",
  calmo: "var(--mood-calmo)",
  pesado: "var(--mood-pesado)",
  sensivel: "var(--mood-sensivel)",
  ansioso: "var(--mood-ansioso)",
};

function ThreadChip({ fio }: { fio: NonNullable<TimelinePiece["fio"]> }) {
  const thread = threadMap[fio];
  return (
    <Link
      className={styles.fioChip}
      href={`/timeline-volume-preview/fios/${thread.id}`}
      style={{ "--fio": thread.color } as React.CSSProperties}
      onClick={(event) => event.stopPropagation()}
    >
      <i aria-hidden="true" />
      Fio · {thread.title}
    </Link>
  );
}

function MoodPill({ mood, duration }: { mood?: Mood; duration?: string }) {
  if (!mood) return null;
  return (
    <span className={styles.mood}>
      <i style={{ background: moodVar[mood] }} aria-hidden="true" />
      {moodLabel[mood]}
      {duration ? ` · ${duration}` : null}
    </span>
  );
}

function FlipPiece({ piece, feature = false }: { piece: TimelinePiece; feature?: boolean }) {
  const [flipped, setFlipped] = useState(false);
  const innerRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const thread = piece.fio ? threadMap[piece.fio] : null;

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

  function openThread() {
    if (thread) window.location.href = `/timeline-volume-preview/fios/${thread.id}`;
  }

  const className = [
    styles.piece,
    styles.flip,
    feature ? styles.feature : styles.note,
    flipped ? styles.flipped : "",
  ].join(" ");

  return (
    <article
      className={className}
      data-clickable={thread ? "true" : undefined}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("button,a")) return;
        openThread();
      }}
      style={{ "--fio": thread?.color ?? "var(--accent)" } as React.CSSProperties}
      tabIndex={0}
    >
      <div className={styles.card}>
        <div className={styles.flipInner} ref={innerRef}>
          <div className={`${styles.face} ${styles.front}`} ref={frontRef} aria-hidden={flipped}>
            {feature ? (
              <>
                <span className={styles.label}>Você disse</span>
                <p className={styles.said}>{piece.said}</p>
              </>
            ) : (
              <>
                <p className={styles.meta}>{piece.time} · registro</p>
                <h3 className={styles.noteTitle}>{piece.title}</h3>
                <p className={styles.excerpt}>{piece.excerpt}</p>
              </>
            )}
            <div className={styles.chipRow}>
              {piece.fio ? <ThreadChip fio={piece.fio} /> : null}
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

function Piece({ piece, index }: { piece: TimelinePiece; index: number }) {
  if (piece.kind === "pull") {
    return (
      <aside className={`${styles.piece} ${styles.pull}`}>
        <q>{piece.said}</q>
        <span>Aurora · sobre o fio Limites e presença</span>
      </aside>
    );
  }

  if (piece.kind === "recorte") {
    return (
      <aside className={`${styles.piece} ${styles.recorte}`} style={{ "--fio": "var(--accent)" } as React.CSSProperties}>
        <p>{piece.said}</p>
        <span className={styles.pieceMeta}>✦ ponto · {piece.duration}</span>
      </aside>
    );
  }

  if (piece.kind === "fio" || index === 6) {
    const thread = threadMap.limites;
    return (
      <div className={`${styles.piece} ${styles.fioCol}`} style={{ "--fio": thread.color } as React.CSSProperties}>
        <span className={styles.label}>Fio em curso</span>
        <h3>{thread.title}</h3>
        <p>{thread.desc} Um tema que ainda está pedindo lugar.</p>
        <Link className={styles.fioChip} href={`/timeline-volume-preview/fios/${thread.id}`}>
          <i aria-hidden="true" />
          Abrir o fio →
        </Link>
      </div>
    );
  }

  return <FlipPiece piece={piece} feature={piece.kind === "feature"} />;
}

export default function TimelineMagazineClient() {
  const groups = useMemo(() => buildTimelineGroups(), []);

  return (
    <main className={styles.stage}>
      <header className={styles.bar}>
        <Link className={styles.brand} href="/timeline-volume-preview">
          <i aria-hidden="true" />
          Aurora
        </Link>
        <nav aria-label="Seções da timeline">
          <a href="#hoje">Hoje</a>
          <a href="#ontem">Ontem</a>
          <a href="#sábado-26">Sábado</a>
        </nav>
        <time>terça, 29 de junho</time>
      </header>

      <div className={styles.mag}>
        <section className={styles.cover}>
          <div className={styles.coverMeta}>
            <span>142 momentos guardados</span>
            <span>privado · só seu</span>
          </div>
          <h1 className={styles.wordmark}>Timeline</h1>
          <p>Um lugar para voltar ao que você disse, ao que a Aurora percebeu e aos fios que ainda estão vivos.</p>
        </section>

        {groups.map((group) => (
          <section className={styles.daySpread} id={group.id} key={group.id}>
            <header className={styles.dayHead}>
              <h2>{group.day}</h2>
              <p>{group.dek}</p>
              <span>{group.pieces.length} momentos</span>
            </header>
            <div className={styles.stream}>
              {group.pieces.map((piece, index) => (
                <Piece key={piece.id} piece={piece} index={index} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
