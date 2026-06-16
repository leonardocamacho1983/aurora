import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";

// Locales suportados (handoff §1). pt-BR é o padrão.
export const SUPPORTED_LOCALES = ["pt-BR", "es", "fr", "de", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "pt-BR";

/** Negocia o melhor locale suportado a partir do header Accept-Language. */
function negotiateLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const requested = acceptLanguage
    .split(",")
    .map((part) => part.split(";")[0]?.trim().toLowerCase())
    .filter(Boolean) as string[];

  for (const req of requested) {
    const exact = SUPPORTED_LOCALES.find((l) => l.toLowerCase() === req);
    if (exact) return exact;

    const base = req.split("-")[0];
    const byBase = SUPPORTED_LOCALES.find(
      (l) => l.toLowerCase().split("-")[0] === base,
    );
    if (byBase) return byBase;
  }

  return DEFAULT_LOCALE;
}

export default getRequestConfig(async () => {
  // Fase 1 (base): detecta pelo Accept-Language. Cookie/preferência do usuário
  // entram quando houver conta (item 4c / Fase 3).
  const requestHeaders = await headers();
  const locale = negotiateLocale(requestHeaders.get("accept-language"));

  const messages = (await import(`../messages/${locale}.json`)).default;

  return { locale, messages };
});
