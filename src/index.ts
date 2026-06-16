import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { entries } from "../drizzle/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não definida. Copie .env.example para .env e preencha.");
}

// Disable prefetch — não suportado no "Transaction" pool mode (pooler 6543).
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client);

const allEntries = await db.select().from(entries);
console.log(allEntries);

await client.end();
