import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Migrations usam a conexão DIRETA (session mode, porta 5432).
    // Aceita DIRECT_URL ou o nome da integração Supabase (POSTGRES_URL_NON_POOLING).
    url: (process.env.DIRECT_URL ?? process.env.POSTGRES_URL_NON_POOLING)!,
  },
});
