"use client";

import { useRef, useState } from "react";
import styles from "./Landing.module.css";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function WaitlistForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [invalid, setInvalid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

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
        body: JSON.stringify({ email: val }),
      });
      if (!res.ok) {
        setInvalid(true);
        return;
      }
      setDone(true); // duplicado também é sucesso (a API trata)
    } catch {
      setInvalid(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          padding: 22,
          borderRadius: 18,
          background: "rgba(24,21,39,.6)",
          border: "1px solid rgba(236,182,210,.28)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "var(--aurora)",
              boxShadow: "0 0 12px rgba(236,182,210,.7)",
            }}
          />
          <span style={{ font: "600 16px var(--font-sans)", color: "#F8F6FC" }}>
            Você está na lista.
          </span>
        </div>
        <div
          style={{
            font: "400 14px/1.5 var(--font-sans)",
            color: "#B3ADC4",
            textAlign: "center",
          }}
        >
          A gente te chama quando for a sua vez de se ouvir.
        </div>
        <a
          href="#convide"
          style={{
            marginTop: 4,
            font: "600 13px var(--font-sans)",
            color: "#ECB6D2",
            textDecoration: "none",
          }}
        >
          Quer adiantar? Convide alguém →
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <div style={{ display: "flex", gap: 10 }}>
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
        <button type="submit" disabled={submitting} className={styles.wlBtn}>
          {submitting ? "Enviando…" : "Entrar na lista"}
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </button>
      </div>
      <div style={{ marginTop: 14, font: "400 13px var(--font-sans)", color: "#827C99" }}>
        Sem spam. Um aviso quando for a sua vez.
      </div>
    </form>
  );
}
