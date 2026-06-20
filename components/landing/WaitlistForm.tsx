"use client";

import { type MouseEvent, useEffect, useRef, useState } from "react";
import styles from "./Landing.module.css";
import { getAuroraAttribution, getAuroraClientId, trackAurora } from "@/lib/analytics/client";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const REF = /^[A-Za-z0-9]{6,16}$/;
const REF_KEY = "aurora_ref";
const INVITE_CONTEXT_KEY = "aurora_invite_context";
const REF_TTL = 30 * 24 * 60 * 60 * 1000;
const GMAIL_SEARCH_URL = "https://mail.google.com/mail/u/0/#search/Aurora";
const OUTLOOK_INBOX_URL = "https://outlook.live.com/mail/0/inbox";

type DoneState =
  | { mode: "created"; email: string; referralCode: string; statusToken: string }
  | { mode: "email_sent"; email: string };

function readStoredRef(): string {
  try {
    const raw = localStorage.getItem(REF_KEY);
    if (!raw) return "";
    const data = JSON.parse(raw) as { code?: string; expires?: number };
    if (!data.code || !data.expires || Date.now() > data.expires) {
      localStorage.removeItem(REF_KEY);
      return "";
    }
    return REF.test(data.code) ? data.code : "";
  } catch {
    return "";
  }
}

function storeRef(code: string) {
  try {
    localStorage.setItem(REF_KEY, JSON.stringify({ code, expires: Date.now() + REF_TTL }));
  } catch {
    /* ignore */
  }
}

function storeInviteContext(referralCode: string, statusToken: string) {
  try {
    localStorage.setItem(
      INVITE_CONTEXT_KEY,
      JSON.stringify({
        referralCode,
        statusToken,
        confirmed: false,
        confirmedCount: 0,
        savedAt: Date.now(),
      }),
    );
  } catch {
    /* ignore */
  }
}

