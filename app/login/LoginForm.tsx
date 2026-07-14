"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { requestPasswordReset, signIn, signUp } from "./actions";
import { keepFocusedFieldVisible, useVisualViewportHeight } from "./keyboardFocus";
import styles from "./Login.module.css";

type Mode = "signin" | "signup" | "reset";

function SubmitButton({ mode }: { mode: Mode }) {
  const { pending } = useFormStatus();
  const idle =
    mode === "signin"
      ? "Entrar na Aurora"
      : mode === "signup"
        ? "Criar conta"
        : "Enviar link";
  const busy = mode === "signin" ? "Entrando..." : mode === "signup" ? "Criando..." : "Enviando...";
  return (
    <button type="submit" className={styles.submit} disabled={pending}>
      {pending ? busy : idle}
    </button>
  );
}

export function LoginForm({
  error,
  message,
  initialMode = "signin",
}: {
  error?: string;
  message?: string;
  initialMode?: Mode;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [showPw, setShowPw] = useState(false);
  useVisualViewportHeight();

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
      {message === "open-spots-claimed" && (
        <p className={styles.notice}>
          Seu acesso gratuito esta liberado. Use o mesmo email da lista para entrar ou criar sua conta.
        </p>
      )}
      {message === "limited-access" && (
        <div className={styles.notice}>
          <strong>Quer acesso antecipado?</strong>
          <span>
            Responda ao Ritual de Chegada. Quando você completa o Ritual, sua entrada no teste da
            Aurora é liberada e os próximos passos chegam por email.
          </span>
          <a className={styles.noticeAction} href="/chegada?source=limited_access">
            Responder ao Ritual de Chegada
          </a>
        </div>
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
            onFocus={(event) => keepFocusedFieldVisible(event.currentTarget)}
            required
          />
        </label>

        {mode !== "reset" && (
          <div className={styles.field}>
            <span className={styles.labelRow}>
              <label className={styles.label} htmlFor="login-password">
                Senha
              </label>
              {mode === "signin" && (
                <button type="button" className={styles.fieldLink} onClick={() => setMode("reset")}>
                  Esqueci minha senha
                </button>
              )}
            </span>
            <div className={styles.pwWrap}>
              <input
                id="login-password"
                className={styles.input}
                type={showPw ? "text" : "password"}
                name="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                placeholder="••••••••"
                minLength={6}
                onFocus={(event) => keepFocusedFieldVisible(event.currentTarget)}
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
          </div>
        )}

        {mode === "reset" && (
          <span className={styles.hint}>
            Abra o link no mesmo aparelho em que pediu a recuperacao.
          </span>
        )}

        <SubmitButton mode={mode} />
      </form>

      <p className={styles.toggle}>
        {mode === "signin"
          ? "Primeira vez?"
          : mode === "signup"
            ? "Ja tem conta?"
            : "Lembrou?"}{" "}
        <button
          type="button"
          className={styles.toggleBtn}
          onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
        >
          {mode === "signin" ? "Criar conta" : "Entrar"}
        </button>
      </p>
    </>
  );
}
