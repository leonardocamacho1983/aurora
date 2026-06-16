import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DB = ReturnType<typeof drizzle<typeof schema>>;

let instance: DB | null = null;

function getDb(): DB {
  if (instance) return instance;

  // Aceita o nome convencional (DATABASE_URL) OU o que a integração
  // Supabase↔Vercel cria (POSTGRES_URL, pooler 6543). Evita ter que duplicar
  // uma variável Sensitive que não pode ser copiada.
  const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error(
      "Defina DATABASE_URL (ou POSTGRES_URL). Copie .env.example para .env e preencha.",
    );
  }

  // Disable prefetch — não suportado no "Transaction" pool mode (pooler 6543).
  const client = postgres(connectionString, { prepare: false });
  instance = drizzle(client, { schema });
  return instance;
}

/**
 * Cliente Drizzle preguiçoso: só conecta (e só exige DATABASE_URL) na primeira
 * query. Importar este módulo não dispara conexão — assim os testes que injetam
 * dependências não precisam de banco.
 */
export const db = new Proxy({} as DB, {
  get(_target, prop, receiver) {
    const real = getDb() as unknown as Record<string | symbol, unknown>;
    const value = Reflect.get(real, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export { schema };
