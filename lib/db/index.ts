import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não definida. Copie .env.example para .env e preencha.");
}

// Disable prefetch — não suportado no "Transaction" pool mode (pooler 6543).
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
export { schema };
