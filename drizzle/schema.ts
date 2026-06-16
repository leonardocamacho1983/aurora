import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  jsonb,
  vector,
  index,
} from "drizzle-orm/pg-core";

/**
 * Schema — Fase 1 (handoff §4).
 *
 * Suposições marcadas com TODO(handoff): confirmar contra o §4 literal.
 * Convenções:
 *  - PKs uuid (defaultRandom) para casar com Supabase auth.users (uuid).
 *  - user_id é o uuid de auth.users (schema `auth`); mantido como uuid sem FK
 *    cross-schema para não acoplar a migration ao schema de auth do Supabase.
 *  - timestamps com timezone.
 */

// Entradas do diário do usuário.
export const entries = pgTable(
  "entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    content: text("content").notNull(),
    mood: varchar("mood", { length: 64 }), // TODO(handoff): enum vs texto livre?
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("entries_user_id_idx").on(t.userId),
  }),
);

// Embeddings para RAG — agnóstico de provedor (provider/model/dimensions
// guardados explicitamente para permitir trocar de provedor de embedding).
export const embeddings = pgTable(
  "embeddings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entryId: uuid("entry_id")
      .notNull()
      .references(() => entries.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    provider: varchar("provider", { length: 64 }).notNull(), // 'voyage' | 'openai' | 'cohere' | ...
    model: varchar("model", { length: 128 }).notNull(),
    dimensions: integer("dimensions").notNull(),
    // TODO(handoff): pgvector exige dimensão fixa para indexar. 1536 como
    // default; se o provedor escolhido usar outra dimensão, ajustar aqui.
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
    chunkIndex: integer("chunk_index").default(0).notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("embeddings_user_id_idx").on(t.userId),
    embeddingIdx: index("embeddings_embedding_idx").using(
      "hnsw",
      t.embedding.op("vector_cosine_ops"),
    ),
  }),
);

// Consentimentos (LGPD/GDPR): processamento de dados, análise por IA, contato em crise, etc.
export const consents = pgTable(
  "consents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    type: varchar("type", { length: 64 }).notNull(), // 'data_processing' | 'ai_analysis' | 'crisis_contact' | ...
    granted: boolean("granted").notNull(),
    version: varchar("version", { length: 32 }).notNull(), // versão dos termos aceitos
    grantedAt: timestamp("granted_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("consents_user_id_idx").on(t.userId),
  }),
);

// Assinaturas — campos AGNÓSTICOS DE PROVEDOR (Stripe, RevenueCat, Apple, Google...).
// Nada de coluna stripe_*; usamos provider + provider_*_id genéricos.
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    provider: varchar("provider", { length: 64 }).notNull(), // 'stripe' | 'revenuecat' | 'apple' | 'google' | ...
    providerCustomerId: varchar("provider_customer_id", { length: 256 }),
    providerSubscriptionId: varchar("provider_subscription_id", { length: 256 }),
    plan: varchar("plan", { length: 64 }).notNull(),
    status: varchar("status", { length: 32 }).notNull(), // 'active' | 'trialing' | 'canceled' | 'past_due' | ...
    currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("subscriptions_user_id_idx").on(t.userId),
  }),
);

// Eventos de crise detectados (segurança do usuário).
export const crisisEvents = pgTable(
  "crisis_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    entryId: uuid("entry_id").references(() => entries.id, { onDelete: "set null" }),
    severity: varchar("severity", { length: 32 }).notNull(), // 'low' | 'medium' | 'high' | 'critical'
    detectedBy: varchar("detected_by", { length: 64 }).notNull(), // 'model' | 'keyword' | 'user_report'
    signals: jsonb("signals"),
    acknowledged: boolean("acknowledged").default(false).notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("crisis_events_user_id_idx").on(t.userId),
  }),
);
