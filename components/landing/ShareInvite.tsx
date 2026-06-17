"use client";

import { useMemo, useState } from "react";
import styles from "./Landing.module.css";

type ShareInviteProps = {
  referralCode: string;
  inviteUrl?: string;
  compact?: boolean;
  label?: string;
};

function buildUrl(code: string, explicit?: string): string {
  if (explicit) return explicit;
  if (typeof window === "undefined") return `/r/${code}`;
  return `${window.location.origin}/r/${code}`;
}

export function ShareInvite({
  referralCode,
  inviteUrl,
  compact = false,
  label,
}: ShareInviteProps) {
  const [copied, setCopied] = useState(false);
  const url = useMemo(() => buildUrl(referralCode, inviteUrl), [referralCode, inviteUrl]);
  const text = `Estou na lista da Aurora, um diário por voz com IA para organizar o que a gente sente com mais clareza. Vem conhecer comigo: ${url}`;
  const whats = `https://wa.me/?text=${encodeURIComponent(text)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  async function nativeShare() {
    if (!navigator.share) {
      await copy();
      return;
    }
    try {
      await navigator.share({ title: "Aurora", text, url });
    } catch {
      /* user cancelled */
    }
  }

  return (
    <div className={`${styles.shareInvite} ${compact ? styles.shareInviteCompact : ""}`}>
      {label ? <div className={styles.shareLabel}>{label}</div> : null}
      <div className={styles.shareUrl} aria-label="Seu link de convite">
        {url.replace(/^https?:\/\//, "")}
      </div>
      <div className={styles.shareActions}>
        <a className={styles.shareBtn} href={whats} target="_blank" rel="noreferrer">
          WhatsApp
        </a>
        <button className={styles.shareBtn} type="button" onClick={copy}>
          {copied ? "Copiado" : "Copiar link"}
        </button>
        <button className={styles.shareBtn} type="button" onClick={nativeShare}>
          Compartilhar
        </button>
      </div>
    </div>
  );
}
