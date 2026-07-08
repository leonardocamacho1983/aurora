import { existsSync, readFileSync } from "node:fs";
import { and, desc, eq, isNotNull, isNull, ne, or } from "drizzle-orm";

function loadLocalEnv() {
  for (const file of [".env", ".env.local", ".env.development.local"]) {
    if (!existsSync(file)) continue;
    const raw = readFileSync(file, "utf8");
    for (const line of raw.split("\n")) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (value && process.env[match[1]] === undefined) process.env[match[1]] = value;
    }
  }
}

function argValue(name: string, fallback: string) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

loadLocalEnv();

const [{ db }, { entries }, { classifyEntryFocusForStorage }, { FOCUS_KEYS }] = await Promise.all([
  import("../lib/db"),
  import("../lib/db/schema"),
  import("../lib/mapa/focus-classifier"),
  import("../lib/mapa/focus"),
]);

const limit = Math.max(1, Math.min(Number(argValue("limit", "40")) || 40, 240));
const delayMs = Math.max(0, Math.min(Number(argValue("delay-ms", "1500")) || 0, 10_000));
const maxConsecutiveFailures = Math.max(1, Math.min(Number(argValue("max-consecutive-failures", "5")) || 5, 20));
const dryRun = process.argv.includes("--dry-run");
const reclassify = process.argv.includes("--reclassify");
const targetFocusKey = argValue("focus-key", "").trim();

if (targetFocusKey && !FOCUS_KEYS.includes(targetFocusKey as (typeof FOCUS_KEYS)[number])) {
  console.error(
    JSON.stringify({
      status: "invalid_focus_key",
      focusKey: targetFocusKey,
      allowed: FOCUS_KEYS,
    }),
  );
  process.exit(1);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const rows = await db
  .select({
    id: entries.id,
    transcript: entries.transcript,
    reflection: entries.reflection,
    mood: entries.mood,
  })
  .from(entries)
  .where(
    reclassify
      ? and(
          ne(entries.riskLevel, "high"),
          targetFocusKey ? eq(entries.focusKey, targetFocusKey) : isNotNull(entries.focusClassifiedAt),
          or(isNotNull(entries.transcript), isNotNull(entries.reflection)),
        )
      : and(
          isNull(entries.focusClassifiedAt),
          ne(entries.riskLevel, "high"),
          or(isNull(entries.focusConfidence), eq(entries.focusConfidence, "low")),
          or(isNotNull(entries.transcript), isNotNull(entries.reflection)),
        ),
  )
  .orderBy(desc(entries.createdAt))
  .limit(limit);

let withFocus = 0;
let none = 0;
let failed = 0;
let consecutiveFailures = 0;

for (const [index, row] of rows.entries()) {
  if (delayMs && index > 0) await sleep(delayMs);

  const focus = await classifyEntryFocusForStorage({
    transcript: row.transcript,
    reflection: row.reflection,
    mood: row.mood,
  });

  if (!focus.focusClassifiedAt) {
    failed += 1;
    consecutiveFailures += 1;
    if (consecutiveFailures >= maxConsecutiveFailures) {
      console.log(
        JSON.stringify({
          status: "stopped_after_consecutive_failures",
          processed: index + 1,
          total: rows.length,
          withFocus,
          none,
          failed,
          dryRun,
          reclassify,
          focusKey: targetFocusKey || null,
        }),
      );
      break;
    }
    continue;
  }

  consecutiveFailures = 0;
  if (focus.focusKey) withFocus += 1;
  else none += 1;

  if (!dryRun) {
    await db.update(entries).set(focus).where(eq(entries.id, row.id));
  }

  if ((index + 1) % 10 === 0 || index + 1 === rows.length) {
    console.log(
      JSON.stringify({
        processed: index + 1,
        total: rows.length,
        withFocus,
        none,
        failed,
        dryRun,
        reclassify,
        focusKey: targetFocusKey || null,
      }),
    );
  }
}

console.log(
  JSON.stringify({
    status: "done",
    selected: rows.length,
    withFocus,
    none,
    failed,
    dryRun,
    reclassify,
    focusKey: targetFocusKey || null,
  }),
);

process.exit(0);
