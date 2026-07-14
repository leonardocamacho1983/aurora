"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./Landing.module.css";
import { trackAurora } from "@/lib/analytics/client";
import { writeInviteContext } from "./invite-context";

type RitualQuestion = {
  key: string;
  eyebrow: string;
  title: (name: string) => string;
  body: string;
  placeholder?: string;
  options?: string[];
  max?: number;
};

const questions: RitualQuestion[] = [
  {
    key: "aurora_guest_name",
    eyebrow: "Seu nome",
    title: () => "Como a Aurora pode te chamar?",
    body: "Um nome simples já deixa a chegada mais pessoal.",
    placeholder: "seu nome",
    max: 40,
  },
  {
    key: "aurora_guest_moment",
    eyebrow: "Seu momento",
    title: (name) => `${name}, o que você quer levar para a Aurora primeiro?`,
    body: "Pode ser uma fase, um projeto, uma mudança, uma pergunta, uma dor ou um desabafo.",
    placeholder: "ex: entender melhor uma mudança",
    max: 140,
  },
  {
    key: "aurora_guest_rhythm",
    eyebrow: "Seu ritmo",
    title: () => "Quando você imagina usar a Aurora?",
    body: "Escolha o momento que parece mais natural agora.",
    options: ["De manhã", "Durante o dia", "No fim do dia", "Antes de dormir", "Quando pesar"],
    max: 40,
  },
  {
    key: "aurora_guest_presence",
    eyebrow: "Sua preferência",
    title: () => "Que tipo de presença combina mais com você?",
    body: "A Aurora acolhe melhor quando entende o tom que combina com você.",
    options: ["Gentil", "Direta", "Profunda", "Prática"],
    max: 40,
  },
  {
    key: "aurora_guest_value",
    eyebrow: "Valor para você",
    title: () => "O que faria a Aurora valer a pena?",
    body: "Uma frase basta. Isso ajuda a entender o que faria a Aurora valer de verdade para você.",
    placeholder: "ex: perceber padrões antes que virem ansiedade",
    max: 160,
  },
];

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function clean(value: string, max = 160) {
  return value.trim().replace(/\s+/g, " ").slice(0, max);
}

function readLocal(key: string) {
  try {
    return localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function writeLocal(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
    if (key === "aurora_guest_name") {
      let context = {};
      try {
        const raw = localStorage.getItem("aurora_invite_context");
        context = raw ? JSON.parse(raw) : {};
      } catch {
        context = {};
      }
      localStorage.setItem("aurora_invite_context", JSON.stringify({ ...context, name: value, savedAt: Date.now() }));
    }
  } catch {
    /* ignore */
  }
}

function readStatusToken() {
  try {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token")?.trim();
    if (token) return token;

    const raw = localStorage.getItem("aurora_invite_context");
    const context = raw ? JSON.parse(raw) as { statusToken?: string } : {};
    return typeof context.statusToken === "string" ? context.statusToken : "";
  } catch {
    return "";
  }
}

function readEmail() {
  return clean(readLocal("aurora_guest_email"), 120).toLowerCase();
}

async function saveProfile(identity: { statusToken?: string; email?: string }, key: string, value: string) {
  const fieldByKey: Record<string, string> = {
    aurora_guest_name: "name",
    aurora_guest_moment: "moment",
    aurora_guest_rhythm: "rhythm",
    aurora_guest_presence: "presence",
    aurora_guest_value: "value",
  };
  const field = fieldByKey[key];
  if (!field) return null;

  try {
    const response = await fetch("/api/waitlist/profile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...identity, [field]: value, source: "arrival_ritual" }),
    });
    if (!response.ok) return null;
    return await response.json() as {
      statusToken?: string;
      referralCode?: string;
      complete?: boolean;
      accessGranted?: boolean;
      accessEmailSent?: boolean;
    };
  } catch {
    /* local save keeps the ritual usable offline-ish */
    return null;
  }
}

