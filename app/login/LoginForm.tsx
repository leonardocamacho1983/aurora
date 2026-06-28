"use client";

import { useState, type FocusEvent } from "react";
import { useFormStatus } from "react-dom";
import { signIn, signUp } from "./actions";
import styles from "./Login.module.css";

type Mode = "signin" | "signup";

function SubmitButton({ mode }: { mode: Mode }) {
  const { pending } = useFormStatus();
  const idle = mode === "signin" ? "Entrar na Aurora" : "Criar conta";
  const busy = mode === "signin" ? "Entrando..." : "Criando conta...";
  return (
    <button type="submit" className={styles.submit} disabled={pending}>
      {pending ? busy : idle}
    </button>
  );
}

function keepInputVisible(event: FocusEvent<HTMLInputElement>) {
  const input = event.currentTarget;
  window.setTimeout(() => {
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    input.scrollIntoView({ block: "center", behavior });
  }, 160);
}

export function LoginForm({
  error,
  initialMode = "signin",
  message,
}: {
  error?: string;
  initialMode?: Mode;
  message?: string;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [showPw, setShowPw] = useState(false);

  return (
    <>
      <div className={styles.modeSwitch} role="group" aria-label="Escolha como acessar">
        <button
          type="button"
          className={styles.modeButton}
          data-active={mode === "signin"}
          aria-pressed={mode === "signin"}
          onClick={() => setMode("signin")}
        >
          Entrar
        </button>
        <button
          type="button"
          className={styles.modeButton}
          data-active={mode === "signup"}
          aria-pressed={mode === "signup"}
          onClick={() => setMode("signup")}
        >
          Criar conta
        </button>
      </div>

      {message === "check-email" && (
        <p className={styles.notice}>
          Enviamos um link de confirmação. Abra seu email para ativar o acesso.
        </p>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <form action={mode === "signin" ? signIn : signUp} className={styles.form}>
        <label className={styles.field}>
          <span className={styles.label}>Email</span>
          <input
            className={styles.input}
            type="email"
            name="email"
            autoComplete="email"
            onFocus={keepInputVisible}
            placeholder="seu@email.com"
            required
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Senha</span>
          <div className={styles.pwWrap}>
            <input
              className={styles.input}
              type={showPw ? "text" : "password"}
              name="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              onFocus={keepInputVisible}
              placeholder="••••••••"
              minLength={6}
              required
            />
            <button
              type="button"
              className={styles.pwToggle}
              onClick={() => setShowPw((s) => !s)}
              aria-label={showPw ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPw ? "Ocultar" : "Mostrar"}
            </button>
          </div>
          {mode === "signup" && <span className={styles.hint}>Use pelo menos 6 caracteres.</span>}
        </label>

        <SubmitButton mode={mode} />
      </form>
    </>
  );
}
