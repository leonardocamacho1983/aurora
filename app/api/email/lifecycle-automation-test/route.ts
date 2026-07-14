import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { Resend, type AutomationConnection, type AutomationStep } from "resend";
import { db } from "@/lib/db";
import {
  lifecycleStateFromSignals,
  type AccessStatus,
  type LifecycleContactProperties,
  type RitualStatus,
} from "@/lib/email/lifecycle-contract";
import { recordAuroraLifecycleEvent } from "@/lib/email/lifecycle-events";
import { classifyRitualIntent } from "@/lib/email/ritual-intent";
import { isResendLifecycleSyncEnabled } from "@/lib/email/resend-lifecycle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEST_EMAIL = "leonardocamacho@gmail.com";
const TEST_EVENT = "aurora.lifecycle.test";
const TEMPLATE_ALIAS = "aurora_lifecycle_internal_smoke_v1";
const TEMPLATE_NAME = "Aurora lifecycle internal smoke v1";
const AUTOMATION_NAME = "Aurora - Lifecycle internal smoke";

type TestRow = {
  id: string;
  email: string;
  name: string | null;
  moment: string | null;
  rhythm: string | null;
  presence: string | null;
  value: string | null;
  unlockedAt: Date | null;
  hasAccount: boolean;
  entries: number | string;
  reflectedEntries: number | string;
  activeDays: number | string;
};

type RecentEventRow = {
  eventName: string;
  source: string | null;
  createdAt: Date;
  metadata: Record<string, unknown> | null;
};

function rows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === "object" && "rows" in result) {
    return (result as { rows?: T[] }).rows ?? [];
  }
  return [];
}

function isAuthorized(request: Request) {
  const url = new URL(request.url);
  const adminToken = process.env.WAITLIST_ADMIN_TOKEN?.trim();
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();

  if (adminToken && url.searchParams.get("token") === adminToken) return true;
  if (adminToken && bearer === adminToken) return true;
  return false;
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  return `${name.slice(0, 2)}***@${domain}`;
}

function getResend() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) throw new Error("missing RESEND_API_KEY");
  return new Resend(key);
}

function fromAddress() {
  const from = process.env.EMAIL_FROM?.trim();
  if (!from) throw new Error("missing EMAIL_FROM");
  return from;
}

function templatePayload(from: string) {
  const html = `
    <div style="margin:0;padding:32px;background:#070512;color:#f0ecf7;font-family:Inter,Arial,sans-serif">
      <div style="max-width:560px;margin:0 auto;padding:28px;border:1px solid rgba(255,255,255,.12);border-radius:22px;background:#0e0c1a">
        <div style="font-family:Georgia,serif;font-size:28px;color:#f8f6fc;margin-bottom:18px">Aurora</div>
        <p style="font-size:16px;line-height:1.6;color:#d8d3e6">Teste interno da automacao de lifecycle da Aurora.</p>
        <p style="font-size:15px;line-height:1.6;color:#b8b1ca">Se este email chegou, o fluxo evento interno -> Resend Automation -> template publicado esta funcionando em producao.</p>
        <p style="font-size:14px;line-height:1.6;color:#948fa8">Evento: ${TEST_EVENT}<br>Template: ${TEMPLATE_ALIAS}</p>
      </div>
    </div>
  `;

  return {
    name: TEMPLATE_NAME,
    alias: TEMPLATE_ALIAS,
    from,
    subject: "[Teste interno] Automacao Aurora",
    html,
    text: `Teste interno da automacao de lifecycle da Aurora.\n\nSe este email chegou, o fluxo evento interno -> Resend Automation -> template publicado esta funcionando em producao.\n\nEvento: ${TEST_EVENT}\nTemplate: ${TEMPLATE_ALIAS}`,
  };
}

