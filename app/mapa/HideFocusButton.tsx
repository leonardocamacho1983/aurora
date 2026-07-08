"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { trackMapaEvent } from "./MapaAnalytics";

export function HideFocusButton({
  className,
  entryId,
  fallbackFocusKey,
  surface = "mapa_focus",
}: {
  className?: string;
  entryId: string;
  fallbackFocusKey?: string | null;
  surface?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      className={className}
      disabled={pending}
      type="button"
      onClick={() => {
        startTransition(async () => {
          trackMapaEvent("product_focus_hide_clicked", {
            source: "mapa",
            surface,
            focus_key: fallbackFocusKey,
          });

          const response = await fetch(`/api/entries/${entryId}/focus`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ surface }),
          });

          if (!response.ok) return;

          const data = (await response.json()) as { focusKey?: string | null };
          const focusKey = data.focusKey ?? fallbackFocusKey;
          if (focusKey) {
            router.replace(`/mapa/${focusKey}?ajustado=1`);
          }
          router.refresh();
        });
      }}
    >
      {pending ? "Removendo..." : "Tirar do Mapa"}
    </button>
  );
}
