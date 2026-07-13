import type { OnboardingContext, OnboardingProfile } from "@/lib/onboarding/context";

export type AccountProfileState = "empty" | "active_empty" | "partial" | "ready" | "active" | "stale";

type ActivitySummary = {
  entryCount: number;
  lastEntryAt: Date | null;
};

export type AccountProfileView = {
  state: AccountProfileState;
  title: string;
  body: string;
  ctaLabel: string;
  completionLabel: string;
  updatedLabel: string;
  filledFields: Array<keyof OnboardingProfile>;
  missingFields: Array<keyof OnboardingProfile>;
};

const FIELD_LABELS: Record<keyof OnboardingProfile, string> = {
  name: "Como te chamar",
  moment: "Seu momento",
  rhythm: "Seu ritmo",
  presence: "Tom da conversa",
  value: "O que pode ajudar",
};

const FIELD_ORDER: Array<keyof OnboardingProfile> = [
  "name",
  "presence",
  "moment",
  "rhythm",
  "value",
];

function daysSince(date: Date | null) {
  if (!date) return null;
  return Math.floor((Date.now() - date.getTime()) / 86_400_000);
}

function stateFor(context: OnboardingContext, activity: ActivitySummary): AccountProfileState {
  if (context.completion === "empty") return activity.entryCount > 0 ? "active_empty" : "empty";
  if (context.completion === "partial") return "partial";

  const updateAge = daysSince(context.updatedAt ?? context.completedAt);
  if (activity.entryCount > 0) {
    if (updateAge !== null && updateAge >= 45) return "stale";
    return "active";
  }

  return "ready";
}

function formatDate(date: Date | null) {
  if (!date) return "Ainda não revisado";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function copyFor(state: AccountProfileState, firstName: string) {
  const activeTitle = firstName
    ? `${firstName}, seu diário já guarda momentos seus.`
    : "Seu diário já guarda momentos seus.";
  const copy: Record<AccountProfileState, Pick<AccountProfileView, "title" | "body" | "ctaLabel">> = {
    empty: {
      title: "Quando você começar a usar o diário, sua história aparece aqui.",
      body: "Você pode ajustar seu momento agora ou simplesmente abrir o diário e falar no seu tempo.",
      ctaLabel: "Ajustar meu momento",
    },
    active_empty: {
      title: activeTitle,
      body: "Aqui ficam seus registros, os dias em que você voltou e os controles da sua conta.",
      ctaLabel: "Ajustar meu momento",
    },
    partial: {
      title: "Seu jeito já começou a aparecer.",
      body: "Você já contou uma parte do que ajuda. Pode completar quando quiser, sem interromper o diário.",
      ctaLabel: "Completar meu momento",
    },
    ready: {
      title: "Seu jeito de ser recebido está salvo.",
      body: "Use este espaço para revisar seu momento, seu ritmo e o tipo de resposta que costuma ajudar.",
      ctaLabel: "Atualizar meu momento",
    },
    active: {
      title: "Sua história e seu jeito ficam juntos aqui.",
      body: "O diário continua como sempre. Este espaço só ajuda a manter as próximas conversas mais próximas do que você precisa agora.",
      ctaLabel: "Atualizar meu momento",
    },
    stale: {
      title: "Sua fase pode ter mudado.",
      body: "Se algo importante mudou, você pode revisar seu momento para as próximas conversas acompanharem melhor essa fase.",
      ctaLabel: "Revisar meu momento",
    },
  };
  return copy[state];
}

export function fieldLabel(field: keyof OnboardingProfile) {
  return FIELD_LABELS[field];
}

export function accountProfileView(
  context: OnboardingContext,
  activity: ActivitySummary,
): AccountProfileView {
  const state = stateFor(context, activity);
  const firstName = context.profile.name?.split(" ")[0] ?? "";
  const filledFields = FIELD_ORDER.filter((field) => Boolean(context.profile[field]));
  const missingFields = FIELD_ORDER.filter((field) => !context.profile[field]);
  const updatedAt = context.completion === "empty" ? null : context.updatedAt ?? context.completedAt;

  return {
    state,
    ...copyFor(state, firstName),
    completionLabel:
      state === "active_empty"
        ? "Momento em aberto"
        : context.completion === "complete"
        ? "Momento salvo"
        : context.completion === "partial"
          ? `${context.completedFields}/${context.totalFields} respostas`
          : "Opcional",
    updatedLabel: formatDate(updatedAt),
    filledFields,
    missingFields,
  };
}
