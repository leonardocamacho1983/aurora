"use client";

import type { MouseEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { trackAurora } from "@/lib/analytics/client";
import styles from "./BoasVindas.module.css";

type SlideKey = "voice" | "not_chat" | "privacy" | "reflection";

type Slide = {
  key: SlideKey;
  eyebrow: string;
  title: string;
  body: string;
};

const SLIDES: Slide[] = [
  {
    key: "voice",
    eyebrow: "Diário por voz",
    title: "Você começa falando.",
    body: "Não precisa escrever, organizar antes ou achar a frase certa. Fale do jeito que vier.",
  },
  {
    key: "not_chat",
    eyebrow: "Não é chat",
    title: "A Aurora não puxa conversa infinita.",
    body: "Ela recebe um registro e devolve uma reflexão curta para você se escutar melhor.",
  },
  {
    key: "privacy",
    eyebrow: "Privacidade prática",
    title: "O conteúdo íntimo fica fora dos relatórios.",
    body: "A Aurora pode registrar etapas do fluxo. O que você fala e a reflexão que recebe não entram nos relatórios internos de funcionamento.",
  },
  {
    key: "reflection",
    eyebrow: "Primeira reflexão",
    title: "O primeiro valor é dar forma.",
    body: "Depois da fala, a Aurora ajuda a nomear o centro do registro, perceber um padrão e abrir um próximo passo possível.",
  },
];

const FIRST_VALUE_GOAL = "first_reflection";
const ONBOARDING_SOURCE = "product_onboarding_alpha";
const ONBOARDING_VARIANT = "alpha";

function clampStep(index: number) {
  return Math.min(Math.max(index, 0), SLIDES.length - 1);
}

function stepHref(index: number, previewMode: boolean) {
  const params = new URLSearchParams({ step: String(index + 1) });
  if (previewMode) params.set("preview", "1");
  return `/boas-vindas?${params.toString()}`;
}

function stepFromLocation() {
  if (typeof window === "undefined") return 0;
  const parsed = Number.parseInt(new URLSearchParams(window.location.search).get("step") ?? "1", 10);
  return Number.isFinite(parsed) ? clampStep(parsed - 1) : 0;
}

function SlideVisual({ slide, hasRitualSignal }: { slide: Slide; hasRitualSignal: boolean }) {
  if (slide.key === "voice") {
    return (
      <div className={styles.visualVoice} aria-hidden="true">
        <span className={`${styles.demoOrb} ${styles.demoOrbRecording}`} />
        <div className={styles.voiceCaption}>
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }

  if (slide.key === "not_chat") {
    return (
      <div className={styles.visualExchange} aria-hidden="true">
        <div className={styles.voiceNote}>
          <span className={styles.notePulse} />
          <div>
            <strong>Registro de voz</strong>
            <p>um momento real, do jeito que saiu</p>
          </div>
        </div>
        <div className={styles.exchangeLine} />
        <div className={styles.reflectionCard}>
          <small>Reflexão</small>
          <p>uma leitura breve, sem conversa infinita</p>
        </div>
      </div>
    );
  }

  if (slide.key === "privacy") {
    return (
      <div className={styles.visualPrivacy} aria-hidden="true">
        <div className={styles.privateBox}>
          <span />
          <strong>Diário privado</strong>
          <p>voz e reflexão ficam aqui</p>
        </div>
        <div className={styles.reportBox}>
          <strong>Funcionamento</strong>
          <span>etapa concluída</span>
          <span>erro técnico</span>
          <span>dispositivo</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.visualReflection} aria-hidden="true">
      <span className={`${styles.demoOrb} ${styles.demoOrbReflecting}`} />
      <div className={styles.finalReflection}>
        <small>{hasRitualSignal ? "Com o que você já trouxe" : "Depois do primeiro registro"}</small>
        <p>dar forma, perceber padrões e encontrar um próximo passo possível</p>
      </div>
    </div>
  );
}

export function OnboardingAlphaSlides({
  active,
  analyticsId,
  finalPrimaryAction,
  firstName,
  hasRitualSignal,
  hasOnboardingMoment,
  previewMode = false,
}: {
  active: number;
  analyticsId: string;
  finalPrimaryAction: ReactNode;
  firstName?: string | null;
  hasRitualSignal: boolean;
  hasOnboardingMoment: boolean;
  previewMode?: boolean;
  ritualMoment?: string | null;
}) {
  const [activeIndex, setActiveIndex] = useState(() => clampStep(active));
  const slide = SLIDES[activeIndex];
  const isFirst = activeIndex === 0;
  const isLast = activeIndex === SLIDES.length - 1;
  const progress = ((activeIndex + 1) / SLIDES.length) * 100;

  useEffect(() => {
    function onPopState() {
      setActiveIndex(stepFromLocation());
    }

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function goTo(index: number, event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;

    event.preventDefault();
    const nextIndex = clampStep(index);
    if (nextIndex === activeIndex) return;

    const href = stepHref(nextIndex, previewMode);
    window.history.pushState(null, "", href);
    setActiveIndex(nextIndex);
    if (previewMode) return;

    window.setTimeout(() => {
      trackAurora(
        "product_onboarding_step_viewed",
        {
          source: ONBOARDING_SOURCE,
          variant: ONBOARDING_VARIANT,
          first_value_goal: FIRST_VALUE_GOAL,
          step: SLIDES[nextIndex].key,
          has_onboarding_moment: hasOnboardingMoment,
        },
        { distinctId: analyticsId },
      );
    }, 0);
  }

  return (
    <div className={`${styles.slides} ${isLast ? styles.slidesFinal : ""}`} aria-label="Onboarding Alpha da Aurora">
      <div className={styles.progressShell} aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className={`${styles.slideFrame} ${isLast ? styles.slideFrameFinal : ""}`} data-slide={slide.key} key={slide.key}>
        <div className={styles.slideCopy}>
          <p className={styles.kicker}>{slide.eyebrow}</p>
          <h1>{firstName && isFirst ? `${firstName}, você começa falando.` : slide.title}</h1>
          <p>{slide.body}</p>
          {slide.key === "voice" && (
            <p className={styles.contextLine}>
              {hasRitualSignal
                ? "Você já trouxe um tema no Ritual de Chegada. Pode começar por ele ou pelo que estiver vivo agora."
                : "Quando abrir o diário, comece pelo que estiver vivo agora."}
            </p>
          )}
        </div>

        <SlideVisual hasRitualSignal={hasRitualSignal} slide={slide} />
      </div>

      <nav className={styles.slideNav} aria-label="Etapas do onboarding">
        {SLIDES.map((item, index) => (
          <a
            aria-current={index === activeIndex ? "step" : undefined}
            aria-label={`Ir para etapa ${index + 1}: ${item.eyebrow}`}
            className={styles.dotButton}
            href={stepHref(index, previewMode)}
            key={item.key}
            onClick={(event) => goTo(index, event)}
          />
        ))}
      </nav>

      {isLast ? (
        <div className={styles.finalSlideActions}>
          {finalPrimaryAction}
        </div>
      ) : (
        <div className={styles.slideActions}>
          {isFirst ? (
            <span aria-disabled="true" className={styles.secondary}>
              Voltar
            </span>
          ) : (
            <a className={styles.secondary} href={stepHref(activeIndex - 1, previewMode)} onClick={(event) => goTo(activeIndex - 1, event)}>
              Voltar
            </a>
          )}
          <a className={styles.primary} href={stepHref(activeIndex + 1, previewMode)} onClick={(event) => goTo(activeIndex + 1, event)}>
            Próximo
          </a>
        </div>
      )}
    </div>
  );
}
