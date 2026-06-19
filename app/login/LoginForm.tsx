"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { signIn, signUp } from "./actions";
import styles from "./Login.module.css";

type Mode = "signin" | "signup";

function SubmitButton({ mode }: { mode: Mode }) {
  const { pending } = useFormStatus();
  const idle = mode === "signin" ? "Entrar na minha Aurora" : "Criar minha Aurora";
  const busy = mode === "signin" ? "Entrando..." : "Criando...";
  return (
    <button type="submit" className={styles.submit} disabled={pending}>
      {pending ? busy : idle}
    </button>
  );
}

export function LoginForm({ error, message }: { error?: string; message?: string }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [showPw, setShowPw] = useState(false);

  return (
    <>
      {message === "check-email" && (
        <p className={styles.notice}>
          Enviamos um link de confirmacao. Abra seu email para ativar o acesso.
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

      <p className={styles.toggle}>
        {mode === "signin" ? "Primeira vez no app?" : "Ja criou sua conta?"}{" "}
        <button
          type="button"
          className={styles.toggleBtn}
          onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
        >
          {mode === "signin" ? "Criar acesso" : "Entrar"}
        </button>
      </p>
    </>
  );
}
