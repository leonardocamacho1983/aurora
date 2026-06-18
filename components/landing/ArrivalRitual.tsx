"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./Landing.module.css";

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
    body: "A Aurora deve acolher sem invadir. Escolha o tom que soa melhor.",
    options: ["Gentil", "Direta", "Profunda", "Prática"],
    max: 40,
  },
  {
    key: "aurora_guest_value",
    eyebrow: "Valor para você",
    title: () => "O que faria a Aurora valer a pena?",
    body: "Uma frase basta. Isso ajuda a entender o que precisa ser cuidado no produto.",
    placeholder: "ex: perceber padrões antes que virem ansiedade",
    max: 160,
  },
];

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
    const raw = localStorage.getItem("aurora_invite_context");
    const context = raw ? JSON.parse(raw) as { statusToken?: string } : {};
    return typeof context.statusToken === "string" ? context.statusToken : "";
  } catch {
    return "";
  }
}

async function saveProfile(statusToken: string, key: string, value: string) {
  const fieldByKey: Record<string, string> = {
    aurora_guest_name: "name",
    aurora_guest_moment: "moment",
    aurora_guest_rhythm: "rhythm",
    aurora_guest_presence: "presence",
    aurora_guest_value: "value",
  };
  const field = fieldByKey[key];
  if (!field) return;

  try {
    await fetch("/api/waitlist/profile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ statusToken, [field]: value, source: "arrival_ritual" }),
    });
  } catch {
    /* local save keeps the ritual usable offline-ish */
  }
}

export function ArrivalRitual() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const next: Record<string, string> = {};
    questions.forEach((question) => {
      next[question.key] = clean(readLocal(question.key), question.max);
    });
    setAnswers(next);
    const firstOpen = questions.findIndex((question) => !next[question.key]);
    setIndex(firstOpen >= 0 ? firstOpen : questions.length);
  }, []);

  const question = questions[index];
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

  function save(value: string) {
    if (!question) return;
    const nextValue = clean(value, question.max);
    if (!nextValue) return;
    writeLocal(question.key, nextValue);
    const statusToken = readStatusToken();
    if (statusToken) void saveProfile(statusToken, question.key, nextValue);
    setAnswers((previous) => ({ ...previous, [question.key]: nextValue }));
    setIndex((current) => Math.min(current + 1, questions.length));
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
          <h1>{question ? "Vamos preparar sua Aurora." : "Pronto. A Aurora já tem seus primeiros sinais."}</h1>
          <p>
            {question
              ? "Responda só o que fizer sentido. É uma forma leve de deixar sua experiência mais próxima de você."
              : "Quando seu acesso chegar, esse contexto ajuda a Aurora a te receber com mais cuidado."}
          </p>

          <div className={styles.arrivalProgress} aria-label={`${completed} de ${questions.length} respostas`}>
            <span style={{ width: `${(completed / questions.length) * 100}%` }} />
          </div>

          {question ? (
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
                    <button key={option} type="button" onClick={() => save(option)}>
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
                        save(draft);
                      }
                    }}
                    placeholder={question.placeholder}
                    autoComplete={question.key === "aurora_guest_name" ? "given-name" : "off"}
                    aria-label={question.title(name)}
                  />
                  <button type="button" onClick={() => save(draft)}>
                    Continuar
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.arrivalDone}>
              <strong>{name === "você" ? "Obrigada por chegar até aqui." : `${name}, obrigada por chegar até aqui.`}</strong>
              <p>Você pode voltar para a Aurora ou revisar qualquer resposta quando quiser.</p>
            </div>
          )}

          <div className={styles.arrivalFooter}>
            {index > 0 && index < questions.length ? (
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
