export const RITUAL_INTENTS = [
  "tasks_projects",
  "hard_moments",
  "self_understanding",
  "habit_practice",
  "unknown",
] as const;

export type RitualIntent = (typeof RITUAL_INTENTS)[number];

export const RITUAL_STATUSES = ["not_started", "started", "completed"] as const;
export type RitualStatus = (typeof RITUAL_STATUSES)[number];

export const ACCESS_STATUSES = ["no_access", "invited", "active"] as const;
export type AccessStatus = (typeof ACCESS_STATUSES)[number];

export const LIFECYCLE_STATES = [
  "waitlist",
  "waitlist_no_ritual",
  "ritual_started_incomplete",
  "ritual_completed_no_access",
  "access_granted_no_account",
  "account_created_no_first_entry",
  "first_reflection_done",
  "active_tester",
] as const;
export type LifecycleState = (typeof LIFECYCLE_STATES)[number];

export const AURORA_LIFECYCLE_EVENTS = [
  "aurora.waitlist.confirmed",
  "aurora.ritual.started",
  "aurora.ritual.completed",
  "aurora.access.granted",
  "aurora.account.created",
  "aurora.first_entry.created",
  "aurora.first_reflection.created",
  "aurora.returned_day2",
  "aurora.invite.shared",
  "aurora.lifecycle.test",
] as const;

export type AuroraLifecycleEventName = (typeof AURORA_LIFECYCLE_EVENTS)[number];

export const EMAIL_TOPIC_KEYS = [
  "testing_access",
  "learn_aurora",
  "product_news",
  "community_invites",
] as const;

export type EmailTopicKey = (typeof EMAIL_TOPIC_KEYS)[number];

export const RESEND_TOPICS: Record<
  EmailTopicKey,
  { name: string; description: string; defaultSubscription: "opt_in" | "opt_out" }
> = {
  testing_access: {
    name: "Acesso e participacao nos testes",
    description: "Convites, acesso antecipado e comunicacoes diretamente ligadas ao programa de testes.",
    defaultSubscription: "opt_in",
  },
  learn_aurora: {
    name: "Aprender a usar a Aurora",
    description: "Conteudos de onboarding, pratica de diario e uso cuidadoso da Aurora.",
    defaultSubscription: "opt_in",
  },
  product_news: {
    name: "Novidades do produto",
    description: "Mudancas importantes, principios e evolucao da Aurora.",
    defaultSubscription: "opt_in",
  },
  community_invites: {
    name: "Comunidade e convites",
    description: "Convites para amigos, comunidade e formas de ajudar a Aurora a nascer melhor.",
    defaultSubscription: "opt_in",
  },
};

export const RESEND_SEGMENT_KEYS = [
  "waitlist_no_ritual",
  "ritual_started_incomplete",
  "ritual_completed_no_access",
  "access_granted_no_account",
  "account_created_no_first_entry",
  "first_reflection_done",
  "active_tester",
  "intent_tasks_projects",
  "intent_hard_moments",
  "intent_self_understanding",
  "intent_habit_practice",
] as const;

export type ResendSegmentKey = (typeof RESEND_SEGMENT_KEYS)[number];

export const RESEND_SEGMENTS: Record<ResendSegmentKey, { name: string }> = {
  waitlist_no_ritual: { name: "Aurora - Waitlist sem Ritual" },
  ritual_started_incomplete: { name: "Aurora - Ritual iniciado incompleto" },
  ritual_completed_no_access: { name: "Aurora - Ritual completo sem acesso" },
  access_granted_no_account: { name: "Aurora - Acesso liberado sem conta" },
  account_created_no_first_entry: { name: "Aurora - Conta sem primeira entrada" },
  first_reflection_done: { name: "Aurora - Primeira reflexao feita" },
  active_tester: { name: "Aurora - Tester ativo" },
  intent_tasks_projects: { name: "Aurora - Intencao tarefas e projetos" },
  intent_hard_moments: { name: "Aurora - Intencao momentos dificeis" },
  intent_self_understanding: { name: "Aurora - Intencao autoconhecimento" },
  intent_habit_practice: { name: "Aurora - Intencao pratica de diario" },
};

export type LifecycleContactProperties = {
  waitlistId?: string;
  email: string;
  firstName?: string | null;
  ritualStatus?: RitualStatus;
  ritualIntent?: RitualIntent;
  accessStatus?: AccessStatus;
  lifecycleState?: LifecycleState;
  testerStatus?: "candidate" | "tester" | "active" | "inactive";
  lastProductEventAt?: string | null;
};

export function lifecycleSegmentsForContact(
  properties: Pick<LifecycleContactProperties, "lifecycleState" | "ritualIntent">,
): ResendSegmentKey[] {
  const keys = new Set<ResendSegmentKey>();

  if (
    properties.lifecycleState &&
    (RESEND_SEGMENT_KEYS as readonly string[]).includes(properties.lifecycleState)
  ) {
    keys.add(properties.lifecycleState as ResendSegmentKey);
  }

  if (properties.ritualIntent && properties.ritualIntent !== "unknown") {
    keys.add(`intent_${properties.ritualIntent}` as ResendSegmentKey);
  }

  return [...keys];
}

export function eventTopic(eventName: AuroraLifecycleEventName): EmailTopicKey {
  if (eventName === "aurora.invite.shared") return "community_invites";
  if (
    eventName === "aurora.first_entry.created" ||
    eventName === "aurora.first_reflection.created" ||
    eventName === "aurora.returned_day2"
  ) {
    return "learn_aurora";
  }
  if (eventName === "aurora.waitlist.confirmed" || eventName === "aurora.ritual.started") {
    return "testing_access";
  }
  return "testing_access";
}

export function lifecycleStateFromSignals(input: {
  ritualStatus?: RitualStatus;
  accessStatus?: AccessStatus;
  hasAccount?: boolean;
  hasEntry?: boolean;
  hasReflection?: boolean;
  activeTester?: boolean;
}): LifecycleState {
  if (input.activeTester) return "active_tester";
  if (input.hasReflection) return "first_reflection_done";
  if (input.hasAccount && !input.hasEntry) return "account_created_no_first_entry";
  if (input.accessStatus === "active" && !input.hasAccount) return "access_granted_no_account";
  if (input.ritualStatus === "completed" && input.accessStatus !== "active") {
    return "ritual_completed_no_access";
  }
  if (input.ritualStatus === "started") return "ritual_started_incomplete";
  if (input.ritualStatus === "not_started") return "waitlist_no_ritual";
  return "waitlist";
}
