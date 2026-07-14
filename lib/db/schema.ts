import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  jsonb,
  timestamp,
  vector,
  index,
  uniqueIndex,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

/**
 * Modelo de dados — Handoff §4 (fonte da verdade).
 *
 * Convenções:
 *  - PKs uuid (gen_random_uuid).
 *  - timestamps com timezone.
 *  - `vector(1536)` em embeddings; extensão pgvector criada na 1ª migration.
 *  - subscriptions usa colunas stripe_* (Stack §1 trava Stripe como provedor).
 */

// users — perfil + role + plano. id == auth.users.id (Supabase Auth).
export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // = auth.uid(); populado por trigger no signup
  email: text("email"),
  name: text("name"),
  locale: text("locale").default("pt-BR").notNull(),
  role: text("role").default("user").notNull(), // 'user' | 'admin'
  plan: text("plan").default("free").notNull(), // 'free' | 'plus'
  onboardingCompletedAt: timestamp("onboarding_completed_at", { withTimezone: true }),
  onboardingContext: jsonb("onboarding_context").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// entries — gravação → transcrição → reflexão da Aurora.
export const entries = pgTable(
  "entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    audioUrl: text("audio_url"), // nulo após apagar o áudio (privacidade §10)
    transcript: text("transcript"),
    language: text("language"),
    reflection: text("reflection"), // resposta da Aurora
    mood: text("mood"), // leve|calmo|pesado|sensível|ansioso (opcional)
    focusKey: text("focus_key"),
    focusConfidence: text("focus_confidence"),
    focusReason: text("focus_reason"),
    focusEvidence: jsonb("focus_evidence").$type<string[]>(),
    focusClassifiedAt: timestamp("focus_classified_at", { withTimezone: true }),
    focusHiddenAt: timestamp("focus_hidden_at", { withTimezone: true }),
    focusResolvedAt: timestamp("focus_resolved_at", { withTimezone: true }),
    riskLevel: text("risk_level").default("none").notNull(), // none|low|high
    entryMode: text("entry_mode").default("new").notNull(),
    continuedFromEntryId: uuid("continued_from_entry_id").references(
      (): AnyPgColumn => entries.id,
      { onDelete: "set null" },
    ),
    shared: boolean("shared").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("entries_user_id_idx").on(t.userId),
    userFocusIdx: index("entries_user_focus_idx").on(t.userId, t.focusKey),
  }),
);

// embeddings — vetores p/ RAG (pgvector).
export const embeddings = pgTable(
  "embeddings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entryId: uuid("entry_id")
      .notNull()
      .references(() => entries.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("embeddings_user_id_idx").on(t.userId),
    // Índice HNSW cosine p/ busca de similaridade do RAG (§5).
    embeddingIdx: index("embeddings_embedding_idx").using(
      "hnsw",
      t.embedding.op("vector_cosine_ops"),
    ),
  }),
);

// consents — consentimento granular e revogável (§10).
export const consents = pgTable(
  "consents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // privacidade | compartilhamento | ...
    granted: boolean("granted").notNull(),
    grantedAt: timestamp("granted_at", { withTimezone: true }),
  },
  (t) => ({
    userIdx: index("consents_user_id_idx").on(t.userId),
  }),
);

// subscriptions — Stripe (§1). 1 assinatura por usuário (user_id é a PK).
export const subscriptions = pgTable("subscriptions", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubId: text("stripe_sub_id"),
  status: text("status"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
});

// crisis_events — registro do protocolo de crise (§8). Nunca guarda conteúdo sensível.
export const crisisEvents = pgTable(
  "crisis_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    entryId: uuid("entry_id").references(() => entries.id, { onDelete: "set null" }),
    level: text("level"), // low | high
    shownResources: boolean("shown_resources").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("crisis_events_user_id_idx").on(t.userId),
  }),
);

// waitlist — lista de espera pública + loop de indicações por double opt-in.
export const waitlist = pgTable(
  "waitlist",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    referralCode: text("referral_code").notNull().unique(),
    statusToken: uuid("status_token").notNull().defaultRandom().unique(),
    confirmToken: uuid("confirm_token").notNull().defaultRandom().unique(),
    referredByCode: text("referred_by_code"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    unlockedAt: timestamp("unlocked_at", { withTimezone: true }),
    milestoneNotified: integer("milestone_notified").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    referredByIdx: index("waitlist_referred_by_code_idx").on(t.referredByCode),
    confirmedReferralIdx: index("waitlist_confirmed_referral_idx").on(
      t.referredByCode,
      t.confirmedAt,
    ),
  }),
);

// waitlist_profile — respostas leves do Ritual de Chegada, ligadas à pessoa da lista.
export const waitlistProfile = pgTable("waitlist_profile", {
  waitlistId: uuid("waitlist_id")
    .primaryKey()
    .references(() => waitlist.id, { onDelete: "cascade" }),
  name: text("name"),
  moment: text("moment"),
  rhythm: text("rhythm"),
  presence: text("presence"),
  value: text("value"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// waitlist_events — eventos server-side mínimos para acompanhar o loop sem dados sensíveis.
export const waitlistEvents = pgTable(
  "waitlist_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    waitlistId: uuid("waitlist_id").references(() => waitlist.id, { onDelete: "cascade" }),
    eventName: text("event_name").notNull(),
    source: text("source"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    waitlistIdx: index("waitlist_events_waitlist_id_idx").on(t.waitlistId),
    eventIdx: index("waitlist_events_event_name_idx").on(t.eventName),
  }),
);

// email_outbox — fila auditavel para operacoes de lifecycle/email sem dados sensiveis.
export const emailOutbox = pgTable(
  "email_outbox",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    waitlistId: uuid("waitlist_id").references(() => waitlist.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    eventName: text("event_name").notNull(),
    templateKey: text("template_key"),
    topicKey: text("topic_key"),
    priority: integer("priority").default(50).notNull(),
    status: text("status").default("pending").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    payloadSummary: jsonb("payload_summary").$type<Record<string, unknown>>(),
    providerEventId: text("provider_event_id"),
    lastError: text("last_error"),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }).defaultNow().notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    waitlistIdx: index("email_outbox_waitlist_id_idx").on(t.waitlistId),
    statusNextAttemptIdx: index("email_outbox_status_next_attempt_idx").on(t.status, t.nextAttemptAt),
    idempotencyIdx: uniqueIndex("email_outbox_idempotency_key_idx").on(t.idempotencyKey),
  }),
);
