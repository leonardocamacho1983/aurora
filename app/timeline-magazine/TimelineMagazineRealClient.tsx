"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import styles from "../timeline-volume-preview/Magazine.module.css";

export type MagazineThread = {
  id: string;
  title: string;
  color: string;
  href: string;
  desc: string;
  momentCount: number;
};

export type MagazinePiece = {
  id: string;
  kind: "feature" | "note";
  time: string;
  href: string;
  thread: MagazineThread | null;
  mood?: string;
  moodColor: string;
  duration: string;
  title: string;
  said: string;
  excerpt: string;
  reading: {
    head: string;
    body: string;
  };
};

export type MagazineDayGroup = {
  id: string;
  day: string;
  dek: string;
  pieces: MagazinePiece[];
};

function moodLabel(mood?: string) {
  if (!mood) return null;
  return mood === "sensivel" ? "sensível" : mood;
}

function ThreadChip({ thread }: { thread: MagazineThread }) {
  return (
    <Link
      className={styles.fioChip}
      href={thread.href}
      style={{ "--fio": thread.color } as React.CSSProperties}
      onClick={(event) => event.stopPropagation()}
    >
      <i aria-hidden="true" />
      Fio · {thread.title}
    </Link>
  );
}

function MoodPill({ piece }: { piece: MagazinePiece }) {
  return (
    <span className={styles.mood}>
      <i style={{ background: piece.moodColor }} aria-hidden="true" />
      {moodLabel(piece.mood) ?? "registro"} · {piece.duration}
    </span>
  );
}

function FlipPiece({ piece, feature = false }: { piece: MagazinePiece; feature?: boolean }) {
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

  const className = [
    styles.piece,
    styles.flip,
    feature ? styles.feature : styles.note,
    flipped ? styles.flipped : "",
  ].join(" ");

  return (
    <article
      className={className}
      data-clickable="true"
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("button,a")) return;
        window.location.href = piece.href;
      }}
      style={{ "--fio": piece.thread?.color ?? "var(--accent)" } as React.CSSProperties}
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
              {piece.thread ? <ThreadChip thread={piece.thread} /> : null}
              <MoodPill piece={piece} />
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
            <h3 className={styles.head}>{piece.reading.head}</h3>
            <p className={feature ? styles.body : styles.readingText}>{piece.reading.body}</p>
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

function ThreadCallout({ thread }: { thread: MagazineThread }) {
  return (
    <div className={`${styles.piece} ${styles.fioCol}`} style={{ "--fio": thread.color } as React.CSSProperties}>
      <span className={styles.label}>Fio em curso</span>
      <h3>{thread.title}</h3>
      <p>
        {thread.desc} {thread.momentCount > 1 ? `Voltou ${thread.momentCount} vezes.` : "Um tema que ainda está pedindo lugar."}
      </p>
      <Link className={styles.fioChip} href={thread.href}>
        <i aria-hidden="true" />
        Abrir o fio →
      </Link>
    </div>
  );
}

function Piece({ piece, index }: { piece: MagazinePiece; index: number }) {
  if (index === 3 && piece.thread) {
    return <ThreadCallout thread={piece.thread} />;
  }

  return <FlipPiece piece={piece} feature={piece.kind === "feature"} />;
}

export default function TimelineMagazineRealClient({
  groups,
  totalCount,
  generatedAtLabel,
}: {
  groups: MagazineDayGroup[];
  totalCount: number;
  generatedAtLabel: string;
}) {
  return (
    <main className={styles.stage}>
      <header className={styles.bar}>
        <Link className={styles.brand} href="/timeline">
          <i aria-hidden="true" />
          Aurora
        </Link>
        <nav aria-label="Seções da timeline">
          <Link href="/diario">Diário</Link>
          <Link href="/fios">Fios</Link>
          <Link href="/account">Conta</Link>
        </nav>
        <time>{generatedAtLabel}</time>
      </header>

      <div className={styles.mag}>
        <section className={styles.cover}>
          <div className={styles.coverMeta}>
            <span>{totalCount} momentos guardados</span>
            <span>privado · só seu</span>
          </div>
          <h1 className={styles.wordmark}>Timeline</h1>
          <p>
            Sua timeline reúne o que você disse, o que a Aurora percebeu e os fios que seguem vivos.
          </p>
        </section>

        {groups.length === 0 ? (
          <section className={styles.cover}>
            <div className={styles.coverMeta}>
              <span>primeiro registro</span>
            </div>
            <h2 className={styles.fioTitle}>Sua linha começa no diário.</h2>
            <p>Grave uma entrada para ver os momentos aparecerem aqui.</p>
          </section>
        ) : (
          groups.map((group) => (
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
          ))
        )}

        <footer className={styles.colophon}>
          <Link className={styles.back} href="/diario">← Voltar ao diário</Link>
          <span>privado · só seu</span>
        </footer>
      </div>
    </main>
  );
}