export function WaitlistForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const hpRef = useRef<HTMLInputElement>(null);
  const [referralCode, setReferralCode] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [done, setDone] = useState<DoneState | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const ref = url.searchParams.get("ref")?.trim() ?? "";
    if (REF.test(ref)) {
      storeRef(ref);
      setReferralCode(ref);
      return;
    }
    setReferralCode(readStoredRef());
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const val = inputRef.current?.value.trim() ?? "";
    if (!EMAIL.test(val)) {
      setInvalid(true);
      trackAurora("waitlist_submit_error", { source: "landing", mode: "invalid_email" });
      inputRef.current?.focus();
      return;
    }
    setInvalid(false);
    setSubmitting(true);
    const submitDistinctId = getAuroraClientId();
    trackAurora("waitlist_submit_attempt", { source: "landing", has_referral: Boolean(referralCode) }, { distinctId: submitDistinctId });
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: val,
          ref: referralCode || undefined,
          hp: hpRef.current?.value ?? "",
          attribution: getAuroraAttribution(),
        }),
      });
      if (!res.ok) {
        setInvalid(true);
        trackAurora("waitlist_submit_error", { source: "landing", mode: String(res.status) }, { distinctId: submitDistinctId });
        return;
      }
      const data = (await res.json()) as {
        mode?: string;
        referralCode?: string;
        statusToken?: string;
      };
      if (data.mode === "created" && data.referralCode && data.statusToken) {
        storeInviteContext(data.referralCode, data.statusToken);
        trackAurora("waitlist_submit_success", {
          source: "landing",
          mode: "created",
          has_referral: Boolean(referralCode),
          referral_code: data.referralCode,
        }, { distinctId: submitDistinctId });
        setDone({
          mode: "created",
          email: val,
          referralCode: data.referralCode,
          statusToken: data.statusToken,
        });
      } else {
        trackAurora(
          "waitlist_submit_success",
          { source: "landing", mode: "email_sent", has_referral: Boolean(referralCode) },
          { distinctId: submitDistinctId },
        );
        setDone({ mode: "email_sent", email: val });
      }
    } catch {
      setInvalid(true);
      trackAurora("waitlist_submit_error", { source: "landing", mode: "network" }, { distinctId: submitDistinctId });
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    const doneState = done;
    const created = doneState.mode === "created";
    const title = "Falta só confirmar seu email.";
    const body = created
      ? "Enviamos um link para confirmar seu cadastro. Depois disso, seu acesso antecipado fica registrado."
      : "Reenviamos seu link da Aurora para confirmar ou acompanhar seu acesso antecipado.";

    function openInbox(provider: string, href: string, event: MouseEvent<HTMLAnchorElement>) {
      event.preventDefault();
      const inboxWindow = window.open("about:blank", "_blank");
      if (inboxWindow) {
        inboxWindow.opener = null;
      }
      trackAurora("waitlist_inbox_clicked", {
        source: "waitlist_success",
        provider,
        mode: doneState.mode,
      });
      window.setTimeout(() => {
        if (inboxWindow) {
          inboxWindow.location.replace(href);
          return;
        }
        window.location.href = href;
      }, 140);
    }

    async function resendEmail() {
      setResending(true);
      trackAurora("waitlist_resend_clicked", {
        source: "waitlist_success",
        mode: doneState.mode,
      });
      try {
        await fetch("/api/waitlist", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            email: doneState.email,
            ref: referralCode || undefined,
            hp: "",
            attribution: getAuroraAttribution(),
          }),
        });
      } finally {
        setResending(false);
      }
    }

    return (
      <div className={styles.waitlistSuccess}>
        <div className={styles.waitlistSuccessHeader}>
          <span aria-hidden="true" />
          <strong>{title}</strong>
        </div>
        <p>{body}</p>
        <div className={styles.waitlistSuccessNote}>
          As novidades da abertura chegam por email. Marque a Aurora como favorita.
        </div>
        <details className={styles.waitlistDetails}>
          <summary>Entender acesso antecipado</summary>
          <p>
            O acesso à Aurora será liberado aos poucos. Quem confirma o email entra no acesso antecipado
            e recebe as próximas liberações antes da abertura geral. Se não achar o email, veja o Spam ou Promoções.
          </p>
        </details>
        <div className={styles.waitlistInboxActions}>
          <a href={GMAIL_SEARCH_URL} target="_blank" rel="noreferrer" onClick={(event) => openInbox("gmail", GMAIL_SEARCH_URL, event)}>
            Abrir Gmail
          </a>
          <a href={OUTLOOK_INBOX_URL} target="_blank" rel="noreferrer" onClick={(event) => openInbox("outlook", OUTLOOK_INBOX_URL, event)}>
            Abrir Outlook
          </a>
        </div>
        {created ? (
          <a
            href={`/lista/${doneState.statusToken}`}
            className={styles.waitlistStatusLink}
            onClick={() => {
              trackAurora("waitlist_status_link_clicked", {
                source: "waitlist_success",
                mode: "created",
              });
            }}
          >
            Ver meu acesso antecipado
          </a>
        ) : null}
        <button
          type="button"
          className={styles.waitlistResendButton}
          onClick={resendEmail}
          disabled={resending}
        >
          {resending ? "Reenviando..." : "Reenviar email"}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <div className={styles.wlRow}>
        <input
          ref={inputRef}
          type="email"
          name="email"
          placeholder="seu@email.com"
          autoComplete="email"
          aria-label="Seu email"
          onChange={() => invalid && setInvalid(false)}
          className={`${styles.wlInput} ${invalid ? styles.wlInputInvalid : ""}`}
        />
        <input
          ref={hpRef}
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          className={styles.hpField}
          aria-hidden="true"
        />
        <button type="submit" disabled={submitting} className={styles.wlBtn}>
          {submitting ? "Enviando..." : "Acessar"}
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </button>
      </div>
      <div className={styles.waitlistMicrocopy}>
        Sem spam. As novidades chegam por email.
      </div>
    </form>
  );
}
