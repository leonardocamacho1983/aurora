"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./StateComponents.module.css";

type FeedbackKind = "reflection_micro" | "pmf";
type FeedbackAction = "shown" | "answered" | "skipped" | "snoozed";
type MicroAnswer = "positive" | "negative";
type PmfAnswer =
  | "very_disappointed"
  | "somewhat_disappointed"
  | "not_disappointed"
  | "not_sure_yet";

type Eligibility = {
  reflectionMicro: { eligible: boolean };
  pmf: { eligible: boolean; variant: string; testMode?: boolean };
};

type PmfPromptProps = {
  entryId: string | null;
  entryMode: string;
  onActiveChange?: (active: boolean) => void;
  source?: "diary_reflection" | "timeline";
  suspended?: boolean;
};

const PMF_VARIANT = "alpha_pmf_v1";

const PMF_OPTIONS: Array<{ value: PmfAnswer; label: string }> = [
  { value: "very_disappointed", label: "Faria muita falta" },
  { value: "somewhat_disappointed", label: "Faria alguma falta" },
  { value: "not_disappointed", label: "Não faria tanta falta" },
  { value: "not_sure_yet", label: "Ainda usei pouco" },
];

const FOLLOW_UP_QUESTION = "O que te daria vontade de voltar aqui outra vez?";

const FOLLOW_UPS: Record<PmfAnswer, { options: Array<{ value: string; label: string }> }> = {
  very_disappointed: {
    options: [
      { value: "more_clarity", label: "Sair com mais clareza" },
      { value: "continue_this_thread", label: "Retomar este fio" },
      { value: "name_feeling", label: "Nomear melhor o que eu sinto" },
      { value: "next_steps", label: "Ver um próximo passo" },
    ],
  },
  somewhat_disappointed: {
    options: [
      { value: "more_clarity", label: "Mais clareza no fim" },
      { value: "continue_this_thread", label: "Retomar este fio" },
      { value: "clear_start", label: "Saber melhor o que dizer" },
      { value: "closer_reflection", label: "Uma devolutiva mais próxima" },
      { value: "right_moment", label: "Usar no momento certo" },
    ],
  },
  not_disappointed: {
    options: [
      { value: "clear_start", label: "Saber melhor o que dizer" },
      { value: "closer_reflection", label: "Uma devolutiva mais próxima" },
      { value: "right_moment", label: "Tentar em outro momento" },
      { value: "lighter_experience", label: "Ser mais simples" },
    ],
  },
  not_sure_yet: {
    options: [
      { value: "clear_start", label: "Saber melhor o que dizer" },
      { value: "example_when_to_use", label: "Ver quando usar" },
      { value: "right_moment", label: "Tentar em outro momento" },
      { value: "continue_this_thread", label: "Voltar a este fio" },
    ],
  },
};

async function postFeedback({
  kind,
  action,
  entryId,
  answer,
  reason,
  source,
  entryMode,
}: {
  kind: FeedbackKind;
  action: FeedbackAction;
  entryId: string;
  answer?: string;
  reason?: string;
  source: string;
  entryMode: string;
}) {
  const response = await fetch("/api/product-feedback", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      kind,
      action,
      entryId,
      answer,
      reason,
      source,
      variant: PMF_VARIANT,
      entryMode,
    }),
  });

  if (!response.ok) {
    throw new Error("feedback_request_failed");
  }
}

