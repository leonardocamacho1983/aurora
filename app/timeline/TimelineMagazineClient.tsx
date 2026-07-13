"use client";

import type { CSSProperties, KeyboardEvent } from "react";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { BottomNav } from "@/components/product/BottomNav";
import { ProductNav } from "@/components/product/ProductNav";
import { trackAurora } from "@/lib/analytics/client";
import type { FocusSignal } from "@/lib/mapa/focus";
import styles from "./Timeline.module.css";

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
  continueHref: string;
  thread: MagazineThread | null;
  focus: FocusSignal | null;
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
      style={{ "--fio": thread.color } as CSSProperties}
      onClick={(event) => event.stopPropagation()}
    >
      <i aria-hidden="true" />
      Fio · {thread.title}
    </Link>
  );
}

function FocusChip({ focus }: { focus: FocusSignal }) {
  return (
    <Link
      className={styles.focusChip}
      href={`/mapa/${focus.key}`}
      style={{ "--focus-color": focus.color } as CSSProperties}
      onClick={(event) => {
        event.stopPropagation();
        trackAurora("product_mapa_focus_chip_clicked", {
          source: "timeline",
          surface: "timeline_card",
          focus_key: focus.key,
        });
      }}
    >
      <i aria-hidden="true" />
      {focus.label}
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

function EntryAction({ piece, secondary = false }: { piece: MagazinePiece; secondary?: boolean }) {
  return (
    <Link
      className={secondary ? `${styles.flipBtn} ${styles.secondaryAction}` : styles.flipBtn}
      href={secondary ? piece.continueHref : piece.href}
      onClick={(event) => event.stopPropagation()}
    >
      {secondary ? "Continuar fio" : "Abrir fio"} <span aria-hidden="true">→</span>
    </Link>
  );
}

function openPiece(piece: MagazinePiece) {
  window.location.assign(piece.href);
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

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    if ((event.target as HTMLElement).closest("button,a")) return;
    event.preventDefault();
    openPiece(piece);
  }

  return (
    <article
      className={className}
      data-clickable="true"
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("button,a")) return;
        openPiece(piece);
      }}
      onKeyDown={onKeyDown}
      style={{ "--fio": piece.thread?.color ?? "var(--accent)" } as CSSProperties}
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
              {piece.focus ? <FocusChip focus={piece.focus} /> : null}
              {piece.thread ? <ThreadChip thread={piece.thread} /> : null}
              <MoodPill piece={piece} />
            </div>
            <div className={styles.actionRow}>
              <EntryAction piece={piece} />
              <EntryAction piece={piece} secondary />
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
          </div>
          <div className={`${styles.face} ${styles.backFace}`} ref={backRef} aria-hidden={!flipped}>
            <span className={styles.label}>✦ a leitura da Aurora</span>
            <h3 className={styles.head}>{piece.reading.head}</h3>
            <p className={feature ? styles.body : styles.readingText}>{piece.reading.body}</p>
            <div className={styles.actionRow}>
              <EntryAction piece={piece} />
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
      </div>
    </article>
  );
}

function ThreadCallout({ thread }: { thread: MagazineThread }) {
  return (
    <div className={`${styles.piece} ${styles.fioCol}`} style={{ "--fio": thread.color } as CSSProperties}>
      <span className={styles.label}>Fio em curso</span>
      <h3>{thread.title}</h3>
      <p>
        {thread.desc}{" "}
        {thread.momentCount > 1 ? `Voltou ${thread.momentCount} vezes.` : "Um tema que ainda está pedindo lugar."}
      </p>
      <Link className={styles.fioChip} href={thread.href}>
        <i aria-hidden="true" />
        Abrir o fio →
      </Link>
    </div>
  );
}

function Piece({ piece, index }: { piece: MagazinePiece; index: number }) {
  if (index === 3 && piece.thread && piece.thread.momentCount > 1) {
    return (
      <>
        <ThreadCallout thread={piece.thread} />
        <FlipPiece piece={piece} feature={piece.kind === "feature"} />
      </>
    );
  }

  return <FlipPiece piece={piece} feature={piece.kind === "feature"} />;
}

export default function TimelineMagazineClient({
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
      <ProductNav active="timeline" contextLabel={generatedAtLabel} />
      <header className={`${styles.bar} ${styles.mobileBar}`}>
        <Link className={styles.brand} href="/timeline">
          <i aria-hidden="true" />
          Aurora
        </Link>
        <nav aria-label="Seções da timeline">
          <Link href="/diario">Diário</Link>
          <Link href="/timeline" aria-current="page">
            Timeline
          </Link>
          <Link href="/mapa">Mapa</Link>
          <Link href="/account">Perfil</Link>
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
            <p>Quando quiser falar, seus momentos aparecem aqui como memória e continuidade.</p>
            <Link className={styles.flipBtn} href="/diario">
              Nova entrada <span aria-hidden="true">→</span>
            </Link>
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
          <Link className={styles.back} href="/diario">
            ← Voltar ao diário
          </Link>
          <span>privado · só seu</span>
        </footer>
      </div>
      <BottomNav active="timeline" />
    </main>
  );
}
