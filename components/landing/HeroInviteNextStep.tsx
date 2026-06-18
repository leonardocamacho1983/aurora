"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./Landing.module.css";

type HeroInviteNextStepProps = {
  initialName?: string;
};

type StepId = "name" | "moment" | "rhythm" | "presence" | "done";

type Step = {
  id: StepId;
  storageKey: string;
  eyebrow: string;
  title: (name: string) => string;
  body: string;
  placeholder?: string;
  button: string;
  max?: number;
  autoComplete?: string;
  options?: string[];
};

const CONTEXT_KEY = "aurora_invite_context";

const steps: Step[] = [
  {
    id: "name",
    storageKey: "aurora_guest_name",
    eyebrow: "Um detalhe para ficar mais pessoal",
    title: () => "Como podemos te chamar?",
    body: "Seu email já está na lista. Seu nome ajuda a deixar sua experiência e seus convites mais pessoais.",
    placeholder: "seu nome",
    button: "Guardar nome",
    max: 40,
    autoComplete: "given-name",
  },
  {
    id: "moment",
    storageKey: "aurora_guest_moment",
    eyebrow: "Para começar com mais contexto",
    title: (name) => `${name}, o que você quer levar para a Aurora primeiro?`,
    body: "Pode ser uma fase, um projeto, uma mudança, uma pergunta, uma dor ou um desabafo.",
    placeholder: "ex: entender melhor uma mudança",
    button: "Guardar resposta",
    max: 140,
  },
  {
    id: "rhythm",
    storageKey: "aurora_guest_rhythm",
    eyebrow: "Seu ritmo",
    title: () => "Quando a Aurora provavelmente vai te encontrar?",
    body: "Isso ajuda a imaginar uma experiência que caiba no seu dia, sem cobrança.",
    button: "Guardar ritmo",
    options: ["De manhã", "Durante o dia", "No fim do dia", "Antes de dormir", "Quando pesar"],
    max: 40,
  },
  {
    id: "presence",
    storageKey: "aurora_guest_presence",
    eyebrow: "Sua preferência",
    title: () => "Que tipo de presença combina mais com você?",
    body: "A Aurora deve acolher sem invadir. Escolha o tom que parece mais confortável agora.",
    button: "Guardar preferência",
    options: ["Gentil", "Direta", "Profunda", "Prática"],
    max: 40,
  },
];

function clean(value: string, max = 140): string {
  return value.trim().replace(/\s+/g, " ").slice(0, max);
}

function readValue(key: string, fallback = "") {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeValue(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function readContext() {
  try {
    const raw = localStorage.getItem(CONTEXT_KEY);
    return raw ? JSON.parse(raw) as { statusToken?: string; name?: string } : {};
  } catch {
    return {};
  }
}

function syncNameToContext(name: string) {
  try {
    const context = readContext();
    localStorage.setItem(CONTEXT_KEY, JSON.stringify({ ...context, name, savedAt: Date.now() }));
  } catch {
    /* ignore */
  }
}

async function saveProfile(statusToken: string, key: string, value: string) {
  const fieldByKey: Record<string, string> = {
    aurora_guest_name: "name",
    aurora_guest_moment: "moment",
    aurora_guest_rhythm: "rhythm",
    aurora_guest_presence: "presence",
  };
  const field = fieldByKey[key];
  if (!field) return;

  try {
    await fetch("/api/waitlist/profile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ statusToken, [field]: value, source: "hero_invite" }),
    });
  } catch {
    /* local save keeps the experience responsive */
  }
}

export function HeroInviteNextStep({ initialName = "" }: HeroInviteNextStepProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState("");
  const [savedStep, setSavedStep] = useState<StepId | null>(null);

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const step of steps) {
      const fallback = step.id === "name" ? initialName : "";
      next[step.storageKey] = clean(readValue(step.storageKey, fallback), step.max);
    }
    setValues(next);
  }, [initialName]);

  const name = clean(values.aurora_guest_name ?? initialName, 40);
  const current = useMemo(() => {
    const firstOpen = steps.find((step) => !clean(values[step.storageKey] ?? "", step.max));
    return firstOpen ?? null;
  }, [values]);

  useEffect(() => {
    if (!current || current.options) {
      setDraft("");
      return;
    }
    setDraft(clean(values[current.storageKey] ?? "", current.max));
  }, [current, values]);

  if (!current) {
    return (
      <div className={styles.heroInviteNextStep}>
        <div>
          <span>Ritual de Chegada</span>
          <strong>{name ? `${name}, a Aurora já tem seus primeiros sinais.` : "A Aurora já tem seus primeiros sinais."}</strong>
          <p>Quando o acesso chegar, esse começo ajuda a experiência a nascer mais próxima de você.</p>
        </div>
        <a className={styles.heroInviteRitualLink} href="/chegada">
          Rever meu Ritual de Chegada
        </a>
      </div>
    );
  }

  const stepIndex = steps.findIndex((step) => step.id === current.id) + 1;
  const totalSteps = steps.length;
  const displayName = name || "você";

  function save(value: string) {
    const nextValue = clean(value, current?.max);
    if (!current || !nextValue) return;

    writeValue(current.storageKey, nextValue);
    if (current.id === "name") syncNameToContext(nextValue);
    const statusToken = readContext().statusToken;
    if (statusToken) void saveProfile(statusToken, current.storageKey, nextValue);

    setValues((previous) => ({ ...previous, [current.storageKey]: nextValue }));
    setSavedStep(current.id);
    window.setTimeout(() => setSavedStep(null), 1600);
  }

  return (
    <div className={styles.heroInviteNextStep}>
      <div className={styles.heroInviteStepTop}>
        <span>{current.eyebrow}</span>
        <small>
          {stepIndex} de {totalSteps}
        </small>
      </div>

      <div>
        <strong>{current.title(displayName)}</strong>
        <p>{current.body}</p>
      </div>

      {current.options ? (
        <div className={styles.heroInviteChoices}>
          {current.options.map((option) => (
            <button key={option} type="button" onClick={() => save(option)}>
              {option}
            </button>
          ))}
        </div>
      ) : (
        <div className={styles.heroInviteField}>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                save(draft);
              }
            }}
            type="text"
            autoComplete={current.autoComplete ?? "off"}
            placeholder={current.placeholder}
            aria-label={current.title(displayName)}
          />
          <button type="button" onClick={() => save(draft)}>
            {current.button}
          </button>
        </div>
      )}

      {savedStep ? <div className={styles.heroInviteSaved}>Guardado. Próximo passo liberado.</div> : null}

      <a className={styles.heroInviteRitualLink} href="/chegada">
        Continuar meu Ritual de Chegada
      </a>
    </div>
  );
}
