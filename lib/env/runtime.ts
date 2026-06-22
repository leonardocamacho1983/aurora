export function firstEnv(names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return "";
}

export const RUNTIME_DATABASE_URLS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
] as const;

export const MIGRATION_DATABASE_URLS = [
  "DIRECT_URL",
  "POSTGRES_URL_NON_POOLING",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
] as const;

export const RESEND_API_KEY_NAMES = ["RESEND_API_KEY", "RESEND_TOKEN"] as const;

export const EMAIL_FROM_NAMES = ["EMAIL_FROM", "RESEND_FROM", "FROM_EMAIL", "SENDER_EMAIL"] as const;

