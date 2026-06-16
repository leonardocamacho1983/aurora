import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // Migrations usam a conexão DIRETA (session mode, porta 5432).
    // Em runtime, a app usa DATABASE_URL (transaction pooler, porta 6543).
    url: process.env.DIRECT_URL!,
  },
});
