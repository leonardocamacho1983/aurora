"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { requestPasswordReset, signIn, signUp } from "./actions";
import styles from "./Login.module.css";

type Mode = "signin" | "signup" | "reset";

function SubmitButton({ mode }: { mode: Mode }) {
  const { pending } = useFormStatus();
  const idle =
    mode === "signin"
      ? "Entrar na minha Aurora"
      : mode === "signup"
        ? "Criar minha Aurora"
        : "Enviar link de recuperacao";
  const busy = mode === "signin" ? "Entrando..." : mode === "signup" ? "Criando..." : "Enviando...";
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
      {message === "reset-email-sent" && (
        <p className={styles.notice}>
          Se esse email tiver acesso, enviamos um link para voce criar uma nova senha.
        </p>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <form
        action={mode === "signin" ? signIn : mode === "signup" ? signUp : requestPasswordReset}
        className={styles.form}
      >
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

        {mode !== "reset" && (
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
        )}

        {mode === "reset" && (
          <span className={styles.hint}>
            Abra o link no mesmo aparelho em que pediu a recuperacao.
          </span>
        )}

        <SubmitButton mode={mode} />
      </form>

      {mode === "signin" && (
        <p className={styles.resetLine}>
          <button type="button" className={styles.toggleBtn} onClick={() => setMode("reset")}>
            Esqueci minha senha
          </button>
        </p>
      )}

      <p className={styles.toggle}>
        {mode === "signin"
          ? "Primeira vez no app?"
          : mode === "signup"
            ? "Ja criou sua conta?"
            : "Lembrou a senha?"}{" "}
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