export function ArrivalRitual() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [statusToken, setStatusToken] = useState("");
  const [email, setEmail] = useState("");
  const [emailDraft, setEmailDraft] = useState("");
  const [emailInvalid, setEmailInvalid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [accessEmailSent, setAccessEmailSent] = useState(false);

  useEffect(() => {
    const token = readStatusToken();
    const localEmail = readEmail();
    setStatusToken(token);
    setEmail(localEmail);
    setEmailDraft(localEmail);
    if (token) writeInviteContext({ statusToken: token });

    const next: Record<string, string> = {};
    questions.forEach((question) => {
      next[question.key] = clean(readLocal(question.key), question.max);
    });
    setAnswers(next);
    const firstOpen = questions.findIndex((question) => !next[question.key]);
    setIndex(firstOpen >= 0 ? firstOpen : questions.length);
  }, []);

  const needsEmail = !statusToken && !email;
  const question = needsEmail ? null : questions[index];
  const name = clean(answers.aurora_guest_name || "você", 40);
  const progress = Math.min(index, questions.length);

  useEffect(() => {
    if (!question || question.options) {
      setDraft("");
      return;
    }
    setDraft(answers[question.key] ?? "");
  }, [question, answers]);

  const completed = useMemo(() => questions.filter((item) => answers[item.key]).length, [answers]);

  function saveEmail() {
    const nextEmail = clean(emailDraft, 120).toLowerCase();
    if (!EMAIL.test(nextEmail)) {
      setEmailInvalid(true);
      return;
    }

    writeLocal("aurora_guest_email", nextEmail);
    setEmail(nextEmail);
    setEmailDraft(nextEmail);
    setEmailInvalid(false);
    trackAurora("arrival_ritual_email_added", { source: "arrival_ritual" });
  }

  async function save(value: string) {
    if (!question) return;
    const nextValue = clean(value, question.max);
    if (!nextValue) return;
    writeLocal(question.key, nextValue);
    const identity = statusToken ? { statusToken } : { email };
    let result: Awaited<ReturnType<typeof saveProfile>> = null;
    if (identity.statusToken || identity.email) {
      setSaving(true);
      result = await saveProfile(identity, question.key, nextValue);
      setSaving(false);
    }
    if (result?.statusToken) {
      setStatusToken(result.statusToken);
      writeInviteContext({
        statusToken: result.statusToken,
        referralCode: result.referralCode,
        name: question.key === "aurora_guest_name" ? nextValue : answers.aurora_guest_name,
        confirmed: true,
      });
    }
    if (result?.accessGranted || result?.complete) {
      setAccessGranted(true);
    }
    if (result?.accessEmailSent) {
      setAccessEmailSent(true);
    }
    trackAurora("arrival_ritual_step_completed", {
      source: "arrival_ritual",
      step: index + 1,
      field: question.key.replace("aurora_guest_", ""),
    });
    setAnswers((previous) => ({ ...previous, [question.key]: nextValue }));
    setIndex((current) => {
      const next = Math.min(current + 1, questions.length);
      if (next === questions.length) {
        trackAurora("arrival_ritual_completed", { source: "arrival_ritual" });
      }
      return next;
    });
  }

  function goBack() {
    setIndex((current) => Math.max(0, current - 1));
  }

  return (
    <main className={styles.arrivalPage}>
      <div className={styles.arrivalMoon} aria-hidden="true" />
      <section className={styles.arrivalShell}>
        <a className={styles.arrivalBrand} href="/?sala=convite">
          <span aria-hidden="true" />
          Aurora
        </a>

        <div className={styles.arrivalCard}>
          <span className={styles.arrivalKicker}>Ritual de Chegada</span>
          <h1>
            {needsEmail
              ? "Vamos preparar seu acesso."
              : question
                ? "Vamos preparar sua Aurora."
                : "Pronto. Sua entrada no teste está liberada."}
          </h1>
          <p>
            {needsEmail
              ? "Antes do Ritual, diga qual email você quer usar para receber os próximos passos."
              : question
                ? "Responda só o que fizer sentido. É uma forma leve de deixar sua experiência mais próxima de você."
                : accessEmailSent
                  ? "A Aurora enviou um email explicando o momento do produto e como convidar pessoas próximas com cuidado."
                  : "Sua entrada foi liberada. Use o mesmo email do Ritual para criar sua conta e começar com calma."}
          </p>

          <div className={styles.arrivalProgress} aria-label={`${completed} de ${questions.length} respostas`}>
            <span style={{ width: `${(completed / questions.length) * 100}%` }} />
          </div>

          {needsEmail ? (
            <div className={styles.arrivalQuestion}>
              <div className={styles.arrivalStepTop}>
                <span>Acesso antecipado</span>
                <small>Email</small>
              </div>
              <strong>Qual email você quer usar na Aurora?</strong>
              <p>Use um email que você acessa. É por ele que a Aurora libera a entrada depois do Ritual.</p>
              <div className={styles.arrivalForm}>
                <input
                  value={emailDraft}
                  onChange={(event) => {
                    setEmailDraft(event.target.value);
                    setEmailInvalid(false);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      saveEmail();
                    }
                  }}
                  placeholder="seu@email.com"
                  autoComplete="email"
                  inputMode="email"
                  aria-label="Email para acesso antecipado"
                  aria-invalid={emailInvalid}
                  data-invalid={emailInvalid ? "true" : "false"}
                />
                <button type="button" onClick={saveEmail}>
                  Continuar
                </button>
              </div>
              {emailInvalid ? <span className={styles.arrivalError}>Digite um email válido para continuar.</span> : null}
            </div>
          ) : question ? (
            <div className={styles.arrivalQuestion}>
              <div className={styles.arrivalStepTop}>
                <span>{question.eyebrow}</span>
                <small>
                  {index + 1} de {questions.length}
                </small>
              </div>
              <strong>{question.title(name)}</strong>
              <p>{question.body}</p>

              {question.options ? (
                <div className={styles.arrivalChoices}>
                  {question.options.map((option) => (
                    <button key={option} type="button" onClick={() => void save(option)} disabled={saving}>
                      {option}
                    </button>
                  ))}
                </div>
              ) : (
                <div className={styles.arrivalForm}>
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void save(draft);
                      }
                    }}
                    placeholder={question.placeholder}
                    autoComplete={question.key === "aurora_guest_name" ? "given-name" : "off"}
                    aria-label={question.title(name)}
                  />
                  <button type="button" onClick={() => void save(draft)} disabled={saving}>
                    {saving ? "Salvando..." : "Continuar"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.arrivalDone}>
              <strong>{name === "você" ? "A Aurora já pode te receber." : `${name}, a Aurora já pode te receber.`}</strong>
              <p>
                {accessGranted
                  ? "Sua entrada foi liberada. Use o mesmo email do Ritual para criar sua conta."
                  : "Se você já tinha acesso, use o mesmo email para entrar ou criar sua conta."}
              </p>
              <a className={styles.arrivalPrimaryLink} href="/login?mode=signup&message=open-spots-claimed">
                Entrar na Aurora
              </a>
            </div>
          )}

          <div className={styles.arrivalFooter}>
            {!needsEmail && index > 0 && index < questions.length ? (
              <button type="button" onClick={goBack}>
                Voltar
              </button>
            ) : (
              <span />
            )}
            <a href="/?sala=convite">Voltar para a página da Aurora</a>
          </div>
        </div>
      </section>
    </main>
  );
}
