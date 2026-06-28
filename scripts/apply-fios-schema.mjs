#!/usr/bin/env node

import crypto from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import postgres from "postgres";

const root = process.cwd();
const args = process.argv.slice(2);

function usage() {
  console.log(`Usage:
  node scripts/apply-fios-schema.mjs [--env .env.development.local] [--reconcile-drizzle-history]

Applies and verifies the Fios schema idempotently.
Use --reconcile-drizzle-history only after the script verifies that older
migration objects are already present in the target database.`);
}

function parseArgs(argv) {
  const options = {
    envPath: "",
    reconcileDrizzleHistory: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    }

    if (arg === "--env") {
      const value = argv[index + 1];
      if (!value) throw new Error("Missing value after --env.");
      options.envPath = value;
      index += 1;
      continue;
    }

    if (arg === "--reconcile-drizzle-history") {
      options.reconcileDrizzleHistory = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function parseEnvLine(line) {
  const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (!match) return null;

  const key = match[1];
  let value = match[2] ?? "";

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  } else {
    value = value.replace(/\s+#.*$/, "").trim();
  }

  return [key, value];
}

function loadEnvFile(envPath) {
  if (!envPath) return;

  const absolutePath = path.resolve(root, envPath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Env file not found: ${envPath}`);
  }

  const content = readFileSync(absolutePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const parsed = parseEnvLine(line);
    if (!parsed) continue;

    const [key, value] = parsed;
    if (process.env[key] === undefined) process.env[key] = value;
  }

  console.log(`ok env loaded from ${envPath}`);
}

function getDatabaseUrl() {
  return (
    process.env.DIRECT_URL ??
    process.env.POSTGRES_URL_NON_POOLING ??
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL
  );
}

async function roleExists(sql, roleName) {
  const [row] = await sql`
    SELECT EXISTS (
      SELECT 1 FROM pg_roles WHERE rolname = ${roleName}
    ) AS ok
  `;
  return Boolean(row?.ok);
}

async function relationExists(sql, relationName) {
  const [row] = await sql`
    SELECT to_regclass(${`public.${relationName}`}) IS NOT NULL AS ok
  `;
  return Boolean(row?.ok);
}

async function tableColumns(sql, tableName) {
  const rows = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ${tableName}
  `;
  return new Set(rows.map((row) => row.column_name));
}

async function hasColumns(sql, tableName, expectedColumns) {
  const columns = await tableColumns(sql, tableName);
  return expectedColumns.every((column) => columns.has(column));
}

async function indexExists(sql, tableName, indexName) {
  const [row] = await sql`
    SELECT EXISTS (
      SELECT 1
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = ${tableName}
        AND indexname = ${indexName}
    ) AS ok
  `;
  return Boolean(row?.ok);
}

async function constraintExists(sql, tableName, constraintName) {
  const [row] = await sql`
    SELECT EXISTS (
      SELECT 1
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname = 'public'
        AND t.relname = ${tableName}
        AND c.conname = ${constraintName}
    ) AS ok
  `;
  return Boolean(row?.ok);
}

async function rlsEnabled(sql, tableName) {
  const [row] = await sql`
    SELECT c.relrowsecurity AS ok
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = ${tableName}
  `;
  return Boolean(row?.ok);
}

async function policyExists(sql, tableName, policyName) {
  const [row] = await sql`
    SELECT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = ${tableName}
        AND policyname = ${policyName}
    ) AS ok
  `;
  return Boolean(row?.ok);
}

async function roleHasTablePrivileges(sql, roleName, tableName, privileges) {
  if (!(await roleExists(sql, roleName))) return true;

  const checks = await Promise.all(
    privileges.map(async (privilege) => {
      const [row] = await sql`
        SELECT has_table_privilege(${roleName}, ${`public.${tableName}`}, ${privilege}) AS ok
      `;
      return Boolean(row?.ok);
    }),
  );

  return checks.every(Boolean);
}

async function applyFiosSchema(sql) {
  await sql.begin(async (transaction) => {
    await transaction`
      CREATE TABLE IF NOT EXISTS public.entry_threads (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        user_id uuid NOT NULL,
        root_entry_id uuid,
        title text,
        summary text,
        status text DEFAULT 'active' NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      )
    `;

    await transaction`ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS thread_id uuid`;
    await transaction`ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS thread_position integer`;
    await transaction`ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS continued_from_entry_id uuid`;
    await transaction`ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS entry_mode text DEFAULT 'new' NOT NULL`;

    await transaction`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'entry_threads_user_id_users_id_fk'
        ) THEN
          ALTER TABLE public.entry_threads
            ADD CONSTRAINT entry_threads_user_id_users_id_fk
            FOREIGN KEY (user_id)
            REFERENCES public.users(id)
            ON DELETE cascade
            ON UPDATE no action;
        END IF;
      END
      $$
    `;

    await transaction`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'entries_thread_id_entry_threads_id_fk'
        ) THEN
          ALTER TABLE public.entries
            ADD CONSTRAINT entries_thread_id_entry_threads_id_fk
            FOREIGN KEY (thread_id)
            REFERENCES public.entry_threads(id)
            ON DELETE set null
            ON UPDATE no action;
        END IF;
      END
      $$
    `;

    await transaction`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'entries_continued_from_entry_id_entries_id_fk'
        ) THEN
          ALTER TABLE public.entries
            ADD CONSTRAINT entries_continued_from_entry_id_entries_id_fk
            FOREIGN KEY (continued_from_entry_id)
            REFERENCES public.entries(id)
            ON DELETE set null
            ON UPDATE no action;
        END IF;
      END
      $$
    `;

    await transaction`
      CREATE INDEX IF NOT EXISTS entry_threads_user_id_idx
      ON public.entry_threads USING btree (user_id)
    `;
    await transaction`
      CREATE INDEX IF NOT EXISTS entry_threads_root_entry_id_idx
      ON public.entry_threads USING btree (root_entry_id)
    `;
    await transaction`
      CREATE INDEX IF NOT EXISTS entries_thread_id_idx
      ON public.entries USING btree (thread_id)
    `;
    await transaction`
      CREATE INDEX IF NOT EXISTS entries_continued_from_entry_id_idx
      ON public.entries USING btree (continued_from_entry_id)
    `;

    await transaction`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.entry_threads TO authenticated;
        END IF;

        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.entry_threads TO service_role;
        END IF;
      END
      $$
    `;

    await transaction`ALTER TABLE public.entry_threads ENABLE ROW LEVEL SECURITY`;
    await transaction`DROP POLICY IF EXISTS entry_threads_all_own ON public.entry_threads`;
    await transaction`
      CREATE POLICY entry_threads_all_own ON public.entry_threads
        FOR ALL TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid())
    `;
  });
}

async function collectChecks(checks) {
  const failures = [];

  for (const [name, check] of checks) {
    const passed = await check();
    if (!passed) failures.push(name);
  }

  return failures;
}

async function verifyFiosSchema(sql) {
  const failures = await collectChecks([
    ["entry_threads table", () => relationExists(sql, "entry_threads")],
    [
      "entry_threads columns",
      () =>
        hasColumns(sql, "entry_threads", [
          "id",
          "user_id",
          "root_entry_id",
          "title",
          "summary",
          "status",
          "created_at",
          "updated_at",
        ]),
    ],
    [
      "entries thread columns",
      () =>
        hasColumns(sql, "entries", [
          "thread_id",
          "thread_position",
          "continued_from_entry_id",
          "entry_mode",
        ]),
    ],
    [
      "entry_threads user foreign key",
      () => constraintExists(sql, "entry_threads", "entry_threads_user_id_users_id_fk"),
    ],
    [
      "entries thread foreign key",
      () => constraintExists(sql, "entries", "entries_thread_id_entry_threads_id_fk"),
    ],
    [
      "entries continued_from foreign key",
      () =>
        constraintExists(
          sql,
          "entries",
          "entries_continued_from_entry_id_entries_id_fk",
        ),
    ],
    ["entry_threads_user_id_idx", () => indexExists(sql, "entry_threads", "entry_threads_user_id_idx")],
    [
      "entry_threads_root_entry_id_idx",
      () => indexExists(sql, "entry_threads", "entry_threads_root_entry_id_idx"),
    ],
    ["entries_thread_id_idx", () => indexExists(sql, "entries", "entries_thread_id_idx")],
    [
      "entries_continued_from_entry_id_idx",
      () => indexExists(sql, "entries", "entries_continued_from_entry_id_idx"),
    ],
    ["entry_threads RLS", () => rlsEnabled(sql, "entry_threads")],
    [
      "entry_threads policy",
      () => policyExists(sql, "entry_threads", "entry_threads_all_own"),
    ],
    [
      "authenticated privileges",
      () =>
        roleHasTablePrivileges(sql, "authenticated", "entry_threads", [
          "SELECT",
          "INSERT",
          "UPDATE",
          "DELETE",
        ]),
    ],
    [
      "service_role privileges",
      () =>
        roleHasTablePrivileges(sql, "service_role", "entry_threads", [
          "SELECT",
          "INSERT",
          "UPDATE",
          "DELETE",
        ]),
    ],
  ]);

  if (failures.length) {
    throw new Error(`Fios schema verification failed: ${failures.join(", ")}`);
  }
}

async function verifyHistoricalMigration(sql, tag) {
  const checksByTag = {
    "0003_brief_spot": [
      [
        "waitlist referral columns",
        () =>
          hasColumns(sql, "waitlist", [
            "referral_code",
            "status_token",
            "confirm_token",
            "referred_by_code",
            "confirmed_at",
            "unlocked_at",
            "milestone_notified",
          ]),
      ],
      [
        "waitlist referral index",
        () => indexExists(sql, "waitlist", "waitlist_referred_by_code_idx"),
      ],
      [
        "waitlist confirmed referral index",
        () => indexExists(sql, "waitlist", "waitlist_confirmed_referral_idx"),
      ],
      [
        "waitlist referral unique",
        () => constraintExists(sql, "waitlist", "waitlist_referral_code_unique"),
      ],
      [
        "waitlist status token unique",
        () => constraintExists(sql, "waitlist", "waitlist_status_token_unique"),
      ],
      [
        "waitlist confirm token unique",
        () => constraintExists(sql, "waitlist", "waitlist_confirm_token_unique"),
      ],
      ["waitlist RLS", () => rlsEnabled(sql, "waitlist")],
    ],
    "0004_complex_cammi": [
      ["waitlist_events table", () => relationExists(sql, "waitlist_events")],
      ["waitlist_profile table", () => relationExists(sql, "waitlist_profile")],
      [
        "waitlist_events columns",
        () =>
          hasColumns(sql, "waitlist_events", [
            "id",
            "waitlist_id",
            "event_name",
            "source",
            "metadata",
            "created_at",
          ]),
      ],
      [
        "waitlist_profile columns",
        () =>
          hasColumns(sql, "waitlist_profile", [
            "waitlist_id",
            "name",
            "moment",
            "rhythm",
            "presence",
            "value",
            "created_at",
            "updated_at",
          ]),
      ],
      [
        "waitlist_events waitlist foreign key",
        () =>
          constraintExists(
            sql,
            "waitlist_events",
            "waitlist_events_waitlist_id_waitlist_id_fk",
          ),
      ],
      [
        "waitlist_profile waitlist foreign key",
        () =>
          constraintExists(
            sql,
            "waitlist_profile",
            "waitlist_profile_waitlist_id_waitlist_id_fk",
          ),
      ],
      [
        "waitlist_events waitlist index",
        () => indexExists(sql, "waitlist_events", "waitlist_events_waitlist_id_idx"),
      ],
      [
        "waitlist_events event index",
        () => indexExists(sql, "waitlist_events", "waitlist_events_event_name_idx"),
      ],
      ["waitlist_events RLS", () => rlsEnabled(sql, "waitlist_events")],
      ["waitlist_profile RLS", () => rlsEnabled(sql, "waitlist_profile")],
    ],
    "0005_sad_rawhide_kid": [
      [
        "users onboarding columns",
        () => hasColumns(sql, "users", ["onboarding_completed_at", "onboarding_context"]),
      ],
    ],
    "0006_adorable_mandrill": [
      [
        "fios schema",
        async () => {
          await verifyFiosSchema(sql);
          return true;
        },
      ],
    ],
  };

  const checks = checksByTag[tag];
  if (!checks) throw new Error(`No evidence checks configured for ${tag}.`);

  const failures = await collectChecks(checks);
  if (failures.length) {
    throw new Error(
      `Cannot mark ${tag} as applied. Missing evidence: ${failures.join(", ")}`,
    );
  }
}

function migrationHash(tag) {
  const migrationPath = path.join(root, "drizzle", `${tag}.sql`);
  if (!existsSync(migrationPath)) throw new Error(`Missing migration file: ${migrationPath}`);

  return crypto.createHash("sha256").update(readFileSync(migrationPath)).digest("hex");
}

function journalEntry(tag) {
  const journalPath = path.join(root, "drizzle", "meta", "_journal.json");
  const journal = JSON.parse(readFileSync(journalPath, "utf8"));
  const entry = journal.entries.find((candidate) => candidate.tag === tag);
  if (!entry) throw new Error(`Missing journal entry for ${tag}.`);
  return entry;
}

async function ensureDrizzleHistoryTable(sql) {
  await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;
  await sql`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `;
}

async function reconcileDrizzleHistory(sql) {
  await ensureDrizzleHistoryTable(sql);

  const tags = [
    "0003_brief_spot",
    "0004_complex_cammi",
    "0005_sad_rawhide_kid",
    "0006_adorable_mandrill",
  ];
  const inserted = [];
  const existing = [];

  await sql.begin(async (transaction) => {
    for (const tag of tags) {
      await verifyHistoricalMigration(transaction, tag);

      const entry = journalEntry(tag);
      const hash = migrationHash(tag);
      const rows = await transaction`
        SELECT id, hash, created_at
        FROM drizzle.__drizzle_migrations
        WHERE created_at = ${entry.when}
      `;

      if (rows.length > 0) {
        if (rows[0].hash !== hash) {
          throw new Error(
            `Drizzle history hash mismatch for ${tag}. Existing row was not changed.`,
          );
        }
        existing.push(tag);
        continue;
      }

      await transaction`
        INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
        VALUES (${hash}, ${entry.when})
      `;
      inserted.push(tag);
    }
  });

  if (inserted.length) {
    console.log(`ok drizzle history reconciled: inserted ${inserted.join(", ")}`);
  } else {
    console.log("ok drizzle history already reconciled");
  }

  if (existing.length) {
    console.log(`ok existing drizzle rows: ${existing.join(", ")}`);
  }
}

const options = parseArgs(args);
loadEnvFile(options.envPath);

const databaseUrl = getDatabaseUrl();
if (!databaseUrl) {
  throw new Error(
    "Missing database URL. Set DIRECT_URL, POSTGRES_URL_NON_POOLING, DATABASE_URL, or POSTGRES_URL.",
  );
}

const ssl = /supabase\.(co|com)|pooler\.supabase\./.test(databaseUrl)
  ? "require"
  : undefined;
const sql = postgres(databaseUrl, {
  max: 1,
  ssl,
  onnotice: () => {},
});

try {
  await applyFiosSchema(sql);
  console.log("ok fios schema applied");

  await verifyFiosSchema(sql);
  console.log("ok fios schema verified");

  if (options.reconcileDrizzleHistory) {
    await reconcileDrizzleHistory(sql);
  }
} finally {
  await sql.end();
}
