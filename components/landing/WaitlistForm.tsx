"use client";

import { useEffect, useRef, useState } from "react";
import { ShareInvite } from "./ShareInvite";
import styles from "./Landing.module.css";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const REF = /^[A-Za-z0-9]{6,16}$/;
const REF_KEY = "aurora_ref";
const REF_TTL = 30 * 24 * 60 * 60 * 1000;

type DoneState =
  | { mode: "created"; referralCode: string; statusToken: string }
  | { mode: "email_sent" };

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

export function WaitlistForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const hpRef = useRef<HTMLInputElement>(null);
  const [referralCode, setReferralCode] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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
      inputRef.current?.focus();
      return;
    }
    setInvalid(false);
    setSubmitting(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: val,
          ref: referralCode || undefined,
          hp: hpRef.current?.value ?? "",
        }),
      });
      if (!res.ok) {
        setInvalid(true);
        return;
      }
      const data = (await res.json()) as {
        mode?: string;
        referralCode?: string;
        statusToken?: string;
      };
      if (data.mode === "created" && data.referralCode && data.statusToken) {
        setDone({
          mode: "created",
          referralCode: data.referralCode,
          statusToken: data.statusToken,
        });
      } else {
        setDone({ mode: "email_sent" });
      }
    } catch {
      setInvalid(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    const created = done.mode === "created";
    return (
      <div className={styles.waitlistSuccess}>
        <div className={styles.waitlistSuccessHeader}>
          <span aria-hidden="true" />
          <strong>{created ? "Você está na lista." : "Te enviamos seu link."}</strong>
        </div>
        <p>
          {created
            ? "Confirme seu email para ativar seus convites. Seu link já está pronto para compartilhar."
            : "Se esse email já estava na Aurora, a sala de convite chegou na sua caixa de entrada."}
        </p>
        {created ? (
          <>
            <ShareInvite referralCode={done.referralCode} compact />
            <a href={`/lista/${done.statusToken}`} className={styles.waitlistStatusLink}>
              Conhecer meus convites
            </a>
          </>
        ) : null}
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
          {submitting ? "Enviando..." : "Entrar na lista"}
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </button>
      </div>
      <div className={styles.waitlistMicrocopy}>
        Sem spam. Só o aviso do seu acesso.
      </div>
    </form>
  );
}
