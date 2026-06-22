"use client";

import { useEffect, useState } from "react";
import { INVITE_CONTEXT_EVENT, readInviteContext, type AuroraInviteContext } from "./invite-context";

export function useInviteContext() {
  const [context, setContext] = useState<AuroraInviteContext | null>(null);

  useEffect(() => {
    function refresh() {
      setContext(readInviteContext());
    }

    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener(INVITE_CONTEXT_EVENT, refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(INVITE_CONTEXT_EVENT, refresh);
    };
  }, []);

  return context;
}
