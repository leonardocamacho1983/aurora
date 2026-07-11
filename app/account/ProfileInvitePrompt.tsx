"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { trackAurora } from "@/lib/analytics/client";
import styles from "./Account.module.css";

const PUBLIC_INVITE_BASE_URL = "https://www.faleaurora.com";

function shareableInviteUrl(inviteUrl: string, referralCode: string) {
  try {
    const parsed = new URL(inviteUrl);
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      return `${PUBLIC_INVITE_BASE_URL}/r/${encodeURIComponent(referralCode)}`;
    }
  } catch {
    return `${PUBLIC_INVITE_BASE_URL}/r/${encodeURIComponent(referralCode)}`;
  }

  return inviteUrl;
}

function displayInviteUrl(inviteUrl: string) {
  return inviteUrl.replace(/^https?:\/\/(www\.)?/, "");
}

type InviteEventName =
  | "account_invite_modal_opened"
  | "account_invite_copied"
  | "account_invite_shared"
  | "account_invite_whatsapp_clicked";

function legacyEventName(eventName: InviteEventName) {
  if (eventName === "account_invite_copied") return "invite_copied";
  if (eventName === "account_invite_shared") return "invite_shared";
  if (eventName === "account_invite_whatsapp_clicked") return "invite_whatsapp_clicked";
  return null;
}

export function ProfileInvitePrompt({
  referralCode,
  inviteUrl,
}: {
  referralCode: string;
  inviteUrl: string;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [canShare, setCanShare] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [isOpen, setIsOpen] = useState(false);
  const shareUrl = useMemo(() => shareableInviteUrl(inviteUrl, referralCode), [inviteUrl, referralCode]);
  const shareText = useMemo(
    () =>
      `A Aurora é um diário por voz para organizar sentimentos, pensamentos e próximos passos, no seu tempo: ${shareUrl}`,
    [shareUrl],
  );
  const whatsAppUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    closeButtonRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  function trackInvite(eventName: InviteEventName) {
    const legacyName = legacyEventName(eventName);

    if (legacyName) {
      try {
        void fetch("/api/waitlist/event", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            eventName: legacyName,
            referralCode,
            source: "account_profile",
          }),
          keepalive: true,
        });
      } catch {
        /* ignore analytics failures */
      }
    }

    trackAurora(eventName, {
      source: "account_profile",
      surface: "account",
    });
  }

  function openDialog() {
    setCopyStatus("idle");
    setIsOpen(true);
    trackInvite("account_invite_modal_opened");
  }

  function closeDialog() {
    setIsOpen(false);
  }

  async function writeClipboard(text: string) {
    try {
      if (navigator.clipboard?.writeText) {
        const copied = await Promise.race([
          navigator.clipboard.writeText(text).then(() => true).catch(() => false),
          new Promise<boolean>((resolve) => window.setTimeout(() => resolve(false), 350)),
        ]);
        if (copied) return true;
      }
    } catch {
      /* fall back below */
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.select();

    try {
      return document.execCommand("copy");
    } finally {
      document.body.removeChild(textarea);
    }
  }

  async function copyInvite() {
    const didCopy = await writeClipboard(shareUrl);
    if (didCopy) {
      setCopyStatus("copied");
      trackInvite("account_invite_copied");
    } else {
      setCopyStatus("failed");
    }
  }

  async function shareInvite() {
    if (!navigator.share) {
      return;
    }

    try {
      await navigator.share({ title: "Aurora", text: shareText, url: shareUrl });
      trackInvite("account_invite_shared");
    } catch {
      /* user cancelled */
    }
  }

  return (
    <>
      <section className={`${styles.card} ${styles.block} ${styles.invite}`} aria-labelledby="profile-invite-title">
        <div className={styles.inviteCopy}>
          <span className={styles.inviteKicker}>Convite rápido</span>
          <h2 className={styles.inviteTitle} id="profile-invite-title">
            Convide alguém em poucos segundos.
          </h2>
          <p className={styles.small}>
            Você envia seu link. A pessoa conhece a Aurora no tempo dela, e convites confirmados contam para seus benefícios.
          </p>
        </div>
        <div className={styles.inviteAction}>
          <button className={`${styles.btn} ${styles.btnQuiet}`} onClick={openDialog} type="button">
            Convidar alguém
          </button>
        </div>
      </section>

      {isOpen ? (
        <div className={styles.dialogLayer} onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeDialog();
        }}>
          <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="invite-title">
            <div className={styles.dialogBody}>
              <div className={styles.dialogHeader}>
                <h2 className={styles.dialogTitle} id="invite-title">Convidar alguém</h2>
                <button ref={closeButtonRef} className={styles.iconButton} onClick={closeDialog} type="button" aria-label="Fechar convite">
                  ×
                </button>
              </div>
              <p className={styles.dialogText}>
                A pessoa recebe só este link. Ela entra se quiser; o espaço dela começa em branco. Convites confirmados contam para seus benefícios.
              </p>
              <div className={styles.inviteUrl} aria-label="Seu link de convite">
                {displayInviteUrl(shareUrl)}
              </div>
              {copyStatus === "copied" ? <p className={styles.dialogConfirm}>Link copiado. Ela decide no tempo dela.</p> : null}
              {copyStatus === "failed" ? <p className={styles.dialogWarning}>Não deu para copiar aqui. Selecione o link acima.</p> : null}
              <div className={styles.dialogActions}>
                <button className={`${styles.btn} ${styles.btnGhost}`} onClick={copyInvite} type="button">
                  {copyStatus === "copied" ? "Copiado" : "Copiar link"}
                </button>
                <a
                  className={`${styles.btn} ${styles.btnQuiet}`}
                  href={whatsAppUrl}
                  onClick={() => trackInvite("account_invite_whatsapp_clicked")}
                  rel="noreferrer"
                  target="_blank"
                >
                  WhatsApp
                </a>
                {canShare ? (
                  <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={shareInvite} type="button">
                    Compartilhar
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
