"use client";

import { useId, useState, type HTMLAttributes, type MouseEvent, type ReactNode } from "react";
import { Button } from "@/components/ui";
import styles from "./FlipCard.module.css";

type FlipCardProps = HTMLAttributes<HTMLElement> & {
  front: ReactNode;
  back: ReactNode;
  frontMeta?: string;
  backMeta?: string;
  frontSupport?: ReactNode;
  backSupport?: ReactNode;
  requiresExpansionBeforeFlip?: boolean;
  initialExpanded?: boolean;
  flipLabel?: string;
  returnLabel?: string;
  expandLabel?: string;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function FlipCard({
  front,
  back,
  frontMeta = "Registro",
  backMeta = "Aurora",
  frontSupport,
  backSupport,
  requiresExpansionBeforeFlip = false,
  initialExpanded = false,
  flipLabel = "Ver Aurora",
  returnLabel = "Voltar ao registro",
  expandLabel = "Ver tudo",
  className,
  onClick,
  ...props
}: FlipCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [expanded, setExpanded] = useState(initialExpanded || !requiresExpansionBeforeFlip);
  const frontId = useId();
  const backId = useId();

  function handlePrimaryAction() {
    if (flipped) {
      setFlipped(false);
      return;
    }

    if (requiresExpansionBeforeFlip && !expanded) {
      setExpanded(true);
      return;
    }

    setFlipped(true);
  }

  function handleCardClick(event: MouseEvent<HTMLElement>) {
    onClick?.(event);

    if (event.defaultPrevented) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest("button, a")) {
      return;
    }

    handlePrimaryAction();
  }

  return (
    <article
      className={cx(styles.flipCard, className)}
      data-flipped={flipped ? "true" : "false"}
      onClick={handleCardClick}
      {...props}
    >
      <div className={styles.frame}>
        <div className={styles.inner}>
          <section className={cx(styles.face, styles.front)} aria-hidden={flipped} id={frontId}>
            <div>
              <div className={styles.faceHeader}>
                <p className={styles.meta}>{frontMeta}</p>
              </div>
              <p className={cx(styles.text, requiresExpansionBeforeFlip && !expanded && styles.clamped)}>
                {front}
              </p>
              {frontSupport ? <p className={styles.support}>{frontSupport}</p> : null}
            </div>

            <div className={styles.actions}>
              <Button
                aria-controls={requiresExpansionBeforeFlip && !expanded ? frontId : backId}
                aria-expanded={requiresExpansionBeforeFlip ? expanded : undefined}
                onClick={handlePrimaryAction}
                tabIndex={flipped ? -1 : 0}
                variant={requiresExpansionBeforeFlip && !expanded ? "secondary" : "primary"}
              >
                {requiresExpansionBeforeFlip && !expanded ? expandLabel : flipLabel}
              </Button>
            </div>
          </section>

          <section className={cx(styles.face, styles.back)} aria-hidden={!flipped} id={backId}>
            <div>
              <div className={styles.faceHeader}>
                <p className={styles.meta}>{backMeta}</p>
                <span className={styles.avatar} aria-hidden="true" />
              </div>
              <p className={styles.text}>{back}</p>
              {backSupport ? <p className={styles.support}>{backSupport}</p> : null}
            </div>

            <div className={styles.actions}>
              <Button onClick={handlePrimaryAction} tabIndex={flipped ? 0 : -1} variant="secondary">
                {returnLabel}
              </Button>
            </div>
          </section>
        </div>
      </div>
    </article>
  );
}