async function ensureTemplate(client: Resend, from: string) {
  const listed = await client.templates.list({ limit: 100 });
  if (listed.error) throw new Error(listed.error.message);

  const existing = (listed.data?.data ?? []).find(
    (template) => template.alias === TEMPLATE_ALIAS || template.name === TEMPLATE_NAME,
  );
  const payload = templatePayload(from);

  if (existing) {
    const updated = await client.templates.update(existing.id, payload);
    if (updated.error) throw new Error(updated.error.message);

    const published = await client.templates.publish(existing.id);
    if (published.error) throw new Error(published.error.message);

    return { id: existing.id, action: "updated" as const };
  }

  const created = await client.templates.create(payload);
  if (created.error) throw new Error(created.error.message);
  const id = created.data?.id;
  if (!id) throw new Error("template created without id");

  const published = await client.templates.publish(id);
  if (published.error) throw new Error(published.error.message);

  return { id, action: "created" as const };
}

function automationDefinition(templateId: string, from: string) {
  const steps: AutomationStep[] = [
    {
      key: "test_event_received",
      type: "trigger",
      config: { eventName: TEST_EVENT },
    },
    {
      key: "send_internal_smoke_email",
      type: "send_email",
      config: {
        template: { id: templateId },
        from,
        subject: "[Teste interno] Automacao Aurora",
      },
    },
  ];

  const connections: AutomationConnection[] = [
    {
      from: "test_event_received",
      to: "send_internal_smoke_email",
      type: "default",
    },
  ];

  return { steps, connections };
}

async function ensureAutomation(client: Resend, templateId: string, from: string) {
  const listed = await client.automations.list({ limit: 100 });
  if (listed.error) throw new Error(listed.error.message);

  const definition = automationDefinition(templateId, from);
  const existing = (listed.data?.data ?? []).find((automation) => automation.name === AUTOMATION_NAME);

  if (existing) {
    const updated = await client.automations.update(existing.id, {
      name: AUTOMATION_NAME,
      status: "enabled",
      steps: definition.steps,
      connections: definition.connections,
    });
    if (updated.error) throw new Error(updated.error.message);
    return { id: existing.id, action: "updated" as const, status: "enabled" as const };
  }

  const created = await client.automations.create({
    name: AUTOMATION_NAME,
    status: "enabled",
    steps: definition.steps,
    connections: definition.connections,
  });
  if (created.error) throw new Error(created.error.message);
  const id = created.data?.id;
  if (!id) throw new Error("automation created without id");

  return { id, action: "created" as const, status: "enabled" as const };
}

function ritualStatus(row: Pick<TestRow, "moment" | "rhythm" | "presence" | "value">): RitualStatus {
  if (row.moment?.trim() && row.rhythm?.trim() && row.presence?.trim() && row.value?.trim()) {
    return "completed";
  }
  if (row.moment || row.rhythm || row.presence || row.value) return "started";
  return "not_started";
}

async function selectTestRow() {
  return rows<TestRow>(
    await db.execute(sql`
      with product as (
        select
          lower(coalesce(u.email, '')) as email,
          count(distinct e.id)::int as entries,
          count(distinct e.id) filter (
            where e.reflection is not null and nullif(trim(e.reflection), '') is not null
          )::int as reflected_entries,
          count(distinct date_trunc('day', coalesce(e.created_at, pe.created_at) at time zone 'America/Sao_Paulo'))::int as active_days
        from users u
        left join entries e on e.user_id = u.id
        left join product_events pe on pe.user_id = u.id
        where lower(coalesce(u.email, '')) = ${TEST_EMAIL}
        group by lower(coalesce(u.email, ''))
      )
      select
        w.id,
        w.email,
        w.unlocked_at as "unlockedAt",
        wp.name,
        wp.moment,
        wp.rhythm,
        wp.presence,
        wp.value,
        exists (select 1 from users u where lower(u.email) = lower(w.email)) as "hasAccount",
        coalesce(product.entries, 0)::int as entries,
        coalesce(product.reflected_entries, 0)::int as "reflectedEntries",
        coalesce(product.active_days, 0)::int as "activeDays"
      from waitlist w
      left join waitlist_profile wp on wp.waitlist_id = w.id
      left join product on product.email = lower(w.email)
      where lower(w.email) = ${TEST_EMAIL}
      limit 1
    `),
  )[0];
}

