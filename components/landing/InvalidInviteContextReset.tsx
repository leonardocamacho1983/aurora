"use client";

import { useEffect } from "react";
import { INVITE_CONTEXT_EVENT, INVITE_CONTEXT_KEY, parseInviteContext } from "./invite-context";

type InvalidInviteContextResetProps = {
  token: string;
};

export function InvalidInviteContextReset({ token }: InvalidInviteContextResetProps) {
  useEffect(() => {
    try {
      const context = parseInviteContext(localStorage.getItem(INVITE_CONTEXT_KEY));
      if (context?.statusToken === token) {
        localStorage.removeItem(INVITE_CONTEXT_KEY);
        window.dispatchEvent(new Event(INVITE_CONTEXT_EVENT));
      }
    } catch {
      /* local context is a convenience, not a source of truth */
    }
  }, [token]);

  return null;
}
