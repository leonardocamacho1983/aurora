"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { trackAurora } from "@/lib/analytics/client";
import type { OnboardingContext, OnboardingProfile } from "@/lib/onboarding/context";
import styles from "./Momento.module.css";

type Field = keyof OnboardingProfile;

type Step = {
  field: Field;
  kicker: string;
  title: string;
  help: string;
  placeholder?: string;
  kind: "text" | "textarea" | "presence";
};

type MomentReviewFlowProps = {
  action: (formData: FormData) => void | Promise<void>;
  initialProfile: OnboardingProfile;
  completion: OnboardingContext["completion"];
};

const PRESENCE_OPTIONS = ["Mais calma", "Mais direta", "Mais prática", "Mais acolhedora"];

const BASE_STEPS: Step[] = [
  {
    field: "name",
    kicker: "Como te chamar",
    title: "Como você quer ser chamado aqui?",
    help: "Pode ser só seu primeiro nome.",
    placeholder: "Seu nome",
    kind: "text",
  },
  {
    field: "moment",
    kicker: "Seu momento",
    title: "O que está mais presente para você agora?",
    help: "Uma frase simples já ajuda as próximas respostas a acompanharem melhor esta fase.",
    placeholder: "Ex: entender uma mudança, organizar próximos passos",
    kind: "textarea",
  },
  {
    field: "presence",
    kicker: "Tom da conversa",
    title: "Que tom combina melhor com você agora?",
    help: "Escolha o tom que combina com este momento.",
    kind: "presence",
  },
  {
    field: "rhythm",
    kicker: "Ritmo",
    title: "Quando este espaço costuma ajudar mais?",
    help: "Isso pode ser um horário, uma frequência ou uma situação.",
    placeholder: "Ex: à noite, quando eu precisar decidir, no fim da semana",
    kind: "text",
  },
  {
    field: "value",
    kicker: "O que ajuda",
    title: "O que você quer conseguir enxergar melhor?",
    help: "A resposta pode mudar com o tempo.",
    placeholder: "Ex: perceber padrões antes que virem ansiedade",
    kind: "textarea",
  },
];

const SUMMARY_LABELS: Record<Field, string> = {
  name: "Nome",
  moment: "Seu momento",
  presence: "Como prefere o tom",
  rhythm: "Seu ritmo",
  value: "O que pode ajudar",
};

function normalizePresence(value: string | null) {
  if (!value) return "";
  const normalized = value.toLowerCase();
  if (normalized === "gentil") return "Mais acolhedora";
  if (normalized === "direta") return "Mais direta";
  if (normalized === "profunda") return "Mais calma";
  if (normalized === "prática" || normalized === "pratica") return "Mais prática";
  return value;
}

function initialValues(profile: OnboardingProfile): Record<Field, string> {
  return {
    name: profile.name ?? "",
    moment: profile.moment ?? "",
    presence: normalizePresence(profile.presence),
    rhythm: profile.rhythm ?? "",
    value: profile.value ?? "",
  };
}

export function MomentReviewFlow({
  action,
  initialProfile,
  completion,
}: MomentReviewFlowProps) {
  const started = useRef(false);
  const [values, setValues] = useState<Record<Field, string>>(() => initialValues(initialProfile));
  const steps = useMemo(
    () => (initialProfile.name ? BASE_STEPS.filter((step) => step.field !== "name") : BASE_STEPS),
    [initialProfile.name],
  );
  const [index, setIndex] = useState(0);
  const isSummary = index >= steps.length;
  const current = steps[index];
  const totalSteps = steps.length + 1;

  function trackStarted(step: string) {
    if (started.current) return;
    started.current = true;
    trackAurora("account_moment_started", {
      source: "account_moment",
      surface: "account",
      completion,
      step,
    });
  }

  function update(field: Field, value: string) {
    trackStarted(field);
    setValues((currentValues) => ({ ...currentValues, [field]: value }));
  }

  function next() {
    trackStarted(current?.field ?? "summary");
    setIndex((currentIndex) => Math.min(currentIndex + 1, steps.length));
  }

  function back() {
    setIndex((currentIndex) => Math.max(currentIndex - 1, 0));
  }

  return (
    <form action={action} className={styles.flow}>
      <input type="hidden" name="source" value="account_moment" />
      {(Object.keys(values) as Field[]).map((field) => (
        <input key={field} type="hidden" name={field} value={values[field]} />
      ))}

      <div className={styles.progressRow}>
        <span>Etapa {Math.min(index + 1, totalSteps)} de {totalSteps}</span>
        <Link href="/account">Voltar ao perfil</Link>
      </div>

      {!isSummary && current ? (
        <section className={styles.step} aria-labelledby="moment-step-title">
          <p className={styles.kicker}>{current.kicker}</p>
          <h1 id="moment-step-title" className="font-serif">{current.title}</h1>
          <p>{current.help}</p>

          {current.kind === "presence" ? (
            <div className={styles.presenceGrid} role="radiogroup" aria-label={current.title}>
              {PRESENCE_OPTIONS.map((option) => (
                <button
                  className={`${styles.presenceOption} ${values.presence === option ? styles.selected : ""}`}
                  key={option}
                  type="button"
                  aria-pressed={values.presence === option}
                  onClick={() => update("presence", option)}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : current.kind === "textarea" ? (
            <textarea
              value={values[current.field]}
              onChange={(event) => update(current.field, event.target.value)}
              placeholder={current.placeholder}
              maxLength={current.field === "value" ? 160 : 160}
            />
          ) : (
            <input
              value={values[current.field]}
              onChange={(event) => update(current.field, event.target.value)}
              placeholder={current.placeholder}
              maxLength={current.field === "rhythm" ? 80 : 40}
            />
          )}
        </section>
      ) : (
        <section className={styles.step} aria-labelledby="moment-summary-title">
          <p className={styles.kicker}>Resumo</p>
          <h1 id="moment-summary-title" className="font-serif">Seu ajuste de momento.</h1>
          <p>Veja se está tudo como você quer. Você pode voltar e mudar qualquer ponto.</p>

          <div className={styles.summaryList}>
            {(Object.keys(SUMMARY_LABELS) as Field[]).map((field) => (
              <span key={field}>
                <small>{SUMMARY_LABELS[field]}</small>
                <strong>{values[field] || "Sem resposta por agora"}</strong>
              </span>
            ))}
          </div>
        </section>
      )}

      <div className={styles.actions}>
        <button type="button" className={styles.secondary} onClick={back} disabled={index === 0}>
          Voltar
        </button>
        {isSummary ? (
          <button type="submit" className={styles.primary}>
            Salvar minhas escolhas
          </button>
        ) : (
          <button type="button" className={styles.primary} onClick={next}>
            Continuar
          </button>
        )}
      </div>
    </form>
  );
}
