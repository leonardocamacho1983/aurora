export type AuroraInviteContext = {
  name?: string;
  confirmed?: boolean;
  confirmedCount?: number;
  referralCode?: string;
  statusToken?: string;
  savedAt?: number;
};

export const INVITE_CONTEXT_KEY = "aurora_invite_context";
export const INVITE_CONTEXT_TTL = 30 * 24 * 60 * 60 * 1000;
export const INVITE_CONTEXT_EVENT = "aurora_invite_context_changed";

export function parseInviteContext(raw: string | null): AuroraInviteContext | null {
  if (!raw) return null;

  try {
    const data = JSON.parse(raw) as AuroraInviteContext;
    if (!data || typeof data !== "object") return null;
    if (typeof data.statusToken !== "string" || !data.statusToken) return null;

    return {
      name: typeof data.name === "string" ? data.name.trim().slice(0, 40) : "",
      confirmed: Boolean(data.confirmed),
      confirmedCount: Number.isFinite(data.confirmedCount) ? Number(data.confirmedCount) : 0,
      referralCode: typeof data.referralCode === "string" ? data.referralCode : "",
      statusToken: data.statusToken,
      savedAt: Number.isFinite(data.savedAt) ? Number(data.savedAt) : undefined,
    };
  } catch {
    return null;
  }
}

export function isInviteContextFresh(context: AuroraInviteContext | null, ttl = INVITE_CONTEXT_TTL) {
  if (!context?.statusToken) return false;
  if (!context.savedAt) return true;
  return Date.now() - context.savedAt < ttl;
}

export function readInviteContext(ttl = INVITE_CONTEXT_TTL): AuroraInviteContext | null {
  if (typeof window === "undefined") return null;
  const context = parseInviteContext(localStorage.getItem(INVITE_CONTEXT_KEY));
  return isInviteContextFresh(context, ttl) ? context : null;
}

export function writeInviteContext(update: AuroraInviteContext) {
  if (typeof window === "undefined") return;

  try {
    const existing = parseInviteContext(localStorage.getItem(INVITE_CONTEXT_KEY)) ?? {};
    const next = {
      ...existing,
      ...update,
      savedAt: Date.now(),
    };
    localStorage.setItem(INVITE_CONTEXT_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(INVITE_CONTEXT_EVENT));
  } catch {
    /* local context is a convenience, not a source of truth */
  }
}
