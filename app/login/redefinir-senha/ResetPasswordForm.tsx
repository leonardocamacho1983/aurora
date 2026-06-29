"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "../Login.module.css";

type Status = "checking" | "ready" | "invalid" | "done";

function friendly(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("password should be at least")) {
    return "A senha precisa de pelo menos 6 caracteres.";
  }
  if (normalized.includes("auth session missing")) {
    return "Abra o link de recuperacao mais recente e tente de novo.";
  }
  return message;
}

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const [status, setStatus] = useState<Status>("checking");
  const [error, setError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;

    async function prepareSession() {
      const linkError =
        searchParams.get("error_description") ?? searchParams.get("error") ?? searchParams.get("message");

      if (linkError) {
        setError("Link de recuperacao invalido ou expirado.");
        setStatus("invalid");
        return;
      }

      const code = searchParams.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (!active) return;

        if (exchangeError) {
          setError("Nao conseguimos validar o link. Peca uma nova recuperacao de senha.");
          setStatus("invalid");
          return;
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;
      setStatus(session ? "ready" : "invalid");
      if (!session) {
        setError("Abra o link de recuperacao enviado por email para criar uma nova senha.");
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setStatus(session ? "ready" : "invalid");
      }
    });

    prepareSession();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [searchParams, supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (password.length < 6) {
      setError("A senha precisa de pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas precisam ser iguais.");
      return;
    }

    setPending(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setPending(false);

    if (updateError) {
      setError(friendly(updateError.message));
      return;
    }

    setStatus("done");
    router.replace("/diario");
  }

  if (status === "checking") {
    return <p className={styles.notice}>Validando seu link de recuperacao...</p>;
  }

  if (status === "invalid") {
    return (
      <>
        <p className={styles.error} role="alert">
          {error}
        </p>
        <p className={styles.toggle}>
          <a className={styles.toggleBtn} href="/login">
            Pedir novo link
          </a>
        </p>
      </>
    );
  }

  if (status === "done") {
    return <p className={styles.notice}>Senha atualizada. Abrindo seu diario...</p>;
  }

  return (
    <>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.field}>
          <span className={styles.label}>Nova senha</span>
          <div className={styles.pwWrap}>
            <input
              className={styles.input}
              type={showPw ? "text" : "password"}
              name="password"
              autoComplete="new-password"
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
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Confirmar senha</span>
          <input
            className={styles.input}
            type={showPw ? "text" : "password"}
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="••••••••"
            minLength={6}
            required
          />
        </label>

        <button type="submit" className={styles.submit} disabled={pending}>
          {pending ? "Atualizando..." : "Atualizar senha"}
        </button>
      </form>
    </>
  );
}