function contactFromRow(row: TestRow): LifecycleContactProperties {
  const currentRitualStatus = ritualStatus(row);
  const accessStatus: AccessStatus = row.unlockedAt ? "active" : "no_access";
  const entries = Number(row.entries ?? 0);
  const reflectedEntries = Number(row.reflectedEntries ?? 0);
  const activeDays = Number(row.activeDays ?? 0);

  return {
    waitlistId: row.id,
    email: row.email,
    firstName: row.name,
    ritualStatus: currentRitualStatus,
    ritualIntent: classifyRitualIntent(row),
    accessStatus,
    lifecycleState: lifecycleStateFromSignals({
      ritualStatus: currentRitualStatus,
      accessStatus,
      hasAccount: row.hasAccount,
      hasEntry: entries > 0,
      hasReflection: reflectedEntries > 0,
      activeTester: activeDays >= 2,
    }),
    testerStatus: activeDays >= 2 ? "active" : accessStatus === "active" ? "tester" : "candidate",
    lastProductEventAt: null,
  };
}

async function setupAutomation() {
  const client = getResend();
  const from = fromAddress();
  const template = await ensureTemplate(client, from);
  const automation = await ensureAutomation(client, template.id, from);

  return {
    template,
    automation,
    eventName: TEST_EVENT,
  };
}

async function triggerTestEvent() {
  if (!isResendLifecycleSyncEnabled()) {
    throw new Error("resend lifecycle sync disabled");
  }

  const row = await selectTestRow();
  if (!row) throw new Error("internal test contact not found");
  const contact = contactFromRow(row);

  await recordAuroraLifecycleEvent({
    waitlistId: row.id,
    eventName: TEST_EVENT,
    source: "email_lifecycle_automation_test",
    contact,
    metadata: {
      test_contact: true,
      automation_test: true,
      automation_name: AUTOMATION_NAME,
      template_alias: TEMPLATE_ALIAS,
    },
  });

  return {
    email: maskEmail(row.email),
    waitlistId: row.id,
    eventName: TEST_EVENT,
    lifecycleState: contact.lifecycleState,
    ritualIntent: contact.ritualIntent,
  };
}

async function getReport(client: Resend, automationId?: string) {
  const listed = await client.automations.list({ limit: 100 });
  if (listed.error) throw new Error(listed.error.message);

  const automation = automationId
    ? (listed.data?.data ?? []).find((item) => item.id === automationId) ?? null
    : (listed.data?.data ?? []).find((item) => item.name === AUTOMATION_NAME) ?? null;

  let runs: unknown[] = [];
  if (automation?.id) {
    const listedRuns = await client.automations.runs.list({
      automationId: automation.id,
      limit: 10,
    });
    if (listedRuns.error) throw new Error(listedRuns.error.message);
    runs = listedRuns.data?.data ?? [];
  }

  const row = await selectTestRow();
  const recentEvents = row
    ? rows<RecentEventRow>(
        await db.execute(sql`
          select
            event_name as "eventName",
            source,
            created_at as "createdAt",
            metadata
          from waitlist_events
          where waitlist_id = ${row.id}
            and created_at > now() - interval '2 hours'
            and (
              event_name in (
                'aurora_lifecycle_test',
                'resend_lifecycle_event_sent',
                'resend_lifecycle_event_failed',
                'email_delivered',
                'email_opened',
                'email_clicked',
                'email_failed',
                'email_suppressed'
              )
              or metadata->>'automation_name' = ${AUTOMATION_NAME}
            )
          order by created_at desc
          limit 20
        `),
      )
    : [];

  return {
    automation,
    runs,
    recentEvents,
  };
}

async function run(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get("action") ?? "report";

  try {
    if (action === "setup") {
      const setup = await setupAutomation();
      return NextResponse.json({ status: "ok", action, ...setup });
    }

    if (action === "trigger") {
      const setup = await setupAutomation();
      const trigger = await triggerTestEvent();
      return NextResponse.json({ status: "ok", action, ...setup, trigger });
    }

    if (action === "report") {
      const report = await getReport(getResend());
      return NextResponse.json({ status: "ok", action, eventName: TEST_EVENT, ...report });
    }

    return NextResponse.json({ error: "invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        action,
        message: error instanceof Error ? error.message : "unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
