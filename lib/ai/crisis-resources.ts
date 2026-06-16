/**
 * Recursos de crise por locale (§8). Inegociável:
 *  - mensagem de acolhimento + linha de apoio LOCAL;
 *  - deixa claro que a Aurora não substitui emergência;
 *  - NUNCA descreve métodos.
 * Começa por pt-BR (CVV 188) e expande conforme os mercados (ES/FR/DE).
 */

export interface SupportLine {
  name: string;
  contact: string;
  note?: string;
}

export interface CrisisResources {
  locale: string;
  message: string;
  lines: SupportLine[];
  disclaimer: string;
}

const PT_BR: CrisisResources = {
  locale: "pt-BR",
  message:
    "O que você está sentindo importa, e você não precisa passar por isso sozinho(a). Falar com alguém agora pode ajudar.",
  lines: [
    {
      name: "CVV — Centro de Valorização da Vida",
      contact: "188",
      note: "Ligação gratuita, 24h, sigilosa.",
    },
  ],
  disclaimer:
    "A Aurora não substitui atendimento de emergência. Se houver risco imediato, procure o serviço de emergência local (192 / 190).",
};

// Fallback honesto: não inventa números de outros países. Será expandido (§8).
function fallbackFor(locale: string): CrisisResources {
  return {
    locale,
    message:
      "O que você está sentindo importa, e você não precisa passar por isso sozinho(a). Procurar apoio agora pode ajudar.",
    lines: [],
    disclaimer:
      "A Aurora não substitui atendimento de emergência. Procure imediatamente o serviço de emergência ou uma linha de apoio à vida local.",
  };
}

const REGISTRY: Record<string, CrisisResources> = {
  "pt-BR": PT_BR,
  pt: PT_BR,
};

/** Resolve por locale exato, depois pela língua base; senão fallback. */
export function getCrisisResources(locale: string | undefined | null): CrisisResources {
  if (!locale) return PT_BR;
  const exact = REGISTRY[locale];
  if (exact) return exact;
  const base = locale.split("-")[0];
  if (REGISTRY[base]) return REGISTRY[base];
  return fallbackFor(locale);
}