export function PmfPrompt({
  entryId,
  entryMode,
  onActiveChange,
  source = "diary_reflection",
  suspended = false,
}: PmfPromptProps) {
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [microAnswer, setMicroAnswer] = useState<MicroAnswer | null>(null);
  const [pmfVisible, setPmfVisible] = useState(false);
  const [pmfAnswer, setPmfAnswer] = useState<PmfAnswer | null>(null);
  const [error, setError] = useState("");
  const [useMobilePortal, setUseMobilePortal] = useState(false);
  const shownRef = useRef(new Set<string>());

  useEffect(() => {
    const query = window.matchMedia("(max-width: 899px)");
    const syncPortalMode = () => setUseMobilePortal(query.matches);

    syncPortalMode();
    query.addEventListener("change", syncPortalMode);
    return () => query.removeEventListener("change", syncPortalMode);
  }, []);

  useEffect(() => {
    shownRef.current = new Set();
    setEligibility(null);
    setMicroAnswer(null);
    setPmfVisible(false);
    setPmfAnswer(null);
    setError("");

    if (!entryId) return;
    let ignore = false;

    async function load() {
      try {
        const response = await fetch(`/api/product-feedback?entryId=${entryId}`, {
          headers: { accept: "application/json" },
        });
        if (!response.ok) return;
        const data = (await response.json()) as Eligibility;
        if (ignore) return;
        setEligibility(data);
        if (!data.reflectionMicro.eligible && data.pmf.eligible) {
          setPmfVisible(true);
        }
      } catch {
        if (!ignore) setError("Não conseguimos carregar a pergunta agora.");
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [entryId]);

  useEffect(() => {
    if (!entryId || !eligibility || suspended) return;

    if (eligibility.reflectionMicro.eligible) {
      markShown("reflection_micro");
      return;
    }

    if (eligibility.pmf.eligible && pmfVisible) {
      markShown("pmf");
    }
  }, [eligibility, entryId, pmfVisible, suspended]);

  const showMicro = Boolean(entryId && eligibility?.reflectionMicro.eligible && !microAnswer);
  const showPmf = Boolean(entryId && pmfVisible && eligibility?.pmf.eligible);
  const promptActive = showMicro || showPmf;

  useEffect(() => {
    onActiveChange?.(promptActive && !suspended);
    return () => onActiveChange?.(false);
  }, [onActiveChange, promptActive, suspended]);

  useEffect(() => {
    if (!showPmf || suspended) return;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [showPmf, suspended]);

  async function markShown(kind: FeedbackKind) {
    if (!entryId || shownRef.current.has(kind)) return;
    shownRef.current.add(kind);
    try {
      await postFeedback({ kind, action: "shown", entryId, source, entryMode });
    } catch {
      shownRef.current.delete(kind);
    }
  }

  async function chooseMicro(answer: MicroAnswer) {
    if (!entryId) return;
    setIsLoading(true);
    setError("");
    try {
      await postFeedback({
        kind: "reflection_micro",
        action: "answered",
        entryId,
        answer,
        source,
        entryMode,
      });
      setMicroAnswer(answer);
      if (answer === "positive" && eligibility?.pmf.eligible) {
        setPmfVisible(true);
        await markShown("pmf");
      }
    } catch {
      setError("Não conseguimos registrar agora.");
    } finally {
      setIsLoading(false);
    }
  }

  async function completePmf(action: FeedbackAction, answer?: PmfAnswer, reason?: string) {
    if (!entryId) return;
    setIsLoading(true);
    setError("");
    try {
      await postFeedback({
        kind: "pmf",
        action,
        entryId,
        answer,
        reason,
        source,
        entryMode,
      });
      setPmfVisible(false);
      setPmfAnswer(null);
    } catch {
      setError("Não conseguimos registrar agora.");
    } finally {
      setIsLoading(false);
    }
  }

  const selectedPmfLabel = pmfAnswer
    ? PMF_OPTIONS.find((option) => option.value === pmfAnswer)?.label
    : null;
  if (suspended) return null;
  if (!entryId || !eligibility || (!showMicro && !showPmf && !error)) return null;

  const pmfDialog = showPmf ? (
    <div className={styles.pmfModalOverlay}>
      <div
        aria-labelledby="pmf-dialog-title"
        aria-modal="true"
        className={styles.pmfModal}
        role="dialog"
      >
        {!pmfAnswer ? (
          <div className={styles.pmfModalStep}>
            <div className={styles.pmfHeader}>
              <div className={styles.pmfMetaLine}>
                <p className={styles.pmfKicker}>Pergunta rápida</p>
                <p className={styles.pmfStep}>1 de 2</p>
              </div>
              <p className={styles.pmfModalQuestion} id="pmf-dialog-title">
                Como você se sentiria se não pudesse mais usar a Aurora?
              </p>
              <p className={styles.pmfPrivacy}>A resposta não entra na sua reflexão.</p>
            </div>

            <div className={styles.pmfOptions}>
              {PMF_OPTIONS.map((option) => (
                <button
                  aria-pressed={pmfAnswer === option.value}
                  disabled={isLoading}
                  key={option.value}
                  onClick={() => setPmfAnswer(option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className={styles.pmfActions}>
              <button disabled={isLoading} onClick={() => completePmf("skipped")} type="button">
                Agora não
              </button>
              <button disabled={isLoading} onClick={() => completePmf("snoozed")} type="button">
                Perguntar depois
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.pmfModalStep}>
            <div className={styles.pmfAnswerSummary}>
              <span>Você respondeu: {selectedPmfLabel}</span>
              <button disabled={isLoading} onClick={() => setPmfAnswer(null)} type="button">
                Alterar
              </button>
            </div>

            <div className={styles.pmfHeader}>
              <div className={styles.pmfMetaLine}>
                <p className={styles.pmfKicker}>Pergunta rápida</p>
                <p className={styles.pmfStep}>2 de 2</p>
              </div>
              <p className={styles.pmfModalQuestion} id="pmf-dialog-title">
                {FOLLOW_UP_QUESTION}
              </p>
              <p className={styles.pmfPrivacy}>Escolha uma opção. Pode pular.</p>
            </div>

            <div className={styles.pmfOptions}>
              {FOLLOW_UPS[pmfAnswer].options.map((option) => (
                <button
                  disabled={isLoading}
                  key={option.value}
                  onClick={() => completePmf("answered", pmfAnswer, option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>

            <button
              className={styles.pmfTextAction}
              disabled={isLoading}
              onClick={() => completePmf("answered", pmfAnswer)}
              type="button"
            >
              Pular detalhe
            </button>
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <section className={styles.pmfPrompt} aria-label="Feedback sobre a experiência">
      {showMicro ? (
        <div className={styles.pmfMicroBlock}>
          <p className={styles.pmfQuestion}>A devolutiva fez sentido pra você?</p>
          <div className={styles.feedbackMicro}>
            <button
              aria-pressed={microAnswer === "positive"}
              disabled={isLoading}
              onClick={() => chooseMicro("positive")}
              type="button"
            >
              Fez sentido
            </button>
            <button
              aria-pressed={microAnswer === "negative"}
              disabled={isLoading}
              onClick={() => chooseMicro("negative")}
              type="button"
            >
              Não tanto
            </button>
          </div>
        </div>
      ) : null}

      {useMobilePortal && pmfDialog ? createPortal(pmfDialog, document.body) : pmfDialog}

      {error ? <p className={styles.pmfError}>{error}</p> : null}
    </section>
  );
}
