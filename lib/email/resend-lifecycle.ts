import { Resend } from "resend";
import {
  eventTopic,
  lifecycleSegmentsForContact,
  RESEND_SEGMENTS,
  RESEND_TOPICS,
  type AuroraLifecycleEventName,
  type LifecycleContactProperties,
  type ResendSegmentKey,
} from "@/lib/email/lifecycle-contract";

type ResendNameId = { id: string; name: string };

let resend: Resend | null = null;
let segmentCache: Map<string, string> | null = null;
let topicCache: Map<string, string> | null = null;
let eventCache: Set<string> | null = null;

function getResend() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  resend ??= new Resend(key);
  return resend;
}

export function isResendLifecycleSyncEnabled() {
  const value = process.env.RESEND_LIFECYCLE_SYNC_ENABLED?.trim().toLowerCase();
  return value === "1" || value === "true";
}

function canManageAudience() {
  const value = process.env.RESEND_LIFECYCLE_MANAGE_AUDIENCE?.trim().toLowerCase();
  return value === "1" || value === "true";
}

function cleanProperty(value: string | number | null | undefined) {
  if (value === undefined) return null;
  if (typeof value === "string") return value.slice(0, 500);
  return value;
}

async function getSegments(client: Resend) {
  if (segmentCache) return segmentCache;
  const response = await client.segments.list();
  if (response.error) throw new Error(response.error.message);
  segmentCache = new Map(
    ((response.data?.data ?? []) as ResendNameId[]).map((segment) => [segment.name, segment.id]),
  );
  return segmentCache;
}

async function getTopics(client: Resend) {
  if (topicCache) return topicCache;
  const response = await client.topics.list();
  if (response.error) throw new Error(response.error.message);
  topicCache = new Map(((response.data?.data ?? []) as ResendNameId[]).map((topic) => [topic.name, topic.id]));
  return topicCache;
}

async function getEvents(client: Resend) {
  if (eventCache) return eventCache;
  const response = await client.events.list();
  if (response.error) throw new Error(response.error.message);
  eventCache = new Set((response.data?.data ?? []).map((event) => event.name));
  return eventCache;
}

async function segmentId(client: Resend, key: ResendSegmentKey) {
  const name = RESEND_SEGMENTS[key].name;
  const segments = await getSegments(client);
  const existing = segments.get(name);
  if (existing) return existing;
  if (!canManageAudience()) return null;

  const created = await client.segments.create({ name });
  if (created.error) throw new Error(created.error.message);
  const id = created.data?.id ?? null;
  if (id) segments.set(name, id);
  return id;
}

async function topicId(client: Resend, key: keyof typeof RESEND_TOPICS) {
  const definition = RESEND_TOPICS[key];
  const topics = await getTopics(client);
  const existing = topics.get(definition.name);
  if (existing) return existing;
  if (!canManageAudience()) return null;

  const created = await client.topics.create({
    name: definition.name,
    description: definition.description,
    defaultSubscription: definition.defaultSubscription,
  });
  if (created.error) throw new Error(created.error.message);
  const id = created.data?.id ?? null;
  if (id) topics.set(definition.name, id);
  return id;
}

async function ensureEvent(client: Resend, eventName: AuroraLifecycleEventName) {
  const events = await getEvents(client);
  if (events.has(eventName)) return;
  if (!canManageAudience()) return;

  const created = await client.events.create({ name: eventName, schema: null });
  if (created.error) throw new Error(created.error.message);
  events.add(eventName);
}

async function upsertContact(client: Resend, contact: LifecycleContactProperties) {
  const properties = {
    waitlist_id: cleanProperty(contact.waitlistId),
    ritual_status: cleanProperty(contact.ritualStatus),
    ritual_intent: cleanProperty(contact.ritualIntent),
    access_status: cleanProperty(contact.accessStatus),
    lifecycle_state: cleanProperty(contact.lifecycleState),
    tester_status: cleanProperty(contact.testerStatus),
    last_product_event_at: cleanProperty(contact.lastProductEventAt),
  };

  const existing = await client.contacts.get({ email: contact.email });
  if (existing.data) {
    const updated = await client.contacts.update({
      email: contact.email,
      firstName: contact.firstName ?? null,
      properties,
    });
    if (updated.error) throw new Error(updated.error.message);
    return updated.data?.id ?? existing.data.id;
  }

  const created = await client.contacts.create({
    email: contact.email,
    firstName: contact.firstName ?? undefined,
    properties,
  });
  if (created.error) throw new Error(created.error.message);
  return created.data?.id ?? null;
}

export async function syncResendLifecycleContact(contact: LifecycleContactProperties) {
  if (!isResendLifecycleSyncEnabled()) return { skipped: true as const };
  const client = getResend();
  if (!client) return { skipped: true as const, reason: "missing_resend_api_key" };

  const contactId = await upsertContact(client, contact);
  const segmentKeys = lifecycleSegmentsForContact(contact);
  const segments = await Promise.all(segmentKeys.map((key) => segmentId(client, key)));

  for (const id of segments.filter(Boolean)) {
    const added = await client.contacts.segments.add({ email: contact.email, segmentId: id as string });
    if (added.error && !added.error.message.toLowerCase().includes("already")) {
      throw new Error(added.error.message);
    }
  }

  return { skipped: false as const, contactId, segments: segments.filter(Boolean) };
}

export async function sendResendLifecycleEvent(input: {
  eventName: AuroraLifecycleEventName;
  contact: LifecycleContactProperties;
  payload?: Record<string, unknown>;
}) {
  if (!isResendLifecycleSyncEnabled()) return { skipped: true as const };
  const client = getResend();
  if (!client) return { skipped: true as const, reason: "missing_resend_api_key" };

  await syncResendLifecycleContact(input.contact);
  await ensureEvent(client, input.eventName);

  const topic = eventTopic(input.eventName);
  const id = await topicId(client, topic);
  if (id) {
    const updated = await client.contacts.topics.update({
      email: input.contact.email,
      topics: [{ id, subscription: "opt_in" }],
    });
    if (updated.error) throw new Error(updated.error.message);
  }

  const event = await client.events.send({
    event: input.eventName,
    email: input.contact.email,
    payload: {
      ...input.payload,
      topic,
      ritual_status: input.contact.ritualStatus,
      ritual_intent: input.contact.ritualIntent,
      access_status: input.contact.accessStatus,
      lifecycle_state: input.contact.lifecycleState,
      tester_status: input.contact.testerStatus,
    },
  });
  if (event.error) throw new Error(event.error.message);
  return { skipped: false as const, event: event.data?.event };
}
