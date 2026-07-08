import { existsSync, readFileSync } from "node:fs";
import postgres from "postgres";

const DEFAULT_ENV_FILES = [".env", ".env.local", ".env.development.local", ".env.production.local"];

const expectedEntryColumns = [
  "continued_from_entry_id",
  "entry_mode",
  "focus_classified_at",
  "focus_confidence",
  "focus_evidence",
  "focus_hidden_at",
  "focus_key",
  "focus_reason",
  "focus_resolved_at",
];

function argValues(name: string) {
  const prefix = `--${name}=`;
  return process.argv.filter((arg) => arg.startsWith(prefix)).map((arg) => arg.slice(prefix.length));
}

function loadEnvFile(file: string) {
  if (!existsSync(file)) return;

  for (const line of readFileSync(file, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;

    const key = match[1];
    const value = match[2].trim().replace(/^["']|["']$/g, "");
    if (!value || process.env[key]) continue;
    process.env[key] = value;
  }
}

function safeStatus(value: string | undefined) {
  return Boolean(value?.trim());
}

function finish(payload: Record<string, unknown>, ok: boolean): never {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(ok ? 0 : 1);
}

for (const file of argValues("env-file")) loadEnvFile(file);
if (!argValues("env-file").length) {
  for (const file of DEFAULT_ENV_FILES) loadEnvFile(file);
}

const migrationDatabaseUrl =
  process.env.DIRECT_URL ?? process.env.POSTGRES_URL_NON_POOLING ?? process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
const runtimeDatabaseUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
const envStatus = {
  anthropicApiKey: safeStatus(process.env.ANTHROPIC_API_KEY),
  migrationDatabaseUrl: safeStatus(migrationDatabaseUrl),
  runtimeDatabaseUrl: safeStatus(runtimeDatabaseUrl),
};

if (!migrationDatabaseUrl) {
  finish(
    {
      status: "blocked",
      env: envStatus,
      issue: "missing_migration_database_url",
    },
    false,
  );
}

const sql = postgres(migrationDatabaseUrl, { prepare: false, max: 1 });

try {
  const columns = await sql<{ columnName: string }[]>`
    select column_name as "columnName"
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'entries'
      and column_name = any(${expectedEntryColumns})
    order by column_name
  `;
  const foundColumns = new Set(columns.map((row) => row.columnName));
  const missingColumns = expectedEntryColumns.filter((column) => !foundColumns.has(column));

  const [indexRow] = await sql<{ hasIndex: boolean }[]>`
    select exists (
      select 1
      from pg_indexes
      where schemaname = 'public'
        and tablename = 'entries'
        and indexname = 'entries_user_focus_idx'
    ) as "hasIndex"
  `;
  const [constraintRow] = await sql<{ hasConstraint: boolean }[]>`
    select exists (
      select 1
      from pg_constraint
      where conname = 'entries_continued_from_entry_id_entries_id_fk'
    ) as "hasConstraint"
  `;

  const [focusSummary] = missingColumns.length
    ? [
        {
          entries: null,
          classified: null,
          visible: null,
          hidden: null,
          pending: null,
        },
      ]
    : await sql<{ entries: number; classified: number; visible: number; hidden: number; pending: number }[]>`
        select
          count(*)::int as entries,
          count(*) filter (where focus_classified_at is not null)::int as classified,
          count(*) filter (
            where focus_key is not null
              and focus_confidence in ('high', 'medium')
              and focus_hidden_at is null
              and focus_resolved_at is null
          )::int as visible,
          count(*) filter (where focus_hidden_at is not null)::int as hidden,
          count(*) filter (
            where focus_classified_at is null
              and coalesce(risk_level, 'none') <> 'high'
              and (
                nullif(trim(coalesce(transcript, '')), '') is not null
                or nullif(trim(coalesce(reflection, '')), '') is not null
              )
          )::int as pending
        from entries
      `;

  const ok =
    envStatus.anthropicApiKey &&
    envStatus.migrationDatabaseUrl &&
    envStatus.runtimeDatabaseUrl &&
    missingColumns.length === 0 &&
    Boolean(indexRow?.hasIndex) &&
    Boolean(constraintRow?.hasConstraint);

  finish(
    {
      status: ok ? "ready" : "blocked",
      env: envStatus,
      schema: {
        missingColumns,
        hasEntriesUserFocusIndex: Boolean(indexRow?.hasIndex),
        hasContinuationConstraint: Boolean(constraintRow?.hasConstraint),
      },
      focus: focusSummary,
    },
    ok,
  );
} finally {
  await sql.end();
}
