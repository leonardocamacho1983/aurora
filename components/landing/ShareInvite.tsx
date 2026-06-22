"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./Landing.module.css";
import { trackAurora } from "@/lib/analytics/client";

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

function trackInvite(eventName: "invite_copied" | "invite_shared" | "invite_whatsapp_clicked", referralCode: string) {
  try {
    void fetch("/api/waitlist/event", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventName, referralCode }),
      keepalive: true,
    });
  } catch {
    /* ignore analytics failures */
  }
}

export function ShareInvite({
  referralCode,
  inviteUrl,
  compact = false,
  label,
}: ShareInviteProps) {
  const [copied, setCopied] = useState(false);
  const [inviterName, setInviterName] = useState("");
  const url = useMemo(() => buildUrl(referralCode, inviteUrl), [referralCode, inviteUrl]);
  const text = inviterName
    ? `${inviterName} te convidou para conhecer a Aurora, um diário por voz para organizar o que você sente, pensa e quer colocar em prática. A pessoa decide no próprio tempo: ${url}`
    : `Recebi meu convite para conhecer a Aurora, um diário por voz para organizar o que você sente, pensa e quer colocar em prática. Pensei que talvez fizesse sentido para você: ${url}`;
  const whats = `https://wa.me/?text=${encodeURIComponent(text)}`;

  useEffect(() => {
    try {
      setInviterName((localStorage.getItem("aurora_guest_name") ?? "").trim().slice(0, 40));
    } catch {
      /* ignore */
    }
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      trackInvite("invite_copied", referralCode);
      trackAurora("invite_copied", {
        source: compact ? "waitlist_success" : "referral_room",
        referral_code: referralCode,
      });
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
      trackInvite("invite_shared", referralCode);
      trackAurora("invite_shared", {
        source: compact ? "waitlist_success" : "referral_room",
        referral_code: referralCode,
      });
    } catch {
      /* user cancelled */
    }
  }

  return (
    <div className={`${styles.shareInvite} ${compact ? styles.shareInviteCompact : ""}`}>
      {label ? <div className={styles.shareLabel}>{label}</div> : null}
      {!compact ? (
        <p className={styles.shareHint}>
          Envie pelo WhatsApp ou copie o link. A pessoa decide no próprio tempo, e a Aurora não manda mensagem por você.
        </p>
      ) : null}
      <div className={styles.shareUrl} aria-label="Seu link de convite">
        {url.replace(/^https?:\/\//, "")}
      </div>
      <div className={styles.shareActions}>
        <a
          className={`${styles.shareBtn} ${styles.shareBtnPrimary}`}
          href={whats}
          target="_blank"
          rel="noreferrer"
          onClick={() => {
            trackInvite("invite_whatsapp_clicked", referralCode);
            trackAurora("invite_whatsapp_clicked", {
              source: compact ? "waitlist_success" : "referral_room",
              referral_code: referralCode,
            });
          }}
        >
          Enviar no WhatsApp
        </a>
        <button className={styles.shareBtn} type="button" onClick={copy}>
          {copied ? "Convite copiado" : "Copiar convite"}
        </button>
        <button className={styles.shareBtn} type="button" onClick={nativeShare}>
          Compartilhar
        </button>
      </div>
    </div>
  );
}
