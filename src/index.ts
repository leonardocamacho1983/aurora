/**
 * Teste de conexão com o banco (não faz parte do build do Next).
 * Rode com: npm run db:test
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { entries } from "../lib/db/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não definida. Copie .env.example para .env e preencha.");
}

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client);

const allEntries = await db.select().from(entries);
console.log(`Conexão OK. ${allEntries.length} entrada(s):`, allEntries);

await client.end();
