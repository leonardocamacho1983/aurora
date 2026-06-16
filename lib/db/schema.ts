import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  vector,
  index,
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

// users — perfil + role + plano.
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email"),
  name: text("name"),
  locale: text("locale").default("pt-BR").notNull(),
  role: text("role").default("user").notNull(), // 'user' | 'admin'
  plan: text("plan").default("free").notNull(), // 'free' | 'plus'
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
    riskLevel: text("risk_level").default("none").notNull(), // none|low|high
    shared: boolean("shared").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("entries_user_id_idx").on(t.userId),
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
