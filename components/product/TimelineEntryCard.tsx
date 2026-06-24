import Link from "next/link";
import type { HTMLAttributes, ReactNode } from "react";
import { Chip } from "@/components/ui";
import styles from "./ProductCards.module.css";

type TimelineAuthor = "user" | "aurora";

type TimelineEntryCardProps = HTMLAttributes<HTMLElement> & {
  author?: TimelineAuthor;
  meta: string;
  children: ReactNode;
  mood?: string;
  active?: boolean;
  actionLabel?: string;
  actionHref?: string;
};

export function TimelineEntryCard({
  author = "user",
  meta,
  children,
  mood,
  active = false,
  actionLabel,
  actionHref,
  className,
  ...props
}: TimelineEntryCardProps) {
  return (
    <article
      className={[styles.timelineEntry, className].filter(Boolean).join(" ")}
      data-active={active ? "true" : "false"}
      data-author={author}
      {...props}
    >
      <div className={styles.timelineTop}>
        <p className={styles.meta}>{meta}</p>
        {mood ? <Chip tone={author === "aurora" ? "status" : "mood"} withDot>{mood}</Chip> : null}
      </div>

      <p className={styles.timelineContent}>{children}</p>

      {actionLabel ? (
        <div className={styles.timelineFooter}>
          <span className={styles.support}>{author === "aurora" ? "Devolutiva Aurora" : "Registro de voz"}</span>
          {actionHref ? (
            <Link className={styles.timelineAction} href={actionHref}>
              {actionLabel}
            </Link>
          ) : (
            <span className={styles.timelineAction}>{actionLabel}</span>
          )}
        </div>
      ) : null}
    </article>
  );
}
